"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LightboxGallery } from "@/components/LightboxGallery";
import { cloudinaryTransform } from "@/lib/cloudinaryUrl";

type Job = {
  id: string;
  created_at: string;
  status: string;
  room_type: string;
  style: string;
  intensity: string;
  job_outputs: { index: number; image_url: string }[];
};

export default function GenerationsClient() {
  const [items, setItems] = useState<Job[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(initial = false) {
    setLoading(true);
    const url = new URL("/api/jobs/history", window.location.origin);
    url.searchParams.set("limit", "10");
    if (!initial && nextCursor) url.searchParams.set("before", nextCursor);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();

    setItems((prev) => (initial ? json.items : [...prev, ...json.items]));
    setNextCursor(json.nextCursor ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items.length && loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (!items.length) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        No generations yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((job) => (
        <div key={job.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">
              {job.room_type} • {job.style} • {job.intensity}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(job.created_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Status: {job.status}
          </div>

          {job.job_outputs?.length ? (
            <LightboxGallery
              className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              images={(job.job_outputs ?? []).map((output) => {
                const original = output.image_url;
                const thumb = cloudinaryTransform(
                  original,
                  "c_fill,w_600,h_360,q_auto,f_auto"
                );
                const full = cloudinaryTransform(
                  original,
                  "c_limit,w_2200,q_auto,f_auto"
                );

                return {
                  thumb,
                  full,
                  alt: `Variation ${output.index + 1}`,
                };
              })}
            />
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              No outputs saved.
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-center">
        <Button onClick={() => load(false)} disabled={!nextCursor || loading}>
          {loading ? "Loading…" : nextCursor ? "Load more" : "No more"}
        </Button>
      </div>
    </div>
  );
}
