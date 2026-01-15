"use client";

import { useState } from "react";
import { RoomTypeStep } from "@/components/RoomTypeStep";
import { StyleStep } from "@/components/StyleStep";
import { GenerateStep } from "@/components/GenerateStep";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import type { RoomType, Style, Intensity } from "@/lib/presets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [inputImageUrl, setInputImageUrl] = useState<string>("");

  const steps = [
    { id: 1, title: "Upload", detail: "Photo + room type" },
    { id: 2, title: "Style", detail: "Look + intensity" },
    { id: 3, title: "Generate", detail: "4 variations" },
  ];

  const step1Ready = !!inputImageUrl && !!roomType;
  const step2Ready = !!style;

  const stepHint =
    step === 1
      ? !inputImageUrl
        ? "Upload a photo to continue."
        : !roomType
          ? "Select a room type to continue."
          : "Ready for the next step."
      : !style
        ? "Pick a style to continue."
        : "Almost there — review and generate.";

  const selectionSummary = [
    roomType ? `Room: ${roomType}` : "Room: —",
    style ? `Style: ${style}` : "Style: —",
    `Intensity: ${intensity}`,
  ].join(" • ");

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">
            Restyle your room in 30 seconds.
          </div>
          <div className="text-sm text-muted-foreground">
            Upload a photo → choose style → get 4 realistic options you can
            download.
            <br />
            Saved to your gallery. Free first generation.
          </div>
        </div>
      </header>

      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((item) => {
          const isActive = step === item.id;
          const isDone = step > item.id;
          return (
            <li
              key={item.id}
              className={[
                "rounded-lg border px-4 py-3 text-sm",
                isActive
                  ? "border-primary bg-primary/5"
                  : isDone
                    ? "border-muted-foreground/40"
                    : "border-muted",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {item.id}. {item.title}
                </div>
                <div
                  className={[
                    "text-xs",
                    isActive ? "text-primary" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {isActive ? "In progress" : isDone ? "Done" : "Next"}
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.detail}
              </div>
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium">Upload</div>
          <CloudinaryUploader
            value={inputImageUrl}
            onChange={setInputImageUrl}
          />
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Good photo tips</div>
            <div className="mt-1">
              Use daylight, keep the room tidy, and include the full room in
              the frame for better results.
            </div>
          </div>
        </CardContent>
      </Card>

      {step === 1 ? (
        <RoomTypeStep
          value={roomType}
          onChange={setRoomType}
          onNext={() => setStep(2)}
          showActions={false}
        />
      ) : null}

      {step === 2 && roomType ? (
        <StyleStep
          style={style}
          intensity={intensity}
          onStyleChange={setStyle}
          onIntensityChange={setIntensity}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          showActions={false}
        />
      ) : null}

      {step === 3 && roomType && style ? (
        <GenerateStep
          inputImageUrl={inputImageUrl}
          roomType={roomType}
          style={style}
          intensity={intensity}
          onBack={() => setStep(2)}
        />
      ) : null}

      {step !== 3 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
            <div>
              <div className="text-sm font-medium">
                Step {step} of 3
              </div>
              <div className="text-xs text-muted-foreground">{stepHint}</div>
              <div className="text-xs text-muted-foreground">
                {selectionSummary}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step === 2 ? (
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              ) : null}
              <Button
                onClick={() => setStep(step === 1 ? 2 : 3)}
                disabled={step === 1 ? !step1Ready : !step2Ready}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
