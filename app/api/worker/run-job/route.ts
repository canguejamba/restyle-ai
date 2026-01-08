import Replicate from "replicate";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

export const runtime = "nodejs";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
const COST_PER_JOB = 4;

async function toUrl(item: any): Promise<string> {
  if (typeof item === "string") return item;
  if (item && typeof item.url === "function") return await item.url();
  if (item && typeof item.href === "string") return item.href;
  return String(item);
}

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const { jobId } = await req.json();

  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("id,user_id,status,model,params,input_image_url,room_type,style")
    .eq("id", jobId)
    .single();

  if (!job) return Response.json({ ok: false }, { status: 404 });
  if (job.status !== "queued") return Response.json({ ok: true }); // idempotent

  await supabaseAdmin
    .from("jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  const prompt =
    `${job.room_type} interior restyling, ${job.style} style, aesthetically pleasing, high-end design, cohesive furniture, realistic materials, natural lighting, magazine photo. ` +
    `Preserve original room layout, perspective, windows and doors positions, same camera angle.`;

  try {
    const output = await replicate.run(job.model as any, {
      input: {
        image: job.input_image_url,
        prompt,
        ...(job.params ?? {}),
      },
    });

    const arr = Array.isArray(output) ? output : (output as any)?.output ?? [];
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("no_outputs");

    const urls = await Promise.all(arr.slice(0, 4).map(toUrl));
    const inserts = urls.map((url, idx) => ({
      job_id: jobId,
      image_url: url,
      index: idx,
    }));

    const { error: outErr } = await supabaseAdmin
      .from("job_outputs")
      .insert(inserts);
    if (outErr) throw new Error("db_insert_outputs_failed");

    await supabaseAdmin
      .from("jobs")
      .update({ status: "succeeded", finished_at: new Date().toISOString() })
      .eq("id", jobId);

    return Response.json({ ok: true });
  } catch (e: any) {
    await supabaseAdmin
      .from("jobs")
      .update({
        status: "failed",
        error: String(e?.message ?? "unknown_error"),
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // ---- IDENTITY / IDEMPOTENCY GUARD ----
    // Se abbiamo già rimborsato questo job, non fare nulla.
    const { data: alreadyRefunded } = await supabaseAdmin
      .from("credit_ledger")
      .select("id,reason")
      .eq("job_id", jobId)
      .eq("user_id", job.user_id)
      .in("reason", ["job_refund_failed", "free_quota_refund_failed"])
      .limit(1);

    if (alreadyRefunded && alreadyRefunded.length > 0) {
      // IMPORTANT: rispondi 200 per fermare i retry di QStash
      return Response.json({ ok: false, refunded: true }, { status: 200 });
    }

    // ---- detect how it was charged ----
    const { data: ledgerRows } = await supabaseAdmin
      .from("credit_ledger")
      .select("reason,delta")
      .eq("job_id", jobId)
      .eq("user_id", job.user_id)
      .limit(50);

    const charge = (ledgerRows ?? []).find(
      (r: any) =>
        r.delta === -COST_PER_JOB &&
        (r.reason === "job_charge" || r.reason === "free_quota_used")
    );

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("credits,free_used")
      .eq("id", job.user_id)
      .single();

    if (userRow && charge?.reason === "job_charge") {
      await supabaseAdmin
        .from("users")
        .update({ credits: (userRow.credits ?? 0) + COST_PER_JOB })
        .eq("id", job.user_id);

      await supabaseAdmin.from("credit_ledger").insert({
        user_id: job.user_id,
        job_id: jobId,
        delta: +COST_PER_JOB,
        reason: "job_refund_failed",
      });
    }

    if (userRow && charge?.reason === "free_quota_used") {
      await supabaseAdmin
        .from("users")
        .update({
          free_used: Math.max(0, (userRow.free_used ?? 0) - COST_PER_JOB),
        })
        .eq("id", job.user_id);

      await supabaseAdmin.from("credit_ledger").insert({
        user_id: job.user_id,
        job_id: jobId,
        delta: +COST_PER_JOB,
        reason: "free_quota_refund_failed",
      });
    }

    // IMPORTANT: torna 200 così QStash NON ritenta all’infinito.
    return Response.json({ ok: false }, { status: 200 });
  }
});
