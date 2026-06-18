import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe, getMyPayslips } from "../actions";
import { PayslipHistory } from "@/components/portal/payslip-history";

export const dynamic = "force-dynamic";

export default async function PortalPayslipsPage({
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
  const payslips = await getMyPayslips(scope);
  const first = me.name.split(" ")[0] || me.name;

  return <PayslipHistory first={first} payslips={payslips} store={scope} />;
}
