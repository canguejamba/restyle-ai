import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function GenerationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Generations</h1>
          <p className="text-sm text-muted-foreground">
            Your last restyles saved to Cloudinary.
          </p>
        </div>
        <a className="underline text-sm" href="/">Generate new</a>
      </div>

      <GenerationsClient />
    </div>
  );
}

// Lazy import per evitare conflitti server/client
import GenerationsClient from "./ui/GenerationsClient";
