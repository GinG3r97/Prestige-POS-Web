import Link from "next/link";
import { Receipt, ChevronRight } from "lucide-react";
import { getTenantOverviews, getPaymentRequests } from "@/lib/data/dashboard";
import { PortalHeader } from "@/components/dashboard/portal-header";
import { AdminClientList } from "@/components/dashboard/admin-client-list";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [tenants, payments] = await Promise.all([
    getTenantOverviews(),
    getPaymentRequests(),
  ]);
  const pending = payments.filter((p) => p.status === "pending").length;

  return (
    <>
      <PortalHeader title="All clients" subtitle={`${tenants.length} stores`} />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
        <Link
          href="/admin/payments"
          className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface-1 p-4 shadow-card transition hover:border-brand-soft"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-deep">
            <Receipt size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Payments to verify</p>
            <p className="text-[12px] text-ink-muted">GCash upgrade requests</p>
          </div>
          {pending > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              {pending} pending
            </span>
          )}
          <ChevronRight size={16} className="text-ink-subtle" />
        </Link>

        <AdminClientList overviews={tenants} />
      </main>
    </>
  );
}
