"use client";

import { useState, useTransition } from "react";
import {
  Users, CalendarClock, Wallet, ClipboardCheck, Check, X, Download,
  ChevronLeft, ChevronRight, Loader2, Clock, Plane, TrendingUp, TrendingDown,
} from "lucide-react";
import { peso } from "@/lib/format";
import {
  runTotals, grossCentavos, netCentavos, statutoryCentavos,
  undertimeCentavos, otPayCentavos, PERIOD_LABELS, COMP_LABELS,
  type PayrollRun,
} from "@/lib/payroll";
import type {
  HrSummary, HrRequest, HrAttendance, HrPayroll, RequestStatus,
} from "@/lib/data/hr";
import {
  decideRequest, loadRequests, loadAttendance,
  exportPayrollCsv, exportAttendanceCsv, exportRequestsCsv,
} from "@/app/app/hr/actions";

type Tab = "today" | "approvals" | "attendance" | "payroll";

// ── small shared pieces ────────────────────────────────────────────────────

/** Minutes-from-midnight → "7:30 AM". Handles past-midnight (>1440). */
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

function Chip({ label, tone }: { label: string; tone: "green" | "red" | "amber" | "brand" | "muted" | "blue" }) {
  const c = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    brand: "bg-brand-tint text-brand-deep",
    muted: "bg-surface-3 text-ink-muted",
  }[tone];
  return <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${c}`}>{label}</span>;
}

function Stat({ label, value, sub, icon: Icon, tone }: {
  label: string; value: string; sub?: string;
  icon: typeof Users; tone?: "brand" | "amber";
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

/** Triggers a client-side download from CSV text built on the server. */
function useCsvDownload() {
  const [busy, setBusy] = useState<string | null>(null);
  async function run(key: string, fetcher: () => Promise<{ filename: string; csv: string } | null>) {
    setBusy(key);
    try {
      const file = await fetcher();
      if (!file) return;
      // ﻿ so Excel reads UTF-8 (₱ and ñ) instead of mangling it.
      const blob = new Blob(["﻿" + file.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }
  return { busy, run };
}

function ExportButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-3 py-1.5 text-[12px] font-semibold text-ink-muted transition hover:text-ink disabled:opacity-50"
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {label}
    </button>
  );
}

const KIND_META: Record<string, { label: string; tone: "blue" | "amber" | "brand"; icon: typeof Clock }> = {
  ot: { label: "Overtime", tone: "blue", icon: TrendingUp },
  undertime: { label: "Undertime", tone: "amber", icon: TrendingDown },
  leave: { label: "Leave", tone: "brand", icon: Plane },
};

// ── tabs ───────────────────────────────────────────────────────────────────

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
    setActing(id);
    setErr(null);
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
          <button
            key={s}
            onClick={() => switchStatus(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
              s === status ? "bg-ink text-white" : "border border-hairline bg-surface-1 text-ink-muted"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto" />
        <ExportButton
          label="Export"
          busy={csv.busy === "req"}
          onClick={() => csv.run("req", () => exportRequestsCsv(status))}
        />
      </div>

      {err && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">{err}</p>
      )}

      {pending ? (
        <div className="grid place-items-center py-14 text-ink-subtle"><Loader2 size={20} className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface-1 py-14 text-center">
          <ClipboardCheck size={22} className="mx-auto text-ink-subtle" />
          <p className="mt-2 text-sm font-semibold text-ink">Nothing {status === "all" ? "filed" : status}</p>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            Staff file OT, undertime and leave from the staff portal.
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {rows.map((r) => {
            const meta = KIND_META[r.kind] ?? KIND_META.leave;
            const Icon = meta.icon;
            const range = r.end_date && r.end_date !== r.start_date
              ? `${prettyDate(r.start_date)} → ${prettyDate(r.end_date)}`
              : prettyDate(r.start_date);
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
                      {range}
                      {r.hours ? ` · ${r.hours}h` : ""}
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
                    <button
                      onClick={() => decide(r.id, true)}
                      disabled={acting === r.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                    >
                      {acting === r.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => decide(r.id, false)}
                      disabled={acting === r.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-hairline bg-surface-1 py-2.5 text-[13px] font-bold text-ink-muted transition active:scale-[0.98] disabled:opacity-50"
                    >
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

const ATT_META: Record<string, { label: string; tone: "green" | "muted" | "red" | "brand" | "blue" }> = {
  in: { label: "Clocked in", tone: "green" },
  out: { label: "Done", tone: "blue" },
  leave: { label: "On leave", tone: "brand" },
  dayoff: { label: "Day off", tone: "muted" },
  // Not the same as a day off: nobody set this person's shift, so there is no
  // schedule to judge late / absent against.
  noschedule: { label: "No schedule", tone: "muted" },
  absent: { label: "Absent", tone: "red" },
};

function Attendance({ initial }: { initial: HrAttendance | null }) {
  const [data, setData] = useState(initial);
  const [date, setDate] = useState(initial?.date ?? ymd(new Date()));
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

  const rows = data?.rows ?? [];
  const present = rows.filter((r) => r.status === "in" || r.status === "out").length;
  const late = rows.filter((r) => r.late_min > 0).length;
  const unscheduled = rows.filter((r) => !r.has_schedule).length;
  const isToday = date === ymd(new Date());

  return (
    <div className="space-y-3">
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
        <ExportButton label="Export" busy={csv.busy === "att"} onClick={() => csv.run("att", () => exportAttendanceCsv(date))} />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Present" value={String(present)} icon={Users} />
        <Stat label="Late" value={String(late)} icon={Clock} tone={late > 0 ? "amber" : undefined} />
        <Stat label="Roster" value={String(rows.length)} icon={ClipboardCheck} />
      </div>

      {/* Late / absent can't be computed without shift times, so say so plainly
          rather than quietly reporting everyone as "No schedule". */}
      {unscheduled > 0 && (
        <p className="rounded-xl border border-hairline bg-surface-1 px-3.5 py-2.5 text-[12px] text-ink-muted">
          <span className="font-semibold text-ink">{unscheduled} of {rows.length}</span>{" "}
          {unscheduled === 1 ? "person has" : "people have"} no shift schedule set, so
          late and absent can&apos;t be tracked for them. Add shift times in the POS
          app under Employees.
        </p>
      )}

      {pending ? (
        <div className="grid place-items-center py-14 text-ink-subtle"><Loader2 size={20} className="animate-spin" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-card">
          {rows.length === 0 && (
            <p className="py-12 text-center text-[13px] text-ink-muted">No active staff on the roster.</p>
          )}
          {rows.map((r, i) => {
            const meta = ATT_META[r.status] ?? ATT_META.absent;
            return (
              <div key={r.employee_id}
                className={`flex items-center gap-3 px-3.5 py-3 ${i > 0 ? "border-t border-hairline" : ""}`}>
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
                  <p className="text-[11px] tabular-nums text-ink-muted">
                    {r.worked_min > 0 ? hrs(r.worked_min) : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Payroll({ data }: { data: HrPayroll }) {
  const [openRun, setOpenRun] = useState<string | null>(null);
  const csv = useCsvDownload();
  const rhpd = data.regular_hours_per_day;

  if (data.runs.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface-1 py-14 text-center">
        <Wallet size={22} className="mx-auto text-ink-subtle" />
        <p className="mt-2 text-sm font-semibold text-ink">No payroll runs yet</p>
        <p className="mt-0.5 px-6 text-[12px] text-ink-muted">
          Generate a run in the POS app under Payroll — it will show up here for
          review and export.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.runs.map((run: PayrollRun) => {
        const t = runTotals(run, rhpd);
        const open = openRun === run.id;
        const tone = run.status === "paid" ? "green" : run.status === "finalized" ? "blue" : "amber";
        return (
          <div key={run.id} className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-card">
            <button
              onClick={() => setOpenRun(open ? null : run.id)}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-surface-2"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-deep">
                <Wallet size={17} />
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
                  {[["Gross", t.gross], ["Deductions", t.deductions], ["Net", t.net]].map(([l, v]) => (
                    <div key={l as string} className="bg-surface-1 px-3 py-2.5 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-ink-subtle">{l as string}</p>
                      <p className="mt-0.5 text-[13px] font-bold tabular-nums text-ink">{peso(v as number)}</p>
                    </div>
                  ))}
                </div>

                {/* Phone: stacked cards. Tablet and up: a real table. */}
                <div className="divide-y divide-hairline md:hidden">
                  {run.slips.map((s) => (
                    <div key={s.id} className="px-3.5 py-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">{s.employee_name}</p>
                        <p className="shrink-0 text-[13px] font-bold tabular-nums text-ink">
                          {peso(netCentavos(s, run.kind, rhpd))}
                        </p>
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
                        {s.deductions > 0 && <span>Other −{peso(s.deductions * 100)}</span>}
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

                <div className="flex justify-end px-3.5 py-3">
                  <ExportButton
                    label="Export this run"
                    busy={csv.busy === run.id}
                    onClick={() => csv.run(run.id, () => exportPayrollCsv(run.id))}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── shell ──────────────────────────────────────────────────────────────────

export function HrView({
  summary, requests, attendance, payroll,
}: {
  summary: HrSummary;
  requests: HrRequest[];
  attendance: HrAttendance | null;
  payroll: HrPayroll;
}) {
  const [tab, setTab] = useState<Tab>("today");
  const pending = summary?.pending_total ?? 0;

  const TABS: { key: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { key: "today", label: "Today", icon: Users },
    { key: "approvals", label: "Approvals", icon: ClipboardCheck, badge: pending },
    { key: "attendance", label: "Attendance", icon: CalendarClock },
    { key: "payroll", label: "Payroll", icon: Wallet },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-4 pb-24 sm:py-5">
      {/* Tabs — scrollable on phones, full width from tablet up */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto rounded-2xl border border-hairline bg-surface-1 p-1.5 shadow-card">
        {TABS.map((t) => {
          const on = t.key === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition sm:text-[13px] ${
                on ? "bg-ink text-white" : "text-ink-muted hover:bg-surface-2"
              }`}
            >
              <Icon size={15} />
              {t.label}
              {t.badge ? (
                <span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-extrabold ${
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
            <button
              onClick={() => setTab("approvals")}
              className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-card transition hover:border-amber-300"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <ClipboardCheck size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {pending} request{pending === 1 ? "" : "s"} waiting
                </p>
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
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Who&apos;s in today
            </p>
            <Attendance initial={attendance} />
          </div>
        </div>
      )}

      {tab === "approvals" && <Approvals initial={requests} />}
      {tab === "attendance" && <Attendance initial={attendance} />}
      {tab === "payroll" && <Payroll data={payroll} />}
    </main>
  );
}
