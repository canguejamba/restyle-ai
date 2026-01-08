import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const jobId = params.id;

  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("id,user_id,status,error,params")
    .eq("id", jobId)
    .single();

  if (!job || job.user_id !== userId) return Response.json({ error: "not_found" }, { status: 404 });

  const { data: outputs } = await supabaseAdmin
    .from("job_outputs")
    .select("index,image_url")
    .eq("job_id", jobId)
    .order("index", { ascending: true });

  return Response.json({ status: job.status, error: job.error, outputs: outputs ?? [] });
}
