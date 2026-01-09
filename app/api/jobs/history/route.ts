import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 25);
  const before = url.searchParams.get("before");

  let q = supabaseAdmin
    .from("jobs")
    .select("id,created_at,status,room_type,style,intensity, job_outputs(index,image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) q = q.lt("created_at", before);

  const { data, error } = await q;
  if (error) return Response.json({ error: "db_error" }, { status: 500 });

  const items = (data ?? []).map((j: any) => ({
    ...j,
    job_outputs: (j.job_outputs ?? []).sort((a: any, b: any) => a.index - b.index),
  }));

  const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null;

  return Response.json({ items, nextCursor });
}
