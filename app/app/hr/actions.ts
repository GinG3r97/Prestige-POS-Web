"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getHrAttendance, getHrAttendanceRange, getHrPayroll, getHrPreflight,
  getHrRequests,
  type RequestStatus, type HrRequest, type AttendanceRow,
  type RangeDay, type RangePerson, type HrPreflight,
} from "@/lib/data/hr";
import {
  grossCentavos, netCentavos, statutoryCentavos, undertimeCentavos,
  absenceDeductionCentavos, otPayCentavos, restdayPremiumCentavos,
  nightdiffPremiumCentavos, holidayPremiumCentavos, hourlyEquivalent,
  sssCentavos, philhealthCentavos, pagibigCentavos,
  PERIOD_LABELS, COMP_LABELS, type PayPeriodKind,
} from "@/lib/payroll";

// ── mutations ──────────────────────────────────────────────────────────────

type Result = { ok: boolean; error?: string };

/** Turns a Postgres RAISE into something an owner can act on. */
function friendly(msg: string): string {
  const m = msg.toUpperCase();
  if (m.includes("DUPLICATE_PERIOD"))
    return "A run for these exact dates already exists. Open it, or delete it first to regenerate.";
  if (m.includes("RUN_LOCKED"))
    return "This run is finalized or paid, so it can't be changed. Set it back to Draft first.";
  if (m.includes("RUN_PAID")) return "Paid runs are kept as a record and can't be deleted.";
  if (m.includes("ALREADY_DECIDED")) return "Someone already decided this one.";
  if (m.includes("NOT_AUTHORIZED")) return "You don't have permission to do that.";
  if (m.includes("NOT_FOUND")) return "That no longer exists.";
  if (m.includes("BAD_RANGE")) return "The end date is before the start date.";
  if (m.includes("RANGE_TOO_LONG")) return "Pick a range of 3 months or less.";
  if (m.includes("DATE_REQUIRED")) return "Pick both dates first.";
  if (m.includes("BAD_KIND")) return "Unknown pay frequency.";
  if (m.includes("BAD_STATUS")) return "Unknown status.";
  return msg;
}

async function call(fn: string, args: Record<string, unknown>): Promise<Result> {
  const supa = createClient();
  const { error } = await supa.rpc(fn, args);
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/app/hr");
  return { ok: true };
}

export async function decideRequest(id: string, approved: boolean, note?: string) {
  return call("hr_decide", {
    p_id: id, p_approved: approved, p_note: note?.trim() || null,
  });
}

export async function generatePayroll(start: string, end: string, kind: PayPeriodKind) {
  return call("hr_generate_payroll", { p_start: start, p_end: end, p_kind: kind });
}

export async function regeneratePayroll(runId: string) {
  return call("hr_regenerate_payroll", { p_run: runId });
}

export async function setRunStatus(runId: string, status: "draft" | "finalized" | "paid") {
  return call("hr_set_run_status", { p_run: runId, p_status: status });
}

export async function updateSlip(slipId: string, bonus: number, deductions: number) {
  return call("hr_update_slip", {
    p_slip: slipId, p_bonus: bonus, p_deductions: deductions,
  });
}

export async function deleteRun(runId: string) {
  return call("hr_delete_run", { p_run: runId });
}

// ── reads used by client tabs ──────────────────────────────────────────────

export async function loadRequests(status: RequestStatus | "all") {
  return getHrRequests(status);
}
export async function loadAttendance(date: string) {
  return getHrAttendance(date);
}
export async function loadAttendanceRange(start: string, end: string) {
  return getHrAttendanceRange(start, end);
}
export async function loadPreflight(start: string, end: string) {
  return getHrPreflight(start, end);
}
export async function loadPayroll() {
  return getHrPayroll();
}

// ── CSV export ─────────────────────────────────────────────────────────────
//
// Built server-side so exported figures come from the same maths as the screen.
// Formatting choices, all aimed at a spreadsheet an owner opens on a PH Windows
// machine and hands to a bookkeeper:
//   · `sep=,` first line — Excel otherwise guesses from the locale and a comma
//     file lands as one column per row.
//   · A titled header block (store, period, generated-at, basis) so a printed
//     sheet says what it is without the filename.
//   · Numbers unformatted (no ₱, no thousands separators) so they stay numeric
//     and can be summed; a "Peso amounts" note explains the columns instead.
//   · Blank spacer rows and a TOTAL row aligned under its columns.

