import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id: jobId } = await ctx.params;

  const { data: job, error: jobErr } = await supabaseAdmin
    .from("jobs")
    .select("id,user_id,status,error,params")
    .eq("id", jobId)
    .single();

  if (jobErr || !job || job.user_id !== userId) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { data: outputs, error: outErr } = await supabaseAdmin
    .from("job_outputs")
    .select("index,image_url")
    .eq("job_id", jobId)
    .order("index", { ascending: true });

  if (outErr) return Response.json({ error: "db_error" }, { status: 500 });

  return Response.json({
    status: job.status,
    error: job.error,
    outputs: outputs ?? [],
  });
}
