"use client";

import { useState } from "react";
import { RoomTypeStep } from "@/components/RoomTypeStep";
import { StyleStep } from "@/components/StyleStep";
import { GenerateStep } from "@/components/GenerateStep";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import type { RoomType, Style, Intensity } from "@/lib/presets";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [inputImageUrl, setInputImageUrl] = useState<string>("");

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Restyle AI</div>
          <div className="text-sm text-muted-foreground">
            Upload a room photo, pick a style, get 4 wow variations.
          </div>
        </div>
        <UserButton />
      </header>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium">Upload</div>
          <CloudinaryUploader value={inputImageUrl} onChange={setInputImageUrl} />
          <div className="text-xs text-muted-foreground">
            Tip: use a well-lit photo with a clear view of the room.
          </div>
        </CardContent>
      </Card>

      {step === 1 ? (
        <RoomTypeStep
          value={roomType}
          onChange={setRoomType}
          onNext={() => setStep(2)}
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
    </main>
  );
}
