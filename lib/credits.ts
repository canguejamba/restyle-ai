import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ChargeReason = "job_charge" | "free_quota_used";

export async function alreadyRefunded(userId: string, jobId: string) {
  const { data } = await supabaseAdmin
    .from("credit_ledger")
    .select("id,reason")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .in("reason", ["job_refund_failed", "free_quota_refund_failed"])
    .limit(1);

  return !!data && data.length > 0;
}

export async function detectChargeType(
  userId: string,
  jobId: string,
  cost: number
): Promise<ChargeReason | null> {
  const { data: ledgerRows } = await supabaseAdmin
    .from("credit_ledger")
    .select("reason,delta")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .limit(50);

  const charge = (ledgerRows ?? []).find(
    (row: any) =>
      row.delta === -cost &&
      (row.reason === "job_charge" || row.reason === "free_quota_used")
  );

  return (charge?.reason as ChargeReason | undefined) ?? null;
}

export async function refundIfCharged(
  userId: string,
  jobId: string,
  cost: number
) {
  if (await alreadyRefunded(userId, jobId)) return;

  const charge = await detectChargeType(userId, jobId, cost);
  if (!charge) return;

  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("credits,free_used")
    .eq("id", userId)
    .single();

  if (!userRow) return;

  if (charge === "job_charge") {
    await supabaseAdmin
      .from("users")
      .update({ credits: (userRow.credits ?? 0) + cost })
      .eq("id", userId);

    await supabaseAdmin.from("credit_ledger").insert({
      user_id: userId,
      job_id: jobId,
      delta: +cost,
      reason: "job_refund_failed",
    });

    return;
  }

  await supabaseAdmin
    .from("users")
    .update({
      free_used: Math.max(0, (userRow.free_used ?? 0) - cost),
    })
    .eq("id", userId);

  await supabaseAdmin.from("credit_ledger").insert({
    user_id: userId,
    job_id: jobId,
    delta: +cost,
    reason: "free_quota_refund_failed",
  });
}
