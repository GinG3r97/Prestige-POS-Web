import { getMyStoreAttendance } from "@/lib/data/dashboard";
import { PortalHeader } from "@/components/dashboard/portal-header";
import { AttendanceSetup } from "@/components/attendance-setup";

export const dynamic = "force-dynamic";

export default async function AttendanceSetupPage() {
  const store = await getMyStoreAttendance();

  if (!store || !store.storeCode) {
    return (
      <>
        <PortalHeader title="Attendance" subtitle="Setup" back={{ href: "/app", label: "Back" }} />
        <main className="mx-auto max-w-md px-4 py-10 text-center text-sm text-ink-muted">
          No store linked to this account.
        </main>
      </>
    );
  }

  return (
    <>
      <PortalHeader
        title="Attendance"
        subtitle={store.businessName}
        back={{ href: "/app", label: "Back" }}
      />
      <main className="mx-auto max-w-md px-4 py-5">
        <AttendanceSetup
          storeCode={store.storeCode}
          businessName={store.businessName}
          geoSet={store.geoLat !== null && store.geoLng !== null}
          geoRadius={store.geoRadius}
        />
      </main>
    </>
  );
}