const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rows2csv = (rows: unknown[][]): string =>
  "sep=,\r\n" + rows.map((r) => r.map(esc).join(",")).join("\r\n");

/** Centavos → "1234.50" — numeric for the spreadsheet, 2dp for the eye. */
const money = (centavos: number) => (centavos / 100).toFixed(2);
/** Pesos stored as numeric → same shape. */
const money0 = (pesos: number) => (pesos ?? 0).toFixed(2);

/**
 * "8 hours and 8 minutes" — what the owner actually reads.
 * Kept alongside a decimal column wherever the figure needs summing, because
 * a spreadsheet can't add a sentence.
 */
function dur(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m === 0) return "—";
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hPart = h > 0 ? `${h} ${h === 1 ? "hour" : "hours"}` : "";
  const mPart = r > 0 ? `${r} ${r === 1 ? "minute" : "minutes"}` : "";
  if (hPart && mPart) return `${hPart} and ${mPart}`;
  return hPart || mPart;
}
/** Decimal hours for the columns a bookkeeper sums. */
const hoursDec = (min: number) => (min / 60).toFixed(2);
/** Same as dur(), for values already stored as decimal hours. */
const durH = (h: number) => dur(Math.round((h ?? 0) * 60));

/** Minutes-from-midnight → "7:30 AM". Handles a shift running past midnight. */
function time12(m: number | null): string {
  if (m == null) return "";
  const h24 = Math.floor(m / 60) % 24;
  const ap = h24 < 12 ? "AM" : "PM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m % 60).padStart(2, "0")} ${ap}`;
}

const DAY_STATUS: Record<string, string> = {
  worked: "Worked", restday: "Rest day worked", dayoff: "Day off",
  absent: "Absent", leave_paid: "Leave (paid)", leave_unpaid: "Leave (unpaid)",
  holiday_worked: "Holiday worked", holiday_paid: "Holiday (paid)",
  holiday_off: "Holiday (off)",
};

const nowStamp = () =>
  new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

function titleBlock(title: string, lines: [string, string][]): unknown[][] {
  return [[title], ...lines.map(([k, v]) => [k, v]), ["Generated", nowStamp()], []];
}

export type ExportFile = { filename: string; csv: string };

/** Payroll run — a summary block, then one fully itemized row per employee. */
export async function exportPayrollCsv(runId: string): Promise<ExportFile | null> {
  const { runs, regular_hours_per_day: rhpd } = await getHrPayroll();
  const run = runs.find((r) => r.id === runId);
  if (!run) return null;
  const k = run.kind;

  const totals = run.slips.reduce(
    (a, s) => ({
      gross: a.gross + grossCentavos(s, k, rhpd),
      net: a.net + netCentavos(s, k, rhpd),
      stat: a.stat + statutoryCentavos(s, k),
      ut: a.ut + undertimeCentavos(s, rhpd),
      abs: a.abs + absenceDeductionCentavos(s),
      ot: a.ot + otPayCentavos(s, rhpd),
    }),
    { gross: 0, net: 0, stat: 0, ut: 0, abs: 0, ot: 0 },
  );

  const head = [
    "Employee", "Role", "Pay basis", "Rate",
    "Hours worked", "Hours (decimal)", "Hourly equivalent",
    "Overtime", "OT hours (decimal)", "OT rate x", "OT pay",
    "Rest day", "Rest day pay", "Night differential", "Night diff pay",
    "Holiday premium", "Holiday prem pay",
    "Bonus", "GROSS",
    "SSS", "PhilHealth", "Pag-IBIG", "Statutory total",
    "Undertime", "Undertime deduction",
    "Late", "Absent days", "Absence deduction",
    "Other deductions", "Total deductions", "NET PAY",
  ];

  const body = run.slips.map((s) => {
    const gross = grossCentavos(s, k, rhpd);
    const net = netCentavos(s, k, rhpd);
    const rate =
      s.compensation_type === "hourly" ? s.hourly_rate
      : s.compensation_type === "daily" ? s.daily_rate
      : s.monthly_salary;
    return [
      s.employee_name, s.employee_role, COMP_LABELS[s.compensation_type], money0(rate),
      durH(s.hours_worked), s.hours_worked, hourlyEquivalent(s, rhpd).toFixed(2),
      durH(s.ot_hours), s.ot_hours, s.ot_multiplier, money(otPayCentavos(s, rhpd)),
      durH(s.restday_hours), money(restdayPremiumCentavos(s, rhpd)),
      durH(s.nightdiff_hours), money(nightdiffPremiumCentavos(s, rhpd)),
      durH(s.holiday_premium_hours), money(holidayPremiumCentavos(s, rhpd)),
      money0(s.bonus), money(gross),
      money(sssCentavos(s, k)), money(philhealthCentavos(s, k)), money(pagibigCentavos(s, k)),
      money(statutoryCentavos(s, k)),
      durH(s.undertime_hours), money(undertimeCentavos(s, rhpd)),
      dur(s.late_minutes), s.absent_days, money(absenceDeductionCentavos(s)),
      money0(s.deductions), money(gross - net), money(net),
    ];
  });

  // Pad the TOTAL row so each figure sits under its own column.
  const total = new Array(head.length).fill("");
  total[0] = "TOTAL";
  total[10] = money(totals.ot);
  total[18] = money(totals.gross);
  total[22] = money(totals.stat);
  total[24] = money(totals.ut);
  total[27] = money(totals.abs);
  total[29] = money(totals.gross - totals.net);
  total[30] = money(totals.net);

  const csv = rows2csv([
    ...titleBlock("PAYROLL RUN", [
      ["Period", `${run.period_start} to ${run.period_end}`],
      ["Frequency", PERIOD_LABELS[k]],
      ["Status", run.status.toUpperCase()],
      ["Employees", String(run.slips.length)],
      ["Basis", `${rhpd} regular hours/day, 26 days/month for hourly equivalent`],
      ["Note", "Peso amounts are plain numbers so they can be summed. Time is shown in words; the (decimal) columns are the ones to add up."],
    ]),
    head,
    ...body,
    [],
    total,
  ]);

  return { filename: `payroll_${run.period_start}_to_${run.period_end}.csv`, csv };
}

