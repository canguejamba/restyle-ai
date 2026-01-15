"use client";

import Link from "next/link";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function UserControls({ credits }: { credits: number | null }) {
  if (credits === null) {
    return (
      <div className="flex items-center gap-3">
        <SignInButton mode="modal">
          <Button variant="outline">Sign in</Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/pricing"
        className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Credits: {credits}
      </Link>
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
