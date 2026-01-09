import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Client as QStash } from "@upstash/qstash";

export const runtime = "nodejs";

const qstash = new QStash({ token: process.env.QSTASH_TOKEN! });

const COST_PER_JOB = 4;

// Pin a specific model version to avoid schema surprises.
// Schema reference: https://replicate.com/jagilley/controlnet-canny/versions/aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613/api
const MODEL =
  "jagilley/controlnet-canny:aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613";

function paramsFromIntensity(intensity: "low" | "medium" | "high") {
  if (intensity === "low") {
    return { low_threshold: 50, high_threshold: 150, eta: 0.0 };
  }
  if (intensity === "medium") {
    return { low_threshold: 100, high_threshold: 200, eta: 0.2 };
  }
  return { low_threshold: 150, high_threshold: 250, eta: 0.4 };
}

async function refundIfCharged(userId: string, jobId: string) {
  // se già rimborsato, stop (idempotenza)
  const { data: alreadyRefunded } = await supabaseAdmin
    .from("credit_ledger")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .in("reason", ["job_refund_failed", "free_quota_refund_failed"])
    .limit(1);

  if (alreadyRefunded && alreadyRefunded.length > 0) return;

  // trova charge originale
  const { data: ledgerRows } = await supabaseAdmin
    .from("credit_ledger")
    .select("reason,delta")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .limit(50);

  const charge = (ledgerRows ?? []).find(
    (r: any) =>
      r.delta === -COST_PER_JOB &&
      (r.reason === "job_charge" || r.reason === "free_quota_used")
  );

  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("credits,free_used")
    .eq("id", userId)
    .single();

  if (!userRow || !charge) return;

  if (charge.reason === "job_charge") {
    await supabaseAdmin
      .from("users")
      .update({ credits: (userRow.credits ?? 0) + COST_PER_JOB })
      .eq("id", userId);

    await supabaseAdmin.from("credit_ledger").insert({
      user_id: userId,
      job_id: jobId,
      delta: +COST_PER_JOB,
      reason: "job_refund_failed",
    });
  } else {
    await supabaseAdmin
      .from("users")
      .update({
        free_used: Math.max(0, (userRow.free_used ?? 0) - COST_PER_JOB),
      })
      .eq("id", userId);

    await supabaseAdmin.from("credit_ledger").insert({
      user_id: userId,
      job_id: jobId,
      delta: +COST_PER_JOB,
      reason: "free_quota_refund_failed",
    });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const inputImageUrl = body?.inputImageUrl as string | undefined;
  const roomType = body?.roomType as string | undefined;
  const style = body?.style as string | undefined;
  const intensity = body?.intensity as "low" | "medium" | "high" | undefined;

  if (!inputImageUrl || !roomType || !style || !intensity) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  // ensure user exists
  await supabaseAdmin
    .from("users")
    .upsert({ id: userId }, { onConflict: "id" });

  // load credits
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("users")
    .select("credits, free_used")
    .eq("id", userId)
    .single();

  if (userErr || !userRow)
    return Response.json({ error: "db_error" }, { status: 500 });

  // Free quota: 5 images total (so only 1 job + 1 extra image wouldn't fit). Tweak later.
  const isFreeEligible = userRow.free_used + COST_PER_JOB <= 5;
  const canPay = userRow.credits >= COST_PER_JOB;

  if (!isFreeEligible && !canPay) {
    return Response.json({ error: "insufficient_credits" }, { status: 402 });
  }

  const intensityParams = paramsFromIntensity(intensity);

  const params = {
    num_samples: String(4),
    image_resolution: String(512),
    ddim_steps: 30,
    scale: 8.5,
    a_prompt:
      "no text, no watermark, no logo, best quality, extremely detailed, interior design, magazine photo",
    n_prompt:
      "text, watermark, logo, signature, letters, words, typography, caption, brand, label, " +
      "distorted architecture, warped walls, extra windows, missing doors, crooked perspective, fisheye, unrealistic scale, duplicate furniture, clutter, low quality, artifacts",
    ...intensityParams,
  };

  const { data: job, error: jobErr } = await supabaseAdmin
    .from("jobs")
    .insert({
      user_id: userId,
      status: "queued",
      room_type: roomType,
      style,
      intensity,
      model: MODEL,
      params,
      input_image_url: inputImageUrl,
    })
    .select("id")
    .single();

  if (jobErr || !job)
    return Response.json({ error: "job_create_failed" }, { status: 500 });

  // charge now (anti-abuse)
  if (isFreeEligible) {
    await supabaseAdmin
      .from("users")
      .update({ free_used: userRow.free_used + COST_PER_JOB })
      .eq("id", userId);

    await supabaseAdmin.from("credit_ledger").insert({
      user_id: userId,
      job_id: job.id,
      delta: -COST_PER_JOB,
      reason: "free_quota_used",
    });
  } else {
    await supabaseAdmin
      .from("users")
      .update({ credits: userRow.credits - COST_PER_JOB })
      .eq("id", userId);

    await supabaseAdmin.from("credit_ledger").insert({
      user_id: userId,
      job_id: job.id,
      delta: -COST_PER_JOB,
      reason: "job_charge",
    });
  }

  // enqueue worker call (QStash)
  const baseUrl = process.env.APP_URL ?? new URL(req.url).origin;

  try {
    await qstash.publishJSON({
      url: `${baseUrl}/api/worker/run-job`,
      body: { jobId: job.id },
    });
  } catch (e: any) {
    // segna il job come failed (non queued)
    await supabaseAdmin
      .from("jobs")
      .update({
        status: "failed",
        error: `enqueue_failed: ${String(e?.message ?? e)}`,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // rimborsa crediti/free quota
    await refundIfCharged(userId, job.id);

    return Response.json({ error: "enqueue_failed" }, { status: 502 });
  }

  return Response.json({ jobId: job.id });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
  const before = url.searchParams.get("before"); // ISO date cursor opzionale

  let q = supabaseAdmin
    .from("jobs")
    .select(
      "id,created_at,status,room_type,style,intensity, job_outputs(index,image_url)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) q = q.lt("created_at", before);

  const { data, error } = await q;
  if (error) return Response.json({ error: "db_error" }, { status: 500 });

  const items = (data ?? []).map((j: any) => ({
    ...j,
    job_outputs: (j.job_outputs ?? []).sort(
      (a: any, b: any) => a.index - b.index
    ),
  }));

  const nextCursor =
    items.length > 0 ? items[items.length - 1].created_at : null;

  return Response.json({ items, nextCursor });
}