/** One day's roster. */
export async function exportAttendanceCsv(date: string): Promise<ExportFile | null> {
  const att = await getHrAttendance(date);
  if (!att) return null;

  const body = att.rows.map((r: AttendanceRow) => [
    r.name, r.role,
    r.status === "noschedule" ? "No schedule set" : (DAY_STATUS[r.status] ?? r.status),
    time12(r.sched_start), time12(r.sched_end), time12(r.first_in), time12(r.last_out),
    dur(r.worked_min), hoursDec(r.worked_min),
    r.late_min > 0 ? dur(r.late_min) : "—",
    r.leave_name ?? "",
  ]);

  const csv = rows2csv([
    ...titleBlock("DAILY ATTENDANCE", [
      ["Date", att.date],
      ["Timezone", att.timezone],
      ["Staff on roster", String(att.rows.length)],
    ]),
    ["Employee", "Role", "Status", "Sched in", "Sched out", "Time in", "Time out",
     "Hours worked", "Hours (decimal)", "Late", "Leave"],
    ...body,
  ]);

  return { filename: `attendance_${att.date}.csv`, csv };
}

/**
 * Attendance over a range: a per-employee summary first (what most owners
 * actually want), then the day-by-day detail below it in the same sheet.
 */
export async function exportAttendanceRangeCsv(
  start: string, end: string,
): Promise<ExportFile | null> {
  const att = await getHrAttendanceRange(start, end);
  if (!att) return null;

  const summaryHead = [
    "Employee", "Role", "Days present", "Days absent", "Days on leave",
    "Hours worked", "Hours (decimal)", "Regular-day hours", "Rest day hours",
    "Overtime", "Undertime", "Total late", "Schedule set?",
  ];
  const summary = att.people.map((p: RangePerson) => [
    p.name, p.role, p.days_present, p.days_absent, p.days_leave,
    dur(p.worked_min), hoursDec(p.worked_min),
    dur(Math.max(0, p.worked_min - p.restday_min)), dur(p.restday_min),
    dur(p.ot_min), dur(p.undertime_min), dur(p.late_min),
    p.has_schedule ? "Yes" : "NO",
  ]);

  const totals = att.people.reduce(
    (a, p) => ({
      present: a.present + p.days_present,
      absent: a.absent + p.days_absent,
      worked: a.worked + p.worked_min,
      ot: a.ot + p.ot_min,
      late: a.late + p.late_min,
    }),
    { present: 0, absent: 0, worked: 0, ot: 0, late: 0 },
  );
  const sumTotal = new Array(summaryHead.length).fill("");
  sumTotal[0] = "TOTAL";
  sumTotal[2] = totals.present;
  sumTotal[3] = totals.absent;
  sumTotal[5] = dur(totals.worked);
  sumTotal[6] = hoursDec(totals.worked);
  sumTotal[9] = dur(totals.ot);
  sumTotal[11] = dur(totals.late);

  const detail = att.rows.map((r: RangeDay) => [
    r.date,
    new Date(r.date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "short" }),
    r.name, r.role, DAY_STATUS[r.status] ?? r.status,
    time12(r.sched_start), time12(r.sched_end), time12(r.first_in), time12(r.last_out),
    dur(r.worked_min), hoursDec(r.worked_min),
    dur(r.late_min), dur(r.undertime_min),
    dur(r.ot_min), dur(r.restday_min), dur(r.nightdiff_min),
    r.leave_name ?? "", r.holiday_name ?? "",
  ]);

  const csv = rows2csv([
    ...titleBlock("ATTENDANCE REPORT", [
      ["Store", att.business_name],
      ["Period", `${att.start} to ${att.end}`],
      ["Timezone", att.timezone],
      ["Staff", String(att.people.length)],
      ["Note", "Times are 12-hour. Durations are in words; the (decimal) columns are the ones to add up. Days off with no work are omitted below."],
    ]),
    ["SUMMARY BY EMPLOYEE"],
    summaryHead,
    ...summary,
    sumTotal,
    [],
    [],
    ["DAY BY DAY"],
    ["Date", "Day", "Employee", "Role", "Status", "Sched in", "Sched out",
     "Time in", "Time out", "Hours worked", "Hours (decimal)", "Late",
     "Undertime", "Overtime", "Rest day", "Night differential", "Leave", "Holiday"],
    ...detail,
  ]);

  return { filename: `attendance_${att.start}_to_${att.end}.csv`, csv };
}

