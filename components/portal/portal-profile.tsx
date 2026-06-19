"use client";

import {
  LogOut, Mail, Phone, CalendarDays, Briefcase, Clock3,
  Wallet, ShieldCheck, Store, User, Globe, Sparkles,
} from "lucide-react";
import { portalSignOut, type PortalProfile } from "@/app/portal/actions";
import { PortalNav } from "./portal-nav";

const peso = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}
function ampm(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${ap}`;
}
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const titleCase = (s: string | null) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function PortalProfileView({
  profile,
  store,
}: {
  profile: PortalProfile;
  store: string | null;
}) {
  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-surface-2 p-6 pb-24">
        <p className="text-[13px] text-ink-muted">Couldn&apos;t load your profile.</p>
        <PortalNav active="profile" store={store} />
      </main>
    );
  }
  const p = profile;
  const initials = p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const pay =
    p.compensation_type === "hourly" ? `${peso(p.hourly_rate)} / hour`
    : p.compensation_type === "daily" ? `${peso(p.daily_rate)} / day`
    : `${peso(p.monthly_salary)} / month`;
  const sched = (p.schedule ?? []).slice().sort((a, b) => a.weekday - b.weekday);

  return (
    <main className="min-h-dvh bg-surface-2 pb-24">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-ink to-brand-deep px-5 pb-7 pt-7 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white/15 text-2xl font-extrabold ring-2 ring-white/25">
            {initials || <User size={28} />}
          </div>
          <h1 className="mt-3 text-xl font-extrabold">{p.name}</h1>
          <p className="mt-0.5 text-[13px] text-white/70">
            {p.role}{p.employment_type ? ` · ${titleCase(p.employment_type)}` : ""}
          </p>
          {p.store_code && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80 ring-1 ring-white/15">
              <Store size={12} /> Store {p.store_code}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto mt-4 max-w-md space-y-3 px-4">
        <Card title="Contact">
          <Row icon={Mail} label="Email" value={p.email || "—"} />
          <Row icon={Phone} label="Phone" value={p.phone || "—"} />
        </Card>

        <Card title="Employment">
          <Row icon={Briefcase} label="Role" value={p.role} />
          <Row icon={CalendarDays} label="Hired" value={fmtDate(p.hire_date)} />
          <Row icon={Wallet} label="Pay" value={pay} />
        </Card>

        <Card title="Statutory · monthly share">
          <Row icon={ShieldCheck} label="SSS" value={peso(p.sss)} />
          <Row icon={ShieldCheck} label="PhilHealth" value={peso(p.philhealth)} />
          <Row icon={ShieldCheck} label="Pag-IBIG" value={peso(p.pagibig)} />
        </Card>

        <Card title="Weekly schedule">
          {sched.length === 0 ? (
            <p className="px-1 py-1 text-[13px] text-ink-muted">No schedule set.</p>
          ) : (
            <div className="space-y-1.5">
              {sched.map((s) => (
                <div key={s.weekday} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <Clock3 size={14} className="text-ink-subtle" /> {DAYS[s.weekday - 1]}
                  </span>
                  <span className="text-[12.5px] tabular-nums text-ink-muted">
                    {ampm(s.start)} – {ampm(s.end)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <form action={portalSignOut} className="pt-1">
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-1 px-6 py-3.5 text-sm font-bold text-red-600 shadow-card transition active:scale-[0.99]">
            <LogOut size={17} /> Sign out
          </button>
        </form>

        {/* Branded footer */}
        <footer className="px-1 pb-2 pt-5 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[12.5px] font-extrabold text-ink-muted">
            <Sparkles size={13} className="text-brand" />
            Powered by Prestige IT Solutions Inc.
          </p>
          <div className="mt-2.5 flex flex-col items-center gap-2 text-[12px]">
            <a
              href="https://prestigeitsolutions.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-ink-muted transition hover:text-brand-deep active:scale-95"
            >
              <Globe size={13} className="shrink-0 text-brand-deep" />
              prestigeitsolutions.tech
            </a>
            <a
              href="mailto:hello@prestigeitsolutions.tech"
              className="flex items-center gap-1.5 font-semibold text-ink-muted transition hover:text-brand-deep active:scale-95"
            >
              <Mail size={13} className="shrink-0 text-brand-deep" />
              hello@prestigeitsolutions.tech
            </a>
          </div>
        </footer>
      </div>

      <PortalNav active="profile" store={store} />
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface-1 p-4 shadow-card">
      <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.1em] text-brand-deep">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2.5 text-[13px] text-ink-muted">
        <Icon size={15} className="shrink-0 text-ink-subtle" /> {label}
      </span>
      <span className="truncate text-right text-[13.5px] font-semibold text-ink">{value}</span>
    </div>
  );
}
