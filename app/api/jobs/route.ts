import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Client as QStash } from "@upstash/qstash";

export const runtime = "nodejs";

const qstash = new QStash({ token: process.env.QSTASH_TOKEN! });

const COST_PER_JOB = 4;

// Pin a specific model version to avoid schema surprises.
// Schema reference: https://replicate.com/jagilley/controlnet-canny/versions/aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613/api
const MODEL = "jagilley/controlnet-canny:aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613";

function paramsFromIntensity(intensity: "low" | "medium" | "high") {
  if (intensity === "low") {
    return { low_threshold: 50, high_threshold: 150, eta: 0.0 };
  }
  if (intensity === "medium") {
    return { low_threshold: 100, high_threshold: 200, eta: 0.2 };
  }
  return { low_threshold: 150, high_threshold: 250, eta: 0.4 };
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
  await supabaseAdmin.from("users").upsert({ id: userId }, { onConflict: "id" });

  // load credits
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("users")
    .select("credits, free_used")
    .eq("id", userId)
    .single();

  if (userErr || !userRow) return Response.json({ error: "db_error" }, { status: 500 });

  // Free quota: 5 images total (so only 1 job + 1 extra image wouldn't fit). Tweak later.
  const isFreeEligible = userRow.free_used + COST_PER_JOB <= 5;
  const canPay = userRow.credits >= COST_PER_JOB;

  if (!isFreeEligible && !canPay) {
    return Response.json({ error: "insufficient_credits" }, { status: 402 });
  }

  const intensityParams = paramsFromIntensity(intensity);

  const params = {
    // controlnet-canny schema
    num_samples: 4,
    image_resolution: 512,
    ddim_steps: 30,
    scale: 8.5,
    a_prompt: "best quality, extremely detailed, interior design, magazine photo",
    n_prompt: "distorted architecture, warped walls, extra windows, missing doors, crooked perspective, fisheye, unrealistic scale, duplicate furniture, clutter, text, watermark, low quality, artifacts",
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

  if (jobErr || !job) return Response.json({ error: "job_create_failed" }, { status: 500 });

  // charge now (anti-abuse)
  if (isFreeEligible) {
    await supabaseAdmin
      .from("users")
      .update({ free_used: userRow.free_used + COST_PER_JOB })
      .eq("id", userId);

    await supabaseAdmin
      .from("credit_ledger")
      .insert({ user_id: userId, job_id: job.id, delta: -COST_PER_JOB, reason: "free_quota_used" });
  } else {
    await supabaseAdmin
      .from("users")
      .update({ credits: userRow.credits - COST_PER_JOB })
      .eq("id", userId);

    await supabaseAdmin
      .from("credit_ledger")
      .insert({ user_id: userId, job_id: job.id, delta: -COST_PER_JOB, reason: "job_charge" });
  }

  // enqueue worker call (QStash)
  await qstash.publishJSON({
    url: `${process.env.APP_URL}/api/worker/run-job`,
    body: { jobId: job.id },
  });

  return Response.json({ jobId: job.id });
}
