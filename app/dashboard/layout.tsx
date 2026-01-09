import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="flex border-b">
        <div className="w-64 border-r p-4">
          <div className="text-lg font-semibold">Restyle AI</div>
          <nav className="mt-6 space-y-2 text-sm">
            <a className="block rounded px-2 py-1 hover:bg-muted" href="/">Generate</a>
            <a className="block rounded px-2 py-1 hover:bg-muted" href="/dashboard/generations">Generations</a>
          </nav>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-muted-foreground">Dashboard</div>
            <UserButton />
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
