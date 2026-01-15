import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Pay only when you generate.
        </h1>
        <p className="text-muted-foreground">
          Credits never expire.{" "}
          <span className="font-medium text-foreground">
            1 credit = 1 image
          </span>
          . Each generation creates{" "}
          <span className="font-medium text-foreground">
            4 images (4 credits)
          </span>
          .
        </p>
      </div>

      {/* FREE TRIAL – make it loud */}
      <div className="rounded-xl border p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Try 1 generation for free</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            New accounts get{" "}
            <span className="font-medium text-foreground">4 free credits</span>{" "}
            (1 generation). No card required.
          </p>
        </div>
        <Link href="/">
          <Button className="w-full sm:w-auto">Try it now</Button>
        </Link>
      </div>

      {/* ONE PLAN ONLY */}
      <div className="grid gap-6 md:grid-cols-1">
        <div className="rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Starter (recommended)
            </div>
            <div className="rounded-full bg-muted px-3 py-1 text-xs">
              Best to try
            </div>
          </div>

          <div className="mt-4">
            <div className="text-4xl font-semibold">€9.99</div>
            <div className="mt-1 text-sm text-muted-foreground">
              20 credits (20 images) •{" "}
              <span className="text-foreground font-medium">5 generations</span>{" "}
              • ~€2.00 / generation
            </div>
          </div>

          <ul className="mt-6 space-y-2 text-sm">
            <li>• 5 generations (4 images each)</li>
            <li>• Saved to your gallery</li>
            <li>• One-click download</li>
          </ul>

          <div className="mt-6 flex gap-3">
            <Button className="w-full opacity-60 cursor-not-allowed" disabled>
              Checkout coming soon
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Payments will be enabled once Stripe is connected.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h3 className="font-medium">
            How many images do I get per generation?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            4 variations per generation.
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="font-medium">Do credits expire?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No. Credits stay in your account.
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="font-medium">What if a generation fails?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You won&apos;t be charged. If we already charged, we automatically
            refund credits.
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="font-medium">Where do my images go?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your results are saved to{" "}
            <span className="font-medium text-foreground">My Generations</span>.
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">
            Ready to restyle your space?
          </div>
          <div className="text-sm text-muted-foreground">
            Upload a photo and get 4 variations in seconds.
          </div>
        </div>

        <Link href="/">
          <Button className="w-full sm:w-auto">
            Generate your first restyle
          </Button>
        </Link>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Credits never expire. Failed generations are refunded automatically.
      </div>
    </div>
  );
}
