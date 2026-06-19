import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe, getMyDtr } from "../actions";
import { PortalAttendance } from "@/components/portal/portal-attendance";

export const dynamic = "force-dynamic";

export default async function PortalAttendancePage({
  searchParams,
}: {
  searchParams: { store?: string };
}) {
  const store = searchParams.store?.trim() || null;
  const supa = createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    redirect(store ? `/portal/login?store=${encodeURIComponent(store)}` : "/portal/login");
  }
  const me = await getMe(store);
  if (!me) redirect(store ? `/portal?store=${encodeURIComponent(store)}` : "/portal");
  const scope = me.store_code ?? store;
  const dtr = await getMyDtr(0, scope);
  return <PortalAttendance initial={dtr} store={scope} />;
}