/** The requests log for whichever filter is on screen. */
export async function exportRequestsCsv(status: RequestStatus | "all"): Promise<ExportFile> {
  const reqs = await getHrRequests(status);
  const KIND: Record<string, string> = { ot: "Overtime", undertime: "Undertime", leave: "Leave" };

  const body = reqs.map((r: HrRequest) => [
    r.employee_name ?? "", r.role, KIND[r.kind] ?? r.kind,
    r.start_date, r.end_date ?? "", r.hours ?? "",
    r.leave_type_name ?? "",
    r.leave_paid === null ? "" : r.leave_paid ? "Paid" : "Unpaid",
    r.reason ?? "", r.status.toUpperCase(),
    r.decided_by ?? "",
    r.decided_at ? new Date(r.decided_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "",
    r.decision_note ?? "",
    new Date(r.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
  ]);

  const csv = rows2csv([
    ...titleBlock("STAFF REQUESTS", [
      ["Filter", status === "all" ? "All statuses" : status.toUpperCase()],
      ["Requests", String(reqs.length)],
    ]),
    ["Employee", "Role", "Type", "Start", "End", "Hours", "Leave type", "Paid?",
     "Reason", "Status", "Decided by", "Decided at", "Decision note", "Filed"],
    ...body,
  ]);

  return { filename: `requests_${status}.csv`, csv };
}

/** Pre-flight sheet — what a run would contain, plus what's unconfigured. */
export async function exportPreflightCsv(
  start: string, end: string,
): Promise<ExportFile | null> {
  const pf: HrPreflight | null = await getHrPreflight(start, end);
  if (!pf) return null;

  const body = pf.people.map((p) => [
    p.name, p.role, COMP_LABELS[p.compensation_type as keyof typeof COMP_LABELS] ?? p.compensation_type,
    money0(p.rate), p.has_rate ? "" : "NO RATE SET",
    p.days_present, p.absent_days,
    durH(p.hours), p.hours, durH(p.restday_hours), durH(p.ot_hours),
    p.has_schedule ? "Yes" : "NO SCHEDULE",
  ]);

  const csv = rows2csv([
    ...titleBlock("PAYROLL PRE-CHECK", [
      ["Period", `${pf.start} to ${pf.end}`],
      ["Staff", String(pf.headcount)],
      ["Missing pay rate", String(pf.missing_rate)],
      ["Missing schedule", String(pf.missing_schedule)],
    ]),
    ["Employee", "Role", "Pay basis", "Rate", "Rate warning",
     "Days present", "Days absent", "Regular hours", "Hours (decimal)",
     "Rest day", "Overtime", "Schedule"],
    ...body,
  ]);

  return { filename: `payroll_precheck_${pf.start}_to_${pf.end}.csv`, csv };
}
