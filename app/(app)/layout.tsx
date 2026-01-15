import { AppHeader } from "@/components/AppHeader";

export const runtime = "nodejs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
