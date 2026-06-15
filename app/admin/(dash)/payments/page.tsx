import { getPaymentRequests } from "@/lib/data/dashboard";
import { PortalHeader } from "@/components/dashboard/portal-header";
import { PaymentsList } from "@/components/dashboard/payments-list";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const requests = await getPaymentRequests();
  const pending = requests.filter((r) => r.status === "pending").length;
  return (
    <>
      <PortalHeader
        title="Payments"
        subtitle={`${pending} to verify`}
        back={{ href: "/admin", label: "Back to all clients" }}
      />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <PaymentsList requests={requests} />
      </main>
    </>
  );
}
