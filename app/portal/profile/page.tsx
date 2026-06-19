import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe, getMyProfile } from "../actions";
import { PortalProfileView } from "@/components/portal/portal-profile";

export const dynamic = "force-dynamic";

export default async function PortalProfilePage({
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
  const profile = await getMyProfile(scope);
  return <PortalProfileView profile={profile} store={scope} />;
}
