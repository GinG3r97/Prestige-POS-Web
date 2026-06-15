import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/data/dashboard";

/** Guards the admin dashboard — unauthenticated → admin login, non-admin → /app. */
export default async function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supa = createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!(await isAdmin())) redirect("/app");
  return <>{children}</>;
}
