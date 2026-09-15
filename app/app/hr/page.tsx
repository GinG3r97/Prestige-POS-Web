import Link from "next/link";
import { Users } from "lucide-react";
import { PortalHeader } from "@/components/dashboard/portal-header";
import { HrView } from "@/components/hr/hr-view";
import {
  getHrSummary, getHrRequests, getHrAttendance, getHrPayroll,
} from "@/lib/data/hr";

export const dynamic = "force-dynamic";

export default async function HrPage() {
  const summary = await getHrSummary();

  // hr_summary() is the access probe: it raises NO_STORE / NOT_AUTHORIZED
  // in-DB, which the data layer turns into null.
  if (!summary) {
    return (
      <>
        <PortalHeader title="HR" subtitle="No store" back={{ href: "/app", label: "Back" }} />
        <main className="mx-auto flex max-w-sm flex-col items-center px-4 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-3 text-ink-muted">
            <Users size={22} />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-ink">No store on this account</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Sign in with the email you use in the Prestige POS app, or ask the
            owner to add you as a co-owner.
          </p>
          <Link href="/app" className="mt-6 rounded-full border border-hairline bg-surface-1 px-5 py-2.5 text-sm font-semibold text-ink">
            Back to dashboard
          </Link>
        </main>
      </>
    );
  }

  // Fetched together so the first paint has every tab ready.
  const [requests, attendance, payroll] = await Promise.all([
    getHrRequests("pending"),
    getHrAttendance(),
    getHrPayroll(),
  ]);

  return (
    <>
      <PortalHeader
        title="HR"
        subtitle={summary.business_name}
        back={{ href: "/app", label: "Back" }}
      />
      <HrView
        summary={summary}
        requests={requests}
        attendance={attendance}
        payroll={payroll}
      />
    </>
  );
}
