import { Store } from "lucide-react";
import { getMyTenantId, getTenantDetail } from "@/lib/data/dashboard";
import { StoreDashboard } from "@/components/dashboard/store-dashboard";
import { PortalHeader } from "@/components/dashboard/portal-header";
import { signOut } from "@/app/portal-actions";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage() {
  const tenantId = await getMyTenantId();

  if (!tenantId) {
    return (
      <>
        <PortalHeader title="Prestige" subtitle="No store linked" />
        <main className="mx-auto flex max-w-sm flex-col items-center px-4 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-3 text-ink-muted">
            <Store size={22} />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-ink">No store on this account</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            This email isn&apos;t linked to a store yet. Sign in with the email you
            use in the Prestige POS app, or contact your provider.
          </p>
          <form action={signOut} className="mt-6">
            <button className="rounded-full border border-hairline bg-surface-1 px-5 py-2.5 text-sm font-semibold text-ink">
              Sign out
            </button>
          </form>
        </main>
      </>
    );
  }

  const d = await getTenantDetail(tenantId);
  return (
    <>
      <PortalHeader title={d.tenant.business_name} subtitle="Your store" />
      <main className="mx-auto max-w-4xl px-4 py-5">
        <StoreDashboard d={d} />
      </main>
    </>
  );
}
