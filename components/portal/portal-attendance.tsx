"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarClock, Loader2 } from "lucide-react";
import { getMyDtr, type PortalDtr, type DtrDay } from "@/app/portal/actions";
import { PortalNav } from "./portal-nav";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function d(s: string) { return new Date(s + "T00:00:00"); }
function fmtRange(a: string, b: string) {
  const s = d(a), e = d(b);
  const same = s.getMonth() === e.getMonth();
  return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${same ? "" : MONTHS[e.getMonth()] + " "}${e.getDate()}, ${e.getFullYear()}`;
}
function clock(mins: number | null) {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60), m = mins % 60;
  const ap = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${ap}`;
}
function hrs(min: number) {
  const v = min / 60;
  return (v === Math.round(v) ? v.toFixed(0) : v.toFixed(1)) + "h";
}

function Chip({ label, tone }: { label: string; tone: "brand" | "green" | "red" | "amber" | "muted" }) {
  const c = {
    brand: "bg-brand/12 text-brand-deep",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-700",
    muted: "bg-surface-3 text-ink-muted",
  }[tone];
  return <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${c}`}>{label}</span>;
}

export function PortalAttendance({ initial, store }: { initial: PortalDtr; store: string | null }) {
  const [data, setData] = useState<PortalDtr>(initial);
  const [offset, setOffset] = useState<number>(initial?.offset ?? 0);
  const [busy, setBusy] = useState(false);

  async function load(o: number) {
    if (o < 0 || busy) return;
    setBusy(true);
    const next = await getMyDtr(o, store);
    setData(next);
    setOffset(o);
    setBusy(false);
  }

  const dtr = data?.dtr;
  const days = dtr?.days ?? [];

  return (
    <main className="min-h-dvh bg-surface-2 pb-28">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/90 px-4 py-3 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
            <CalendarClock size={16} />
          </div>
          <div className="leading-tight">
            <p className="text-[14px] font-bold">Attendance</p>
            <p className="text-[11px] text-white/55">Your daily time record</p>
          </div>
        </div>
        {/* Cutoff selector */}
        <div className="mx-auto mt-3 flex max-w-md items-center justify-between rounded-2xl bg-white/10 px-2 py-1.5">
          <button
            onClick={() => load(offset + 1)}
            disabled={busy}
            aria-label="Previous cutoff"
            className="grid h-8 w-8 place-items-center rounded-xl text-white/80 transition hover:bg-white/10 active:scale-90 disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-[13px] font-bold">
            {busy && <Loader2 size={13} className="animate-spin text-white/70" />}
            {data ? fmtRange(data.period_start, data.period_end) : "—"}
          </div>
          <button
            onClick={() => load(offset - 1)}
            disabled={busy || offset === 0}
            aria-label="Next cutoff"
            className="grid h-8 w-8 place-items-center rounded-xl text-white/80 transition hover:bg-white/10 active:scale-90 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* Totals */}
        {dtr && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip label={`Regular ${dtr.regular_hours.toFixed(1)}h`} tone="brand" />
            {dtr.ot_hours > 0 && <Chip label={`OT ${dtr.ot_hours.toFixed(1)}h`} tone="green" />}
            {dtr.paid_leave_hours > 0 && <Chip label={`Leave ${dtr.paid_leave_hours.toFixed(1)}h`} tone="green" />}
            {dtr.holiday_premium_hours > 0 && <Chip label={`Holiday +${dtr.holiday_premium_hours.toFixed(1)}h`} tone="green" />}
            {dtr.undertime_hours > 0 && <Chip label={`UT ${dtr.undertime_hours.toFixed(1)}h`} tone="red" />}
            {dtr.absent_days > 0 && <Chip label={`Absent ${dtr.absent_days}d`} tone="red" />}
            {dtr.late_minutes > 0 && <Chip label={`Late ${dtr.late_minutes}m`} tone="amber" />}
          </div>
        )}

        {/* Day list */}
        {days.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-surface-1 p-8 text-center shadow-card">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-3 text-ink-muted">
              <CalendarClock size={22} />
            </div>
            <p className="mt-3 text-[14px] font-bold text-ink">No records this period</p>
            <p className="mt-1 text-[13px] text-ink-muted">Your scheduled days will show here once you clock in.</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-3xl bg-surface-1 shadow-card">
            {days.map((day, i) => (
              <DayRow key={day.date} day={day} last={i === days.length - 1} />
            ))}
          </ul>
        )}
      </div>

      <PortalNav active="attendance" store={store} />
    </main>
  );
}

function DayRow({ day, last }: { day: DtrDay; last: boolean }) {
  const dt = d(day.date);
  let middle: React.ReactNode;
  let chips: React.ReactNode;

  switch (day.status) {
    case "absent":
      middle = <span className="text-[13px] font-semibold text-red-600">Absent</span>;
      chips = <Chip label="No pay" tone="red" />;
      break;
    case "leave_paid":
      middle = <span className="text-[13px] text-ink">On leave · {day.leave_name ?? "Leave"}</span>;
      chips = <Chip label={`Paid ${hrs(day.leave_min)}`} tone="green" />;
      break;
    case "leave_unpaid":
      middle = <span className="text-[13px] text-ink-muted">On leave · {day.leave_name ?? "Leave"}</span>;
      chips = <Chip label="Unpaid" tone="muted" />;
      break;
    case "holiday_paid":
      middle = <span className="text-[13px] text-ink">Holiday · {day.holiday_name ?? "Holiday"}</span>;
      chips = <Chip label={`Paid ${hrs(day.holiday_paid_min)}`} tone="brand" />;
      break;
    case "holiday_off":
      middle = <span className="text-[13px] text-ink-muted">Holiday · {day.holiday_name ?? "Holiday"}</span>;
      chips = <Chip label="No pay" tone="muted" />;
      break;
    default: // worked / restday / holiday_worked
      middle = <span className="text-[12.5px] text-ink">{clock(day.first_in)} – {clock(day.last_out)}</span>;
      chips = (
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Chip label={hrs(day.regular_min + day.restday_min)} tone="brand" />
          {day.status === "holiday_worked" && <Chip label="Holiday" tone="green" />}
          {day.status === "restday" && <Chip label="Rest day" tone="green" />}
          {day.ot_min > 0 && <Chip label={`OT ${hrs(day.ot_min)}`} tone="green" />}
          {day.undertime_min > 0 && <Chip label={`UT ${hrs(day.undertime_min)}`} tone="red" />}
          {day.late_min > 0 && <Chip label={`${day.late_min}m late`} tone="amber" />}
        </div>
      );
  }

  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${last ? "" : "border-b border-hairline"}`}>
      <div className="w-12 shrink-0">
        <p className="text-[12px] font-extrabold text-ink">{DOW[dt.getDay()]}</p>
        <p className="text-[11px] text-ink-subtle">{MONTHS[dt.getMonth()]} {dt.getDate()}</p>
      </div>
      <div className="min-w-0 flex-1">{middle}</div>
      <div className="shrink-0">{chips}</div>
    </li>
  );
}
