"use client";

import { useState, useTransition } from "react";
import {
  Users, CalendarClock, Wallet, ClipboardCheck, Check, X, Download,
  ChevronLeft, ChevronRight, Loader2, Clock, Plane, TrendingUp, TrendingDown,
  Plus, RefreshCw, Trash2, AlertTriangle, Lock, CheckCircle2,
} from "lucide-react";
import { peso } from "@/lib/format";
import {
  runTotals, grossCentavos, netCentavos, statutoryCentavos,
  undertimeCentavos, otPayCentavos, PERIOD_LABELS, COMP_LABELS,
  type PayrollRun, type PayPeriodKind,
} from "@/lib/payroll";
import type {
  HrSummary, HrRequest, HrAttendance, HrPayroll, RequestStatus,
  HrAttendanceRange, HrPreflight,
} from "@/lib/data/hr";
import {
  decideRequest, loadRequests, loadAttendance, loadAttendanceRange,
  loadPreflight, loadPayroll, generatePayroll, regeneratePayroll,
  setRunStatus, deleteRun,
  exportPayrollCsv, exportAttendanceCsv, exportAttendanceRangeCsv,
  exportRequestsCsv, exportPreflightCsv,
} from "@/app/app/hr/actions";

type Tab = "today" | "approvals" | "attendance" | "payroll";

// ── shared bits ────────────────────────────────────────────────────────────

function clock(m: number | null) {
  if (m == null) return "—";
  const h24 = Math.floor(m / 60) % 24;
  const ap = h24 < 12 ? "AM" : "PM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m % 60).padStart(2, "0")} ${ap}`;
}
const hrs = (min: number) => (min / 60).toFixed(min % 60 === 0 ? 0 : 1) + "h";
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const prettyDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-PH", {
    weekday: "short", month: "short", day: "numeric",
  });
const shortDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" });

type Tone = "green" | "red" | "amber" | "brand" | "muted" | "blue";
function Chip({ label, tone }: { label: string; tone: Tone }) {
  const c: Record<Tone, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    brand: "bg-brand-tint text-brand-deep",
    muted: "bg-surface-3 text-ink-muted",
  };
  return <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${c[tone]}`}>{label}</span>;
}

function Stat({ label, value, sub, icon: Icon, tone }: {
  label: string; value: string; sub?: string; icon: typeof Users; tone?: "brand" | "amber";
}) {
  return (
    <div className={`rounded-2xl border p-3.5 shadow-card sm:p-4 ${
      tone === "amber" ? "border-amber-200 bg-amber-50/60" : "border-hairline bg-surface-1"
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted sm:text-[11px]">{label}</span>
        <Icon size={15} className={tone === "amber" ? "text-amber-600" : "text-brand-deep"} />
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-subtle">{sub}</p>}
    </div>
  );
}

