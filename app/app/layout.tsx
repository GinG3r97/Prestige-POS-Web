import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supa = createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");
  return <div className="min-h-dvh bg-surface-2">{children}</div>;
}
