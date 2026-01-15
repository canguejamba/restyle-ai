import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserControls } from "@/components/UserControls";

export async function AppHeader() {
  const { userId } = await auth();

  let credits: number | null = null;

  if (userId) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    credits = !error ? (data?.credits ?? 0) : 0;
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Restyle AI
          </Link>

          <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
            <Link href="/" className="hover:text-foreground">
              Generate
            </Link>
            <Link href="/my-generations" className="hover:text-foreground">
              My Generations
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
          </nav>
        </div>

        <UserControls credits={credits} />
      </div>
    </header>
  );
}