function useCsvDownload() {
  const [busy, setBusy] = useState<string | null>(null);
  async function run(key: string, fetcher: () => Promise<{ filename: string; csv: string } | null>) {
    setBusy(key);
    try {
      const file = await fetcher();
      if (!file) return;
      // BOM so Excel reads UTF-8 (₱, ñ) instead of mangling it.
      const blob = new Blob(["﻿" + file.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file.filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally { setBusy(null); }
  }
  return { busy, run };
}

function ExportButton({ label, busy, onClick, primary }: {
  label: string; busy: boolean; onClick: () => void; primary?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={busy}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-50 ${
        primary ? "bg-ink text-white" : "border border-hairline bg-surface-1 text-ink-muted hover:text-ink"
      }`}>
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {label}
    </button>
  );
}

function ErrorNote({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
      <AlertTriangle size={14} className="mt-px shrink-0" />{msg}
    </p>
  );
}

/**
 * From/To picker — capped at today, never inverted.
 *
 * Stacked on phones on purpose: a native date input renders at its own
 * intrinsic width and refuses to shrink, so two of them side by side on a
 * ~390px screen overlap each other and their labels. Side by side only from
 * `sm` up, where there's room.
 */
function RangePicker({ start, end, onChange, disabled }: {
  start: string; end: string;
  onChange: (s: string, e: string) => void; disabled?: boolean;
}) {
  const today = ymd(new Date());
  const field =
    "w-full rounded-xl border border-hairline bg-surface-1 px-3 py-2.5 text-[14px] font-semibold text-ink outline-none focus:border-brand-soft disabled:opacity-50";
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">From</span>
        <input type="date" value={start} max={end || today} disabled={disabled}
          onChange={(e) => onChange(e.target.value, end)} className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">To</span>
        <input type="date" value={end} min={start} max={today} disabled={disabled}
          onChange={(e) => onChange(start, e.target.value)} className={field} />
      </label>
    </div>
  );
}

const KIND_META: Record<string, { label: string; tone: Tone; icon: typeof Clock }> = {
  ot: { label: "Overtime", tone: "blue", icon: TrendingUp },
  undertime: { label: "Undertime", tone: "amber", icon: TrendingDown },
  leave: { label: "Leave", tone: "brand", icon: Plane },
};

// ── approvals ──────────────────────────────────────────────────────────────

function Approvals({ initial }: { initial: HrRequest[] }) {
  const [status, setStatus] = useState<RequestStatus | "all">("pending");
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [acting, setActing] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const csv = useCsvDownload();

  function switchStatus(s: RequestStatus | "all") {
    setStatus(s);
    startTransition(async () => setRows(await loadRequests(s)));
  }

  async function decide(id: string, approved: boolean) {
    setActing(id); setErr(null);
    const res = await decideRequest(id, approved);
    if (!res.ok) setErr(res.error ?? "Something went wrong.");
    setRows(await loadRequests(status));
    setActing(null);
  }

  const TABS: (RequestStatus | "all")[] = ["pending", "approved", "rejected", "all"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {TABS.map((s) => (
          <button key={s} onClick={() => switchStatus(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
              s === status ? "bg-ink text-white" : "border border-hairline bg-surface-1 text-ink-muted"
            }`}>{s}</button>
        ))}
        <span className="ml-auto" />
        <ExportButton label="Export" busy={csv.busy === "req"}
          onClick={() => csv.run("req", () => exportRequestsCsv(status))} />
      </div>

      <ErrorNote msg={err} />

      {pending ? (
        <div className="grid place-items-center py-14 text-ink-subtle"><Loader2 size={20} className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface-1 py-14 text-center">
          <ClipboardCheck size={22} className="mx-auto text-ink-subtle" />
          <p className="mt-2 text-sm font-semibold text-ink">Nothing {status === "all" ? "filed" : status}</p>
          <p className="mt-0.5 text-[12px] text-ink-muted">Staff file OT, undertime and leave from the staff portal.</p>
        </div>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {rows.map((r) => {
            const meta = KIND_META[r.kind] ?? KIND_META.leave;
            const Icon = meta.icon;
            const range = r.end_date && r.end_date !== r.start_date
              ? `${prettyDate(r.start_date)} → ${prettyDate(r.end_date)}` : prettyDate(r.start_date);
            return (
              <div key={r.id} className="rounded-2xl border border-hairline bg-surface-1 p-3.5 shadow-card">
                <div className="flex items-start gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink-muted">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-ink">{r.employee_name}</p>
                      <Chip label={meta.label} tone={meta.tone} />
                      {r.status !== "pending" && (
                        <Chip label={r.status} tone={r.status === "approved" ? "green" : "red"} />
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {range}{r.hours ? ` · ${r.hours}h` : ""}
                      {r.leave_type_name ? ` · ${r.leave_type_name}` : ""}
                      {r.leave_paid === false ? " (unpaid)" : ""}
                    </p>
                    {r.reason && <p className="mt-1.5 text-[12px] italic text-ink-muted">“{r.reason}”</p>}
                    {r.decided_by && (
                      <p className="mt-1 text-[11px] text-ink-subtle">
                        {r.status === "approved" ? "Approved" : "Rejected"} by {r.decided_by}
                        {r.decision_note ? ` — ${r.decision_note}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => decide(r.id, true)} disabled={acting === r.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50">
                      {acting === r.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                    </button>
                    <button onClick={() => decide(r.id, false)} disabled={acting === r.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-hairline bg-surface-1 py-2.5 text-[13px] font-bold text-ink-muted transition active:scale-[0.98] disabled:opacity-50">
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── attendance ─────────────────────────────────────────────────────────────

const ATT_META: Record<string, { label: string; tone: Tone }> = {
  in: { label: "Clocked in", tone: "green" },
  out: { label: "Done", tone: "blue" },
  leave: { label: "On leave", tone: "brand" },
  dayoff: { label: "Day off", tone: "muted" },
  noschedule: { label: "No schedule", tone: "muted" },
  absent: { label: "Absent", tone: "red" },
};

function Attendance({ initial, compact }: { initial: HrAttendance | null; compact?: boolean }) {
  const [mode, setMode] = useState<"day" | "range">("day");
  const [data, setData] = useState(initial);
  const [date, setDate] = useState(initial?.date ?? ymd(new Date()));

  // Range defaults to the last 15 days — one semi-monthly cutoff.
  const [start, setStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 14); return ymd(d);
  });
  const [end, setEnd] = useState(ymd(new Date()));
  const [range, setRange] = useState<HrAttendanceRange | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const csv = useCsvDownload();

  function shift(days: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    const next = ymd(d);
    if (next > ymd(new Date())) return;
    setDate(next);
    startTransition(async () => setData(await loadAttendance(next)));
  }

  function loadRange(s: string, e: string) {
    setStart(s); setEnd(e); setErr(null);
    if (!s || !e || e < s) return;
    startTransition(async () => {
      const r = await loadAttendanceRange(s, e);
      if (!r) setErr("Couldn't load that range. Try 3 months or less.");
      setRange(r);
    });
  }

  const rows = data?.rows ?? [];
  const present = rows.filter((r) => r.status === "in" || r.status === "out").length;
  const late = rows.filter((r) => r.late_min > 0).length;
  const unscheduled = rows.filter((r) => !r.has_schedule).length;
  const isToday = date === ymd(new Date());

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex gap-1.5 rounded-2xl border border-hairline bg-surface-1 p-1.5">
          {(["day", "range"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); if (m === "range" && !range) loadRange(start, end); }}
              className={`flex-1 rounded-xl px-3 py-1.5 text-[12px] font-bold transition ${
                mode === m ? "bg-ink text-white" : "text-ink-muted hover:bg-surface-2"
              }`}>
              {m === "day" ? "Single day" : "Date range"}
            </button>
          ))}
        </div>
      )}

      {(compact || mode === "day") && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center justify-between rounded-2xl border border-hairline bg-surface-1 px-2 py-1.5">
              <button onClick={() => shift(-1)} className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-surface-3">
                <ChevronLeft size={16} />
              </button>
              <p className="text-[13px] font-bold text-ink">
                {prettyDate(date)}{isToday && <span className="ml-1.5 text-[11px] font-semibold text-brand-deep">Today</span>}
              </p>
              <button onClick={() => shift(1)} disabled={isToday}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-surface-3 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
            <ExportButton label="Export" busy={csv.busy === "att"}
              onClick={() => csv.run("att", () => exportAttendanceCsv(date))} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="Present" value={String(present)} icon={Users} />
            <Stat label="Late" value={String(late)} icon={Clock} tone={late > 0 ? "amber" : undefined} />
            <Stat label="Roster" value={String(rows.length)} icon={ClipboardCheck} />
          </div>

          {unscheduled > 0 && (
            <p className="rounded-xl border border-hairline bg-surface-1 px-3.5 py-2.5 text-[12px] text-ink-muted">
              <span className="font-semibold text-ink">{unscheduled} of {rows.length}</span>{" "}
              {unscheduled === 1 ? "person has" : "people have"} no shift schedule set, so late
              and absent can&apos;t be tracked for them. Add shift times in the POS app under Employees.
            </p>
          )}

          {pending ? (
            <div className="grid place-items-center py-14 text-ink-subtle"><Loader2 size={20} className="animate-spin" /></div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-card">
              {rows.length === 0 && <p className="py-12 text-center text-[13px] text-ink-muted">No active staff on the roster.</p>}
              {rows.map((r, i) => {
                const meta = ATT_META[r.status] ?? ATT_META.absent;
                return (
                  <div key={r.employee_id} className={`flex items-center gap-3 px-3.5 py-3 ${i > 0 ? "border-t border-hairline" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                        <Chip label={meta.label} tone={meta.tone} />
                        {r.late_min > 0 && <Chip label={`${r.late_min}m late`} tone="amber" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {r.role || "—"}
                        {r.sched_start != null && ` · sched ${clock(r.sched_start)}–${clock(r.sched_end)}`}
                        {r.leave_name ? ` · ${r.leave_name}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[12px] font-bold tabular-nums text-ink">
                        {clock(r.first_in)} <span className="text-ink-subtle">–</span> {clock(r.last_out)}
                      </p>
                      <p className="text-[11px] tabular-nums text-ink-muted">{r.worked_min > 0 ? hrs(r.worked_min) : "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!compact && mode === "range" && (
        <>
          <div className="space-y-2">
            <RangePicker start={start} end={end} onChange={loadRange} disabled={pending} />
            <button type="button" disabled={csv.busy === "range" || pending}
              onClick={() => csv.run("range", () => exportAttendanceRangeCsv(start, end))}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50">
              {csv.busy === "range" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export range
            </button>
          </div>

          <ErrorNote msg={err} />

          {pending ? (
            <div className="grid place-items-center py-14 text-ink-subtle"><Loader2 size={20} className="animate-spin" /></div>
          ) : range ? (
            <>
              <p className="px-1 text-[12px] text-ink-muted">
                {shortDate(range.start)} – {shortDate(range.end)} · {range.people.length} staff ·{" "}
                {range.rows.length} day records
              </p>
              <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-card">
                {/* Phone: stacked. Tablet up: table. */}
                <div className="divide-y divide-hairline md:hidden">
                  {range.people.map((p) => (
                    <div key={p.employee_id} className="px-3.5 py-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                        <p className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{hrs(p.worked_min)}</p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {p.days_present} present · {p.days_absent} absent
                        {p.days_leave > 0 && ` · ${p.days_leave} leave`}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] tabular-nums text-ink-muted">
                        {p.ot_min > 0 && <span>OT {hrs(p.ot_min)}</span>}
                        {p.undertime_min > 0 && <span>UT {hrs(p.undertime_min)}</span>}
                        {p.late_min > 0 && <span>{p.late_min}m late</span>}
                        {!p.has_schedule && <span className="text-amber-700">no schedule</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-hairline text-left text-[10px] uppercase tracking-wide text-ink-subtle">
                        <th className="px-3 py-2 font-semibold">Employee</th>
                        <th className="px-3 py-2 text-right font-semibold">Present</th>
                        <th className="px-3 py-2 text-right font-semibold">Absent</th>
                        <th className="px-3 py-2 text-right font-semibold">Leave</th>
                        <th className="px-3 py-2 text-right font-semibold">Hours</th>
                        <th className="px-3 py-2 text-right font-semibold">OT</th>
                        <th className="px-3 py-2 text-right font-semibold">Undertime</th>
                        <th className="px-3 py-2 text-right font-semibold">Late</th>
                      </tr>
                    </thead>
                    <tbody>
                      {range.people.map((p) => (
                        <tr key={p.employee_id} className="border-b border-hairline/60 last:border-0">
                          <td className="px-3 py-2 font-semibold text-ink">
                            {p.name}
                            {!p.has_schedule && <span className="ml-1.5 text-[10px] font-bold uppercase text-amber-700">no sched</span>}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{p.days_present}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{p.days_absent}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{p.days_leave}</td>
                          <td className="px-3 py-2 text-right font-bold tabular-nums text-ink">{hrs(p.worked_min)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{p.ot_min > 0 ? hrs(p.ot_min) : "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{p.undertime_min > 0 ? hrs(p.undertime_min) : "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{p.late_min > 0 ? `${p.late_min}m` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

// ── payroll ────────────────────────────────────────────────────────────────

/** Semi-monthly cutoffs around today: 1–15 and 16–end of month. */
function currentCutoff(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  if (now.getDate() <= 15) {
    return { start: ymd(new Date(y, m, 1)), end: ymd(new Date(y, m, 15)) };
  }
  return { start: ymd(new Date(y, m, 16)), end: ymd(new Date(y, m + 1, 0)) };
}

function GeneratePanel({ onDone }: { onDone: () => void }) {
  const cut = currentCutoff();
  const [start, setStart] = useState(cut.start);
  const [end, setEnd] = useState(cut.end);
  const [kind, setKind] = useState<PayPeriodKind>("semi_monthly");
  const [pf, setPf] = useState<HrPreflight | null>(null);
  const [checking, startCheck] = useTransition();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const csv = useCsvDownload();

  function check(s: string, e: string) {
    setStart(s); setEnd(e); setErr(null); setPf(null);
    if (!s || !e || e < s) return;
    startCheck(async () => setPf(await loadPreflight(s, e)));
  }

  async function generate() {
    setBusy(true); setErr(null);
    const res = await generatePayroll(start, end, kind);
    setBusy(false);
    if (!res.ok) { setErr(res.error ?? "Could not generate."); return; }
    onDone();
  }

  const blocked = pf?.duplicate === true;

  return (
    <div className="space-y-3 rounded-2xl border border-hairline bg-surface-1 p-3.5 shadow-card">
      <p className="text-[13px] font-bold text-ink">Generate a payroll run</p>

      <RangePicker start={start} end={end} onChange={check} disabled={busy} />

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(PERIOD_LABELS) as PayPeriodKind[]).map((k) => (
          <button key={k} onClick={() => setKind(k)} disabled={busy}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              k === kind ? "bg-ink text-white" : "border border-hairline bg-surface-1 text-ink-muted"
            }`}>{PERIOD_LABELS[k]}</button>
        ))}
      </div>

      {checking && (
        <p className="flex items-center gap-2 text-[12px] text-ink-muted">
          <Loader2 size={13} className="animate-spin" /> Checking attendance for this period…
        </p>
      )}

      {pf && !checking && (
        <div className="space-y-2 rounded-xl bg-surface-2 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-ink">
              {pf.headcount} staff · {pf.people.reduce((a, p) => a + p.days_present, 0)} days worked
            </p>
            <ExportButton label="Pre-check" busy={csv.busy === "pf"}
              onClick={() => csv.run("pf", () => exportPreflightCsv(start, end))} />
          </div>

          {pf.duplicate && (
            <p className="flex items-start gap-2 text-[12px] font-medium text-red-600">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              A run for these dates already exists. Delete it first to regenerate.
            </p>
          )}

          {/* These two turn payroll into nonsense, so they're stated plainly
              before the owner commits rather than discovered in the numbers. */}
          {pf.missing_rate > 0 && (
            <p className="flex items-start gap-2 text-[12px] text-amber-700">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              <span>
                <span className="font-bold">{pf.missing_rate} of {pf.headcount}</span> staff have no
                pay rate set — they will come out at ₱0.00. Set rates in the POS app under Employees.
              </span>
            </p>
          )}
          {pf.missing_schedule > 0 && (
            <p className="flex items-start gap-2 text-[12px] text-amber-700">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              <span>
                <span className="font-bold">{pf.missing_schedule} of {pf.headcount}</span> have no shift
                schedule, so every hour they work counts as <span className="font-bold">rest-day work</span> and
                is paid at the rest-day premium. Add shift times first if that isn&apos;t what you want.
              </span>
            </p>
          )}
          {pf.missing_rate === 0 && pf.missing_schedule === 0 && !pf.duplicate && (
            <p className="flex items-center gap-2 text-[12px] font-medium text-green-700">
              <CheckCircle2 size={14} /> Everyone has a rate and a schedule. Good to go.
            </p>
          )}
        </div>
      )}

      <ErrorNote msg={err} />

      <button onClick={generate} disabled={busy || blocked || !pf}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[13px] font-bold text-white transition active:scale-[0.99] disabled:opacity-40">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
        Generate run
      </button>
      <p className="text-center text-[11px] text-ink-subtle">
        Creates a draft you can review and edit. Nothing is paid out.
      </p>
    </div>
  );
}

function Payroll({ data, onRefresh }: { data: HrPayroll; onRefresh: () => void }) {
  const [openRun, setOpenRun] = useState<string | null>(null);
  const [showGen, setShowGen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const csv = useCsvDownload();
  const rhpd = data.regular_hours_per_day;

  async function act(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setActing(key); setErr(null);
    const res = await fn();
    if (!res.ok) setErr(res.error ?? "Something went wrong.");
    else onRefresh();
    setActing(null);
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setShowGen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-hairline bg-surface-1 p-3.5 text-left shadow-card transition hover:border-brand-soft">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-deep">
          <Plus size={17} />
        </span>
        <span className="flex-1 text-[13px] font-semibold text-ink">New payroll run</span>
        <ChevronRight size={16} className={`text-ink-subtle transition ${showGen ? "rotate-90" : ""}`} />
      </button>

      {showGen && <GeneratePanel onDone={() => { setShowGen(false); onRefresh(); }} />}

      <ErrorNote msg={err} />

      {data.runs.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface-1 py-14 text-center">
          <Wallet size={22} className="mx-auto text-ink-subtle" />
          <p className="mt-2 text-sm font-semibold text-ink">No payroll runs yet</p>
          <p className="mt-0.5 px-6 text-[12px] text-ink-muted">Generate one above for the current cutoff.</p>
        </div>
      ) : (
        data.runs.map((run: PayrollRun) => {
          const t = runTotals(run, rhpd);
          const open = openRun === run.id;
          const tone: Tone = run.status === "paid" ? "green" : run.status === "finalized" ? "blue" : "amber";
          const locked = run.status !== "draft";
          return (
            <div key={run.id} className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-card">
              <button onClick={() => setOpenRun(open ? null : run.id)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-surface-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-deep">
                  {locked ? <Lock size={16} /> : <Wallet size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[13px] font-semibold text-ink">
                      {prettyDate(run.period_start)} – {prettyDate(run.period_end)}
                    </p>
                    <Chip label={run.status} tone={tone} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {PERIOD_LABELS[run.kind]} · {t.headcount} {t.headcount === 1 ? "employee" : "employees"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-bold tabular-nums text-ink">{peso(t.net)}</p>
                  <p className="text-[10px] uppercase tracking-wide text-ink-subtle">Net</p>
                </div>
              </button>

              {open && (
                <div className="border-t border-hairline bg-surface-2/60">
                  <div className="grid grid-cols-3 gap-px bg-hairline">
                    {([["Gross", t.gross], ["Deductions", t.deductions], ["Net", t.net]] as const).map(([l, v]) => (
                      <div key={l} className="bg-surface-1 px-3 py-2.5 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-ink-subtle">{l}</p>
                        <p className="mt-0.5 text-[13px] font-bold tabular-nums text-ink">{peso(v)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-hairline md:hidden">
                    {run.slips.map((s) => (
                      <div key={s.id} className="px-3.5 py-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold text-ink">{s.employee_name}</p>
                          <p className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{peso(netCentavos(s, run.kind, rhpd))}</p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          {COMP_LABELS[s.compensation_type]} · {s.hours_worked}h
                          {s.ot_hours > 0 && ` · OT ${s.ot_hours}h`}
                          {s.undertime_hours > 0 && ` · UT ${s.undertime_hours}h`}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-ink-muted">
                          <span>Gross {peso(grossCentavos(s, run.kind, rhpd))}</span>
                          <span>Statutory {peso(statutoryCentavos(s, run.kind))}</span>
                          {undertimeCentavos(s, rhpd) > 0 && <span>UT −{peso(undertimeCentavos(s, rhpd))}</span>}
                          {s.restday_hours > 0 && <span className="text-amber-700">Rest day {s.restday_hours}h</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-hairline text-left text-[10px] uppercase tracking-wide text-ink-subtle">
                          <th className="px-3 py-2 font-semibold">Employee</th>
                          <th className="px-3 py-2 font-semibold">Basis</th>
                          <th className="px-3 py-2 text-right font-semibold">Hours</th>
                          <th className="px-3 py-2 text-right font-semibold">Rest day</th>
                          <th className="px-3 py-2 text-right font-semibold">OT</th>
                          <th className="px-3 py-2 text-right font-semibold">Gross</th>
                          <th className="px-3 py-2 text-right font-semibold">Statutory</th>
                          <th className="px-3 py-2 text-right font-semibold">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.slips.map((s) => (
                          <tr key={s.id} className="border-b border-hairline/60 last:border-0">
                            <td className="px-3 py-2 font-semibold text-ink">{s.employee_name}</td>
                            <td className="px-3 py-2 text-ink-muted">{COMP_LABELS[s.compensation_type]}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{s.hours_worked}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{s.restday_hours > 0 ? `${s.restday_hours}h` : "—"}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink-muted">
                              {s.ot_hours > 0 ? `${s.ot_hours}h · ${peso(otPayCentavos(s, rhpd))}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink">{peso(grossCentavos(s, run.kind, rhpd))}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{peso(statutoryCentavos(s, run.kind))}</td>
                            <td className="px-3 py-2 text-right font-bold tabular-nums text-ink">{peso(netCentavos(s, run.kind, rhpd))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 px-3.5 py-3">
                    <ExportButton label="Export" primary busy={csv.busy === run.id}
                      onClick={() => csv.run(run.id, () => exportPayrollCsv(run.id))} />
                    {!locked && (
                      <>
                        <button onClick={() => act(run.id + "re", () => regeneratePayroll(run.id))}
                          disabled={acting !== null}
                          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-3 py-1.5 text-[12px] font-semibold text-ink-muted transition hover:text-ink disabled:opacity-50">
                          {acting === run.id + "re" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                          Re-generate
                        </button>
                        <button onClick={() => act(run.id + "fin", () => setRunStatus(run.id, "finalized"))}
                          disabled={acting !== null}
                          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-3 py-1.5 text-[12px] font-semibold text-ink-muted transition hover:text-ink disabled:opacity-50">
                          <Lock size={13} /> Finalize
                        </button>
                        <button onClick={() => act(run.id + "del", () => deleteRun(run.id))}
                          disabled={acting !== null}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                          <Trash2 size={13} /> Delete
                        </button>
                      </>
                    )}
                    {run.status === "finalized" && (
                      <>
                        <button onClick={() => act(run.id + "paid", () => setRunStatus(run.id, "paid"))}
                          disabled={acting !== null}
                          className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-[12px] font-semibold text-white transition disabled:opacity-50">
                          <CheckCircle2 size={13} /> Mark paid
                        </button>
                        <button onClick={() => act(run.id + "dr", () => setRunStatus(run.id, "draft"))}
                          disabled={acting !== null}
                          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-3 py-1.5 text-[12px] font-semibold text-ink-muted transition hover:text-ink disabled:opacity-50">
                          Back to draft
                        </button>
                      </>
                    )}
                    {run.status === "paid" && run.paid_at && (
                      <span className="text-[11px] text-ink-subtle">
                        Paid {new Date(run.paid_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── shell ──────────────────────────────────────────────────────────────────

export function HrView({ summary, requests, attendance, payroll }: {
  summary: HrSummary; requests: HrRequest[];
  attendance: HrAttendance | null; payroll: HrPayroll;
}) {
  const [tab, setTab] = useState<Tab>("today");
  const [pay, setPay] = useState(payroll);
  const [, startRefresh] = useTransition();
  const pending = summary?.pending_total ?? 0;

  const refreshPayroll = () => startRefresh(async () => setPay(await loadPayroll()));

  const TABS: { key: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { key: "today", label: "Today", icon: Users },
    { key: "approvals", label: "Approvals", icon: ClipboardCheck, badge: pending },
    { key: "attendance", label: "Attendance", icon: CalendarClock },
    { key: "payroll", label: "Payroll", icon: Wallet },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-4 pb-24 sm:py-5">
      {/* Four equal columns rather than a scrolling row: "Payroll" was falling
          off the right edge on a phone, so the tab existed but couldn't be
          seen. Icon sits above the label until there's width for a row. */}
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-2xl border border-hairline bg-surface-1 p-1.5 shadow-card">
        {TABS.map((t) => {
          const on = t.key === tab;
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold transition sm:flex-row sm:gap-1.5 sm:px-3 sm:text-[13px] ${
                on ? "bg-ink text-white" : "text-ink-muted hover:bg-surface-2"
              }`}>
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{t.label}</span>
              {t.badge ? (
                <span className={`absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-extrabold sm:static sm:right-auto sm:top-auto ${
                  on ? "bg-white text-ink" : "bg-brand text-white"
                }`}>{t.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "today" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat label="Staff" value={String(summary?.headcount ?? 0)} sub="Active" icon={Users} />
            <Stat label="In today" value={String(summary?.in_today ?? 0)} sub="Clocked in" icon={Clock} />
            <Stat label="To approve" value={String(pending)} sub={pending ? "Needs you" : "All clear"} icon={ClipboardCheck} tone={pending ? "amber" : undefined} />
            <Stat label="Draft runs" value={String(summary?.draft_runs ?? 0)} sub="Payroll" icon={Wallet} />
          </div>

          {pending > 0 && (
            <button onClick={() => setTab("approvals")}
              className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-card transition hover:border-amber-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <ClipboardCheck size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{pending} request{pending === 1 ? "" : "s"} waiting</p>
                <p className="text-[12px] text-ink-muted">
                  {[
                    summary?.pending_ot ? `${summary.pending_ot} OT` : null,
                    summary?.pending_ut ? `${summary.pending_ut} undertime` : null,
                    summary?.pending_leave ? `${summary.pending_leave} leave` : null,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              <ChevronRight size={16} className="text-ink-subtle" />
            </button>
          )}

          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Who&apos;s in today</p>
            <Attendance initial={attendance} compact />
          </div>
        </div>
      )}

      {tab === "approvals" && <Approvals initial={requests} />}
      {tab === "attendance" && <Attendance initial={attendance} />}
      {tab === "payroll" && <Payroll data={pay} onRefresh={refreshPayroll} />}
    </main>
  );
}
