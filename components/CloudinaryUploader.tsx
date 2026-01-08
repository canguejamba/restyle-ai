"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type UploadState = "idle" | "signing" | "uploading" | "done" | "error";

export function CloudinaryUploader({
  value,
  onChange,
  maxSizeMB = 8,
}: {
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const canInteract = state === "idle" || state === "done" || state === "error";

  const label = useMemo(() => {
    if (state === "signing") return "Preparing upload…";
    if (state === "uploading") return `Uploading… ${progress}%`;
    if (state === "done") return "Uploaded";
    if (state === "error") return "Upload failed";
    return "Upload a photo";
  }, [state, progress]);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);

    if (!file.type.startsWith("image/")) {
      setState("error");
      setError("Please upload an image file.");
      return;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setState("error");
      setError(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }

    try {
      setState("signing");
      const sigRes = await fetch("/api/upload-signature", { method: "POST" });
      const sig = await sigRes.json();
      if (!sigRes.ok) throw new Error(sig?.error ?? "Failed to get upload signature");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      setState("uploading");

      // Use XHR so we can show upload progress
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);

        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setProgress(pct);
        };

        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(json.secure_url as string);
            } else {
              reject(new Error(json?.error?.message ?? "Upload failed"));
            }
          } catch {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(form);
      });

      onChange(url);
      setState("done");
    } catch (e: any) {
      setState("error");
      setError(String(e?.message ?? "Upload failed"));
    }
  }

  function onPick() {
    inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!canInteract) return;

    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-muted-foreground">
              JPG/PNG/WebP. Max {maxSizeMB}MB.
            </div>
          </div>
          <Button variant="outline" onClick={onPick} disabled={!canInteract}>
            Browse
          </Button>
        </div>

        <div
          className={[
            "rounded-lg border border-dashed p-4 text-sm",
            canInteract ? "cursor-pointer hover:bg-muted/40" : "opacity-70",
          ].join(" ")}
          role="button"
          tabIndex={0}
          onClick={onPick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="text-muted-foreground">
            Drag & drop an image here, or click to select.
          </div>

          {state === "uploading" ? (
            <div className="mt-3">
              <div className="h-2 w-full rounded bg-muted">
                <div className="h-2 rounded bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}

          {error ? <div className="mt-3 text-destructive">{error}</div> : null}
        </div>

        {value ? (
          <div className="overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Uploaded room" className="h-64 w-full object-cover" />
            <div className="flex items-center justify-between p-3 text-xs">
              <div className="truncate max-w-[70%] text-muted-foreground">{value}</div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onChange("");
                  setState("idle");
                  setProgress(0);
                  setError(null);
                }}
                disabled={!canInteract}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : null}

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onBrowse} />
      </CardContent>
    </Card>
  );
}
