"use client";

import { ROOM_TYPES, RoomType } from "@/lib/presets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function RoomTypeStep({
  value,
  onChange,
  onNext,
  showActions = true,
}: {
  value: RoomType | null;
  onChange: (v: RoomType) => void;
  onNext: () => void;
  showActions?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Select Room Type</h2>
        <p className="text-sm text-muted-foreground">
          Choose the room you want to restyle.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROOM_TYPES.map((r) => {
          const selected = value === r.title;
          return (
            <button
              key={r.title}
              type="button"
              onClick={() => onChange(r.title)}
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
                      <div className="font-medium">{r.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {r.desc}
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

      {showActions ? (
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={!value}>
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}
