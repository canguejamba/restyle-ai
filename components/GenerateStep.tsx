"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoomType, Style, Intensity } from "@/lib/presets";
import { useRouter, useSearchParams } from "next/navigation";

type JobStatus = "queued" | "running" | "succeeded" | "failed";

function friendlyErrorMessage(raw?: string | null) {
  if (!raw) return null;

  const s = raw.toLowerCase();

  // Replicate billing / credits
  if (
    s.includes("insufficient credit") ||
    s.includes("payment required") ||
    s.includes("status 402") ||
    s.includes("replicate.com/account/billing")
  ) {
    return "The AI service is temporarily unavailable. Please try again later.";
  }

  // Common transient issues
  if (
    s.includes("timeout") ||
    s.includes("timed out") ||
    s.includes("etimedout") ||
    s.includes("network") ||
    s.includes("fetch failed")
  ) {
    return "Network issue while generating. Please try again.";
  }

  // QStash enqueue error
  if (s.includes("enqueue_failed")) {
    return "Queue is temporarily unavailable. Please try again.";
  }

  return "Generation failed. Please try again.";
}

export function GenerateStep({
  inputImageUrl,
  roomType,
  style,
  intensity,
  onBack,
}: {
  inputImageUrl: string;
  roomType: RoomType;
  style: Style;
  intensity: Intensity;
  onBack: () => void;
}) {
  const [jobId, setJobId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [outputs, setOutputs] = useState<
    { index: number; image_url: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(
    () => !!inputImageUrl && !!roomType && !!style && !!intensity,
    [inputImageUrl, roomType, style, intensity]
  );
  useEffect(() => {
    const existing = searchParams.get("jobId");
    if (existing && !jobId) {
      setJobId(existing);
      setStatus("queued");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError(null);
    setOutputs([]);
    setStatus("queued");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputImageUrl, roomType, style, intensity }),
    });

    const json = await res.json();
    if (!res.ok) {
      setStatus(null);
      setError(json?.error ?? "Failed to create job");
      return;
    }
    setJobId(json.jobId);
    router.replace(`?jobId=${json.jobId}`, { scroll: false });
  }

  useEffect(() => {
    if (!jobId) return;

    let alive = true;
    const tick = async () => {
      const r = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      const j = await r.json();
      if (!alive) return;

      setStatus(j.status);
      setError(j.error ?? null);
      setOutputs(j.outputs ?? []);

      if (j.status === "succeeded" || j.status === "failed") return;
      setTimeout(tick, 2200);
    };

    tick();
    return () => {
      alive = false;
    };
  }, [jobId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Generate Restyle</h2>
        <p className="text-sm text-muted-foreground">
          We’ll generate 4 variations. This may take ~10–30 seconds.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={status === "running" || status === "queued"}
        >
          Back
        </Button>
        <Button
          onClick={start}
          disabled={!canGenerate || status === "running" || status === "queued"}
        >
          {jobId ? "Regenerate (4 credits)" : "Generate (4 credits)"}
        </Button>
      </div>

      {status && status !== "succeeded" ? (
        <div className="rounded-lg border p-4 text-sm">
          <div className="font-medium">Status: {status}</div>
          <div className="mt-1 text-muted-foreground">
            {status === "queued" && "Queued…"}
            {status === "running" && "Generating 4 variations…"}
            {status === "failed" && "Retry in 30s."}
          </div>
          {error ? (
            <div className="mt-2 text-destructive">
              {friendlyErrorMessage(error)}
            </div>
          ) : null}
        </div>
      ) : null}

      {outputs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {outputs.map((o) => (
            <div key={o.index} className="overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.image_url}
                alt={`Variation ${o.index + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="flex items-center justify-between p-3 text-sm">
                <div>Variation {o.index + 1}</div>
                <a
                  className="underline"
                  href={o.image_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
