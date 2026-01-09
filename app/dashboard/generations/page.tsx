import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export default async function GenerationsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data: jobs } = await supabaseAdmin
    .from("jobs")
    .select("id,created_at,status,room_type,style,intensity, job_outputs(index,image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  const items = (jobs ?? []).map((j: any) => ({
    ...j,
    job_outputs: (j.job_outputs ?? []).sort((a: any, b: any) => a.index - b.index),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Generations</h1>
        <p className="text-sm text-muted-foreground">Your last 30 restyles.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No generations yet. Go back to Generate and create your first restyle.
        </div>
      ) : null}

      <div className="space-y-6">
        {items.map((job: any) => (
          <div key={job.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">
                {job.room_type} • {job.style} • {job.intensity}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(job.created_at).toLocaleString()}
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">Status: {job.status}</div>

            {job.job_outputs?.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {job.job_outputs.map((o: any) => (
                  <div key={o.index} className="overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.image_url} alt={`Variation ${o.index + 1}`} className="h-48 w-full object-cover" />
                    <div className="flex items-center justify-between p-2 text-xs">
                      <span>V{o.index + 1}</span>
                      <a className="underline" href={o.image_url} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">
                No outputs saved for this job.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
