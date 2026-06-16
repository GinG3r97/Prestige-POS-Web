import { redirect } from "next/navigation";
import { getMe, getToday, getClockOpen, getRequests, getLeaveTypes } from "./actions";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const me = await getMe();
  if (!me) redirect("/portal/login");

  // "Today" in Manila (UTC+8).
  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  const [summary, open, requests, leaveTypes] = await Promise.all([
    getToday(today),
    getClockOpen(),
    getRequests(),
    getLeaveTypes(),
  ]);

  return (
    <PortalDashboard
      me={me}
      today={today}
      summary={summary}
      open={open}
      requests={requests}
      leaveTypes={leaveTypes}
    />
  );
}
