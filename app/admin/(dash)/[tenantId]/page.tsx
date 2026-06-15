import { getTenantDetail } from "@/lib/data/dashboard";
import { StoreDashboard } from "@/components/dashboard/store-dashboard";
import { PortalHeader } from "@/components/dashboard/portal-header";

export const dynamic = "force-dynamic";

export default async function AdminTenantPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const d = await getTenantDetail(params.tenantId);
  return (
    <>
      <PortalHeader
        title={d.tenant.business_name}
        subtitle="Client detail"
        back={{ href: "/admin", label: "Back to all clients" }}
      />
      <main className="mx-auto max-w-4xl px-4 py-5">
        <StoreDashboard d={d} editable />
      </main>
    </>
  );
}
