"use client";

import { STYLES, Style, INTENSITY, Intensity } from "@/lib/presets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function StyleStep({
  style,
  intensity,
  onStyleChange,
  onIntensityChange,
  onBack,
  onNext,
  showActions = true,
}: {
  style: Style | null;
  intensity: Intensity;
  onStyleChange: (v: Style) => void;
  onIntensityChange: (v: Intensity) => void;
  onBack: () => void;
  onNext: () => void;
  showActions?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Choose Style</h2>
        <p className="text-sm text-muted-foreground">
          Pick a look and how strong the transformation should be.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STYLES.map((s) => {
          const selected = style === s.title;
          return (
            <button
              key={s.title}
              type="button"
              onClick={() => onStyleChange(s.title)}
              className="text-left"
            >
              <Card
                className={[
                  "transition",
                  selected
                    ? "ring-2 ring-primary"
                    : "hover:ring-1 hover:ring-muted-foreground/20",
                ].join(" ")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {s.vibe}
                      </div>
                    </div>
                    {selected ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Intensity</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {INTENSITY.map((i) => {
            const selected = intensity === i.id;
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => onIntensityChange(i.id)}
                className="text-left"
              >
                <Card
                  className={
                    selected
                      ? "ring-2 ring-primary"
                      : "hover:ring-1 hover:ring-muted-foreground/20"
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{i.label}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {i.hint}
                        </div>
                      </div>
                      {selected ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {showActions ? (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!style}>
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}
