import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">
        You’re on the list.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Thanks — we’ll email you when early access is available.
      </p>

      <div className="mt-8 rounded-xl border p-6">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            • You’ll get{" "}
            <span className="font-medium text-foreground">one email</span> when
            it’s your turn.
          </li>
          <li>• No spam. Unsubscribe anytime.</li>
          <li>
            • Want access sooner? Reply to that email with your room + deadline.
          </li>
        </ul>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button>Back to Restyle AI</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="secondary">See pricing</Button>
        </Link>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Tip: Save this link — you can come back anytime.
      </p>
    </div>
  );
}
