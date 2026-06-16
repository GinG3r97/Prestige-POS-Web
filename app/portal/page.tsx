import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMe, getToday, getClockOpen, getRequests, getLeaveTypes, getWeek, getLeaveCredits, portalSignOut } from "./actions";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: { store?: string };
}) {
  // The store scope comes ONLY from the QR (?store=PR-XXXX). We use it to check
  // the signed-in email is an employee at that store — there is no picker, so an
  // employee can never browse to another store.
  const store = searchParams.store?.trim() || null;

  const supa = createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) {
    redirect(store ? `/portal/login?store=${encodeURIComponent(store)}` : "/portal/login");
  }

  const me = await getMe(store);
  // Signed in, but the email isn't an employee at this store (or the link has no
  // store and the email maps to more than one). Show a dead-end, not a redirect
  // loop — they must use their own store's QR.
  if (!me) return <NoAccess />;

  // "Today" in Manila (UTC+8).
  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  const scope = me.store_code ?? store;
  const [summary, open, requests, leaveTypes, week, credits] = await Promise.all([
    getToday(today, scope),
    getClockOpen(scope),
    getRequests(scope),
    getLeaveTypes(scope),
    getWeek(0, scope),
    getLeaveCredits(scope),
  ]);

  return (
    <PortalDashboard
      me={me}
      today={today}
      summary={summary}
      open={open}
      requests={requests}
      leaveTypes={leaveTypes}
      week={week}
      credits={credits}
      store={scope}
    />
  );
}

function NoAccess() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-deep px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-surface-1 p-7 text-center shadow-card">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
          <Lock size={22} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-ink">Can’t open this portal</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          This account isn’t linked to this store. Scan <span className="font-semibold text-ink">your store’s QR code</span> to
          sign in to the right store.
        </p>
        <form action={portalSignOut} className="mt-5">
          <button className="w-full rounded-full bg-surface-2 px-6 py-3 text-sm font-bold text-ink-muted transition hover:bg-surface-3">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
