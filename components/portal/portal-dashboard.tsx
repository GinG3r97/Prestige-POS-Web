"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut, Camera, RefreshCw, Loader2, Check, X, MapPin, Lock,
  CalendarDays, Clock3, TimerOff, Plane, Fingerprint, ClipboardList,
  Wallet, HeartPulse, Palmtree, Umbrella, Baby, Sparkles,
} from "lucide-react";
import {
  punch, fileRequest, portalSignOut, getWeek,
  type PortalMe, type DaySummary, type PortalRequest, type LeaveType,
  type WeekSummary, type LeaveCredit,
} from "@/app/portal/actions";

const WD = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function minToTime(min: number | null): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
const hrs = (min: number) => (min / 60).toFixed(min % 60 === 0 ? 0 : 1) + "h";

// Deterministic (UTC) date helpers — safe across SSR/CSR (no hydration drift).
function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}
function isoWeekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd; // 1=Mon … 7=Sun
}

// Great-circle distance in metres — mirrors the server-side geofence check so
// we can disable the clock button before a punch the server would reject.
function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function PortalDashboard({
  me, today, summary, open, requests, leaveTypes, week, credits, store,
}: {
  me: NonNullable<PortalMe>;
  today: string;
  summary: DaySummary;
  open: boolean;
  requests: PortalRequest[];
  leaveTypes: LeaveType[];
  week: WeekSummary;
  credits: LeaveCredit[];
  store: string | null;
}) {
  const router = useRouter();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSelfie, setShowSelfie] = useState(false);
  const [fileKind, setFileKind] = useState<"leave" | "ot" | "undertime" | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [locDenied, setLocDenied] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekData, setWeekData] = useState<WeekSummary>(week);
  const [weekBusy, setWeekBusy] = useState(false);
  const [reqFilter, setReqFilter] = useState<"all" | "leave" | "ot" | "undertime">("all");

  async function loadWeek(offset: number) {
    if (offset < 0 || offset > 8) return;
    setWeekOffset(offset);
    setWeekBusy(true);
    setWeekData(await getWeek(offset, store));
    setWeekBusy(false);
  }

  useEffect(() => {
    if (!navigator.geolocation) { setLocDenied(true); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocDenied(false); },
      () => setLocDenied(true),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Live wall-clock for the hero card (client-only → init null to avoid drift).
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const first = me.name.split(" ")[0];
  const todayWd = isoWeekday(today);

  // Geofence gate — the store must have a location set, the employee must share
  // theirs, and they must be inside the radius. Disables the button otherwise
  // (the server enforces the same rule; this is the friendly front line).
  const storeHasGeofence = me.geofenced && me.geo_lat != null && me.geo_lng != null;
  const dist = storeHasGeofence && coords
    ? distanceM(coords.lat, coords.lng, me.geo_lat!, me.geo_lng!)
    : null;
  const withinRadius = dist != null && dist <= me.geo_radius_m;
  const canClock = !busy && storeHasGeofence && coords != null && withinRadius;

  const gateReason: { text: string; tone: "warn" | "muted" | "ok" } =
    !storeHasGeofence
      ? { text: "Store location isn’t set yet — ask your manager to set it in the app.", tone: "warn" }
      : locDenied
        ? { text: "Turn on location to clock in.", tone: "warn" }
        : !coords
          ? { text: "Getting your location…", tone: "muted" }
          : !withinRadius
            ? { text: `You’re ~${Math.round(dist!)} m away — move within ${me.geo_radius_m} m of the store.`, tone: "warn" }
            : { text: me.selfie_required ? "You’re at the store · selfie required" : "You’re at the store · tap the dial", tone: "ok" };

  async function doPunch(selfie: string) {
    setBusy(true);
    const res = await punch({
      kind: open ? "out" : "in",
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      selfie,
      device: navigator.userAgent.slice(0, 120),
      store,
    });
    setBusy(false);
    setShowSelfie(false);
    if (!res.ok) {
      setToast(res.error ?? "Could not record.");
      return;
    }
    setToast(`Clocked ${res.result?.kind === "in" ? "in" : "out"} · ${res.result?.at}`);
    router.refresh();
  }

  const flags: { label: string; tone: "warn" | "info" | "ok" }[] = [];
  if (summary) {
    if (summary.late_min > 0) flags.push({ label: `${summary.late_min}m late`, tone: "warn" });
    if (summary.undertime_min > 0) flags.push({ label: `${summary.undertime_min}m undertime`, tone: "warn" });
    if (summary.ot_min > 0) flags.push({ label: `${hrs(summary.ot_min)} OT`, tone: "ok" });
    if (summary.ot_pending_min > 0) flags.push({ label: `${hrs(summary.ot_pending_min)} OT (file it)`, tone: "info" });
    if (summary.restday_min > 0) flags.push({ label: `${hrs(summary.restday_min)} rest-day`, tone: "ok" });
    if (summary.nightdiff_min > 0) flags.push({ label: `${hrs(summary.nightdiff_min)} night diff`, tone: "info" });
  }

  return (
    <main className="min-h-dvh bg-surface-2">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <Image src="/app_icon.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl ring-1 ring-white/15" />
            <div className="leading-tight">
              <p className="text-[14px] font-bold">Hi, {first}</p>
              <p className="text-[11px] text-white/55">{prettyDate(today)}</p>
            </div>
          </div>
          <form action={portalSignOut}>
            <button aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/20">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>

      {/* Clock hero — tap the dial to punch */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ink to-brand-deep px-5 pb-9 pt-6 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-brand-deep/60 blur-3xl" />

        <div className="relative mx-auto max-w-md">
          {/* Which store this portal is scoped to (from the QR — read-only) */}
          {me.store_code && (
            <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
              Store {me.store_code}
            </p>
          )}

          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Local time</p>
            <p className="mt-0.5 whitespace-nowrap text-[34px] font-extrabold leading-none tracking-tight tabular-nums">
              {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—:—"}
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <ClockDial open={open} canClock={canClock} busy={busy}
              onTap={() => {
                if (!canClock) return;
                if (me.selfie_required) setShowSelfie(true);
                else doPunch(""); // Pro: no selfie — punch straight away
              }} />
            <div className="mt-5 flex flex-col items-center gap-2">
              <StatusPill open={open} clockedOut={summary?.last_out != null} dark />
              <p className={`flex items-center justify-center gap-1 px-4 text-center text-[12px] ${
                gateReason.tone === "warn" ? "text-red-300"
                : gateReason.tone === "ok" ? "text-green-300"
                : "text-white/55"}`}>
                <MapPin size={12} className="shrink-0" /> {gateReason.text}
              </p>
            </div>
          </div>

          {/* In · Out · Worked */}
          <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
            <Stat dark label="In" value={summary?.first_in != null ? minToTime(summary.first_in) : "—"} />
            <Stat dark label="Out" value={summary?.last_out != null ? minToTime(summary.last_out) : "—"} divider />
            <Stat dark label="Worked" value={summary && summary.worked_min > 0 ? hrs(summary.worked_min) : "—"} divider strong />
          </div>

          {flags.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {flags.map((f, i) => (
                <span key={i} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  f.tone === "warn" ? "bg-red-400/15 text-red-300"
                  : f.tone === "ok" ? "bg-green-400/15 text-green-300"
                  : "bg-white/10 text-brand-soft"}`}>
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content sheet */}
      <div className="mx-auto -mt-4 max-w-md space-y-4 rounded-t-[28px] bg-surface-2 px-4 pb-14 pt-5">
        {/* Quick actions */}
        <div>
          <p className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wide text-ink-muted">File a request</p>
          <div className="grid grid-cols-3 gap-2.5">
            <ActionBtn icon={Plane} label="Leave" onClick={() => setFileKind("leave")} />
            <ActionBtn icon={Clock3} label="Overtime" onClick={() => setFileKind("ot")} />
            <ActionBtn icon={TimerOff} label="Undertime" onClick={() => setFileKind("undertime")} />
          </div>
        </div>

        {/* This week's attendance (switch weeks) */}
        <WeekCard
          week={weekData}
          offset={weekOffset}
          busy={weekBusy}
          todayIso={today}
          onJump={loadWeek}
        />

        {/* Leave credits */}
        {credits.length > 0 && <LeaveCreditsCard credits={credits} />}

        {/* Schedule */}
        <Section title="My schedule" icon={CalendarDays}>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const s = me.schedule?.find((x) => x.weekday === d);
              const isToday = d === todayWd;
              return (
                <div key={d}
                  className={`rounded-lg py-2 text-center transition ${
                    isToday ? "bg-brand-deep text-white shadow-card ring-2 ring-brand-deep"
                    : s ? "bg-brand-tint"
                    : "bg-surface-2"}`}>
                  <p className={`text-[10px] font-bold ${isToday ? "text-white" : "text-ink-muted"}`}>{WD[d]}</p>
                  <p className={`text-[9px] ${
                    isToday ? "text-white/85" : s ? "text-brand-deep" : "text-ink-subtle"}`}>
                    {s ? s.start : "off"}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Filing history — Leave / OT / UT */}
        <Section title="My filings" icon={ClipboardList}>
          <div className="mb-3 flex gap-1.5">
            {([["all", "All"], ["leave", "Leave"], ["ot", "OT"], ["undertime", "UT"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setReqFilter(k)}
                className={`rounded-full px-3 py-1 text-[12px] font-bold transition ${
                  reqFilter === k ? "bg-brand text-white" : "bg-surface-2 text-ink-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          {(() => {
            const list = reqFilter === "all" ? requests : requests.filter((r) => r.kind === reqFilter);
            if (list.length === 0) return <p className="text-[13px] text-ink-subtle">Nothing here yet.</p>;
            return (
              <ul className="space-y-2">
                {list.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold capitalize text-ink">
                        {r.kind === "leave" ? (r.leave_type_name ?? "Leave") : r.kind === "ot" ? "Overtime" : "Undertime"}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {r.start_date}{r.end_date && r.end_date !== r.start_date ? ` → ${r.end_date}` : ""}
                        {r.hours ? ` · ${r.hours}h` : ""}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            );
          })()}
        </Section>
      </div>

      {showSelfie && (
        <SelfieModal
          kind={open ? "out" : "in"}
          busy={busy}
          onCancel={() => setShowSelfie(false)}
          onConfirm={doPunch}
        />
      )}
      {fileKind && (
        <RequestModal
          kind={fileKind}
          leaveTypes={leaveTypes}
          today={today}
          store={store}
          onClose={() => setFileKind(null)}
          onFiled={(msg) => { setFileKind(null); setToast(msg); router.refresh(); }}
        />
      )}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </main>
  );
}

function ClockDial({ open, canClock, busy, onTap }: {
  open: boolean; canClock: boolean; busy: boolean; onTap: () => void;
}) {
  const label = open ? "OUT" : "IN";
  const innerBg = !canClock
    ? "from-white/10 to-white/[0.04]"
    : open ? "from-white to-stone-200" : "from-green-400 to-green-600";
  const innerText = !canClock ? "text-white/45" : open ? "text-ink" : "text-white";
  const pingClr = open ? "bg-white/15" : "bg-green-400/25";
  const sub = busy ? "Saving…" : !canClock ? "Locked" : open ? "Tap to end shift" : "Tap to start shift";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={!canClock || busy}
      aria-label={`Clock ${label.toLowerCase()}`}
      className="group relative grid h-56 w-56 place-items-center rounded-full outline-none disabled:cursor-not-allowed"
    >
      {canClock && !busy && (
        <span className={`absolute inset-4 animate-ping rounded-full ${pingClr}`} style={{ animationDuration: "2.2s" }} />
      )}
      <span className="absolute inset-1 rounded-full ring-1 ring-white/15" />
      <span className="absolute inset-[14px] rounded-full ring-1 ring-white/10" />
      <span className={`absolute inset-6 rounded-full bg-gradient-to-b ${innerBg} shadow-2xl transition duration-150 group-active:scale-[0.96]`} />
      <span className={`relative flex flex-col items-center gap-1.5 ${innerText}`}>
        {busy ? <Loader2 className="animate-spin" size={34} />
          : canClock ? <Fingerprint size={40} strokeWidth={1.8} />
          : <Lock size={30} />}
        <span className="text-[20px] font-extrabold leading-none tracking-wide">CLOCK {label}</span>
        <span className="text-[10.5px] font-semibold uppercase tracking-wide opacity-70">{sub}</span>
      </span>
    </button>
  );
}

function WeekCard({ week, offset, busy, todayIso, onJump }: {
  week: WeekSummary; offset: number; busy: boolean; todayIso: string;
  onJump: (o: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-1 p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-deep">
          <CalendarDays size={15} /> Attendance
        </h2>
        {week && (
          <span className="text-[11px] font-semibold tabular-nums text-ink-subtle">
            {week.week_start.slice(5)} – {week.week_end.slice(5)}
          </span>
        )}
      </div>
      {/* Single segmented control — this / last / 2 wks ago */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
        {[0, 1, 2].map((o) => (
          <button key={o} onClick={() => onJump(o)}
            className={`rounded-full py-1.5 text-[11.5px] font-bold transition ${
              offset === o ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink"}`}>
            {o === 0 ? "This week" : o === 1 ? "Last week" : "2 wks ago"}
          </button>
        ))}
      </div>
      {busy || !week ? (
        <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-ink-subtle" /></div>
      ) : (
        <>
          <div className="divide-y divide-hairline">
            {week.days.map((d) => <WeekDayRow key={d.date} d={d} isToday={d.date === todayIso} />)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-surface-2 px-3 py-2.5">
            <Tot label="Worked" value={hrs(week.totals.worked_min)} strong />
            {week.totals.ot_min > 0 && <Tot label="OT" value={hrs(week.totals.ot_min)} ok />}
            {week.totals.restday_min > 0 && <Tot label="Rest-day" value={hrs(week.totals.restday_min)} ok />}
            {week.totals.late_min > 0 && <Tot label="Late" value={`${week.totals.late_min}m`} warn />}
            {week.totals.undertime_min > 0 && <Tot label="UT" value={`${week.totals.undertime_min}m`} warn />}
          </div>
        </>
      )}
    </div>
  );
}

function WeekDayRow({ d, isToday }: { d: NonNullable<DaySummary>; isToday: boolean }) {
  const wd = isoWeekday(d.date);
  const worked = d.worked_min > 0;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`grid h-10 w-11 shrink-0 place-items-center rounded-xl ${
        isToday ? "bg-brand-deep text-white" : worked ? "bg-brand-tint text-brand-deep" : "bg-surface-2 text-ink-subtle"}`}>
        <span className="text-[9px] font-bold uppercase leading-none">{WD[wd]}</span>
        <span className="mt-0.5 text-[13px] font-extrabold leading-none tabular-nums">{d.date.slice(8, 10)}</span>
      </div>
      <div className="min-w-0 flex-1">
        {worked ? (
          <>
            <p className="text-[13px] font-bold text-ink">
              {minToTime(d.first_in)} – {d.last_out != null ? minToTime(d.last_out) : "…"}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {d.late_min > 0 && <MiniTag t={`${d.late_min}m late`} tone="warn" />}
              {d.undertime_min > 0 && <MiniTag t={`${d.undertime_min}m UT`} tone="warn" />}
              {d.ot_min > 0 && <MiniTag t={`${hrs(d.ot_min)} OT`} tone="ok" />}
              {d.restday_min > 0 && <MiniTag t="rest-day" tone="ok" />}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-ink-subtle">{d.dayoff ? "Day off" : "No record"}</p>
        )}
      </div>
      {worked && <span className="text-[13px] font-extrabold tabular-nums text-ink">{hrs(d.worked_min)}</span>}
    </div>
  );
}

function MiniTag({ t, tone }: { t: string; tone: "warn" | "ok" }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
      tone === "warn" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{t}</span>
  );
}

function Tot({ label, value, strong, ok, warn }: {
  label: string; value: string; strong?: boolean; ok?: boolean; warn?: boolean;
}) {
  const c = warn ? "text-red-600" : ok ? "text-green-700" : strong ? "text-brand-deep" : "text-ink";
  return (
    <span className="text-[12px]">
      <span className="text-ink-muted">{label} </span>
      <span className={`font-extrabold tabular-nums ${c}`}>{value}</span>
    </span>
  );
}

function leaveIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("sick")) return HeartPulse;
  if (n.includes("vacation") || n.includes("holiday")) return Palmtree;
  if (n.includes("matern") || n.includes("patern") || n.includes("parental")) return Baby;
  if (n.includes("incentive") || n.includes("service")) return Sparkles;
  if (n.includes("emergency") || n.includes("bereave")) return Umbrella;
  return CalendarDays;
}

function LeaveCreditsCard({ credits }: { credits: LeaveCredit[] }) {
  return (
    <Section title="Leave credits" icon={Wallet}>
      <div className="grid grid-cols-2 gap-2">
        {credits.map((c) => {
          const Icon = leaveIcon(c.name);
          return (
          <div key={c.id} className="rounded-2xl border border-hairline bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-deep">
                <Icon size={15} />
              </span>
              <p className="truncate text-[12px] font-bold text-ink">{c.name}</p>
            </div>
            {c.annual_days == null ? (
              <p className="mt-1 text-[17px] font-extrabold text-brand-deep">Unlimited</p>
            ) : (
              <>
                <p className="mt-1 text-[18px] font-extrabold tabular-nums text-brand-deep">
                  {c.remaining_days}
                  <span className="text-[12px] font-bold text-ink-muted"> / {c.annual_days} left</span>
                </p>
                <p className="text-[11px] text-ink-muted">{c.used_days} used this year</p>
              </>
            )}
          </div>
          );
        })}
      </div>
    </Section>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: {
  icon: typeof Plane; label: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-hairline bg-surface-1 py-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-lg">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-tint text-brand-deep"><Icon size={17} /></span>
      <span className="text-[12px] font-bold text-ink">{label}</span>
    </button>
  );
}

function StatusPill({ open, clockedOut, dark }: { open: boolean; clockedOut: boolean; dark?: boolean }) {
  const cfg = open
    ? { label: "On the clock", dot: "bg-green-400", cls: dark ? "bg-green-400/15 text-green-300" : "bg-green-50 text-green-700" }
    : clockedOut
      ? { label: "Clocked out", dot: dark ? "bg-white/45" : "bg-ink-subtle", cls: dark ? "bg-white/10 text-white/70" : "bg-surface-2 text-ink-muted" }
      : { label: "Not clocked in", dot: "bg-amber-400", cls: dark ? "bg-amber-400/15 text-amber-300" : "bg-amber-50 text-amber-700" };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${open ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function Stat({ label, value, divider, strong, dark }: {
  label: string; value: string; divider?: boolean; strong?: boolean; dark?: boolean;
}) {
  return (
    <div className={`px-2 py-2.5 text-center ${divider ? (dark ? "border-l border-white/10" : "border-l border-hairline") : ""}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wide ${dark ? "text-white/50" : "text-ink-muted"}`}>{label}</p>
      <p className={`mt-0.5 text-[14px] tabular-nums ${
        strong ? (dark ? "font-extrabold text-brand-soft" : "font-extrabold text-brand-deep")
        : (dark ? "font-bold text-white" : "font-bold text-ink")}`}>{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof CalendarDays; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-1 p-5 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-deep">
        <Icon size={15} /> {title}
      </h2>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${m[status] ?? ""}`}>{status}</span>;
}

function SelfieModal({ kind, busy, onCancel, onConfirm }: {
  kind: "in" | "out"; busy: boolean; onCancel: () => void; onConfirm: (selfie: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selfie) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: 480, height: 640 } })
        .then((s) => {
          if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = s;
          if (videoRef.current) { videoRef.current.srcObject = s; void videoRef.current.play(); }
        })
        .catch(() => setCamErr("Allow camera access to clock in."));
    }
    return () => { cancelled = true; stop(); };
  }, [selfie, stop]);

  function capture() {
    const v = videoRef.current; if (!v) return;
    const w = 360, h = Math.round(w * ((v.videoHeight || 640) / (v.videoWidth || 480)));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d")?.drawImage(v, 0, 0, w, h);
    setSelfie(c.toDataURL("image/jpeg", 0.6)); stop();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl bg-surface-1 p-5" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-center text-sm font-bold text-ink">Clock {kind === "in" ? "IN" : "OUT"} — quick selfie</p>
        <div className="mx-auto aspect-[3/4] w-52 overflow-hidden rounded-2xl bg-ink/90">
          {selfie
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={selfie} alt="" className="h-full w-full object-cover" />
            : <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />}
        </div>
        {camErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-[13px] font-semibold text-red-600">{camErr}</p>}
        <div className="mt-4 space-y-2">
          {!selfie ? (
            <button onClick={capture} disabled={!!camErr}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50">
              <Camera size={17} /> Take selfie
            </button>
          ) : (
            <>
              <button onClick={() => onConfirm(selfie)} disabled={busy}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60 ${kind === "in" ? "bg-green-600" : "bg-brand-deep"}`}>
                {busy ? <Loader2 size={17} className="animate-spin" /> : <>Clock {kind === "in" ? "IN" : "OUT"} now</>}
              </button>
              <button onClick={() => setSelfie(null)} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-2 px-6 py-2.5 text-[13px] font-semibold text-ink-muted">
                <RefreshCw size={14} /> Retake
              </button>
            </>
          )}
          <button onClick={onCancel} className="w-full py-1 text-center text-[13px] font-medium text-ink-muted">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function RequestModal({ kind, leaveTypes, today, store, onClose, onFiled }: {
  kind: "leave" | "ot" | "undertime"; leaveTypes: LeaveType[]; today: string; store: string | null;
  onClose: () => void; onFiled: (msg: string) => void;
}) {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [leaveType, setLeaveType] = useState(leaveTypes[0]?.id ?? "");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titles = { leave: "File Leave", ot: "File Overtime", undertime: "File Undertime" };
  const subtitles = { leave: "Request time off", ot: "Log extra hours", undertime: "Leave early" };
  const Icon = kind === "leave" ? Plane : kind === "ot" ? Clock3 : TimerOff;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fileRequest({
      kind, start,
      end: kind === "leave" ? end : start,
      leaveType: kind === "leave" ? (leaveType || null) : null,
      hours: kind === "ot" ? parseFloat(hours || "0") : null,
      reason,
      store,
    });
    setBusy(false);
    if (!res.ok) { setError(res.error ?? "Could not file."); return; }
    onFiled(`${titles[kind]} submitted`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-t-3xl bg-surface-1 p-5 pb-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto -mt-1 mb-1 h-1.5 w-10 rounded-full bg-hairline sm:hidden" />
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-tint text-brand-deep">
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-tight text-ink">{titles[kind]}</h2>
            <p className="text-[12px] text-ink-muted">{subtitles[kind]}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-muted transition hover:bg-surface-3">
            <X size={16} />
          </button>
        </div>

        {kind === "leave" && (
          <>
            <Field label="Type">
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}
                className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand">
                {leaveTypes.length === 0 && <option value="">General leave</option>}
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.emoji ? lt.emoji + " " : ""}{lt.name}{lt.paid ? " (paid)" : ""}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="From"><DateInput value={start} onChange={setStart} /></Field>
              <Field label="To"><DateInput value={end} onChange={setEnd} /></Field>
            </div>
          </>
        )}
        {kind !== "leave" && <Field label="Date"><DateInput value={start} onChange={setStart} /></Field>}
        {kind === "ot" && (
          <Field label="Hours">
            <input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 2"
              className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
          </Field>
        )}
        <Field label="Reason">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Short reason…"
            className="w-full resize-none rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
        </Field>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</p>
        )}
        <button type="submit" disabled={busy}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Submit request</>}
        </button>
      </form>
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-card">
        <Check size={15} className="text-green-400" /> {text}
      </div>
    </div>
  );
}
