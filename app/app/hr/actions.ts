"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getHrAttendance,
  getHrPayroll,
  getHrRequests,
  type RequestStatus,
  type HrRequest,
  type AttendanceRow,
} from "@/lib/data/hr";
import {
  grossCentavos,
  netCentavos,
  statutoryCentavos,
  undertimeCentavos,
  absenceDeductionCentavos,
  otPayCentavos,
  hourlyEquivalent,
  PERIOD_LABELS,
  COMP_LABELS,
} from "@/lib/payroll";

/** Approve or reject one request. Errors come back as text for the UI. */
export async function decideRequest(
  id: string,
  approved: boolean,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const { error } = await supa.rpc("hr_decide", {
    p_id: id,
    p_approved: approved,
    p_note: note?.trim() || null,
  });
  if (error) {
    const m = error.message.toUpperCase();
    if (m.includes("ALREADY_DECIDED"))
      return { ok: false, error: "Someone already decided this one." };
    if (m.includes("NOT_AUTHORIZED"))
      return { ok: false, error: "You don't have permission to decide this." };
    if (m.includes("NOT_FOUND"))
      return { ok: false, error: "That request no longer exists." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/app/hr");
  return { ok: true };
}

export async function loadRequests(status: RequestStatus | "all") {
  return getHrRequests(status);
}

export async function loadAttendance(date: string) {
  return getHrAttendance(date);
}

// ── CSV export ─────────────────────────────────────────────────────────────
// Built on the server so the numbers come from the same math as the screen.
// Excel on a PH Windows box guesses the separator from the locale, so we lead
// with a `sep=,` hint; without it a comma file opens as one column per row.

const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rows2csv = (rows: unknown[][]): string =>
  "sep=,\n" + rows.map((r) => r.map(esc).join(",")).join("\r\n");

const pesos = (centavos: number) => (centavos / 100).toFixed(2);

/** Clock minutes-from-midnight → "07:30". Blank when never punched. */
const hhmm = (m: number | null) =>
  m == null ? "" : `${Math.floor(m / 60) % 24}`.padStart(2, "0") + ":" + `${m % 60}`.padStart(2, "0");

export type ExportFile = { filename: string; csv: string };

/** One payroll run, one row per employee, every component itemized. */
export async function exportPayrollCsv(runId: string): Promise<ExportFile | null> {
  const { runs, regular_hours_per_day: rhpd } = await getHrPayroll();
  const run = runs.find((r) => r.id === runId);
  if (!run) return null;

  const head = [
    "Employee", "Role", "Pay basis", "Hours worked", "Hourly rate", "Daily rate",
    "Monthly salary", "OT hours", "OT multiplier", "OT pay", "Undertime hours",
    "Undertime deduction", "Late minutes", "Rest day hours", "Night diff hours",
    "Holiday premium hours", "Absent days", "Absence deduction", "Bonus",
    "SSS", "PhilHealth", "Pag-IBIG", "Statutory total", "Other deductions",
    "GROSS", "NET",
  ];

  const body = run.slips.map((s) => [
    s.employee_name, s.employee_role, COMP_LABELS[s.compensation_type],
    s.hours_worked, s.hourly_rate, s.daily_rate, s.monthly_salary,
    s.ot_hours, s.ot_multiplier, pesos(otPayCentavos(s, rhpd)),
    s.undertime_hours, pesos(undertimeCentavos(s, rhpd)), s.late_minutes,
    s.restday_hours, s.nightdiff_hours, s.holiday_premium_hours,
    s.absent_days, pesos(absenceDeductionCentavos(s)), s.bonus,
    s.sss, s.philhealth, s.pagibig, pesos(statutoryCentavos(s, run.kind)),
    s.deductions,
    pesos(grossCentavos(s, run.kind, rhpd)),
    pesos(netCentavos(s, run.kind, rhpd)),
  ]);

  const totalGross = run.slips.reduce((a, s) => a + grossCentavos(s, run.kind, rhpd), 0);
  const totalNet = run.slips.reduce((a, s) => a + netCentavos(s, run.kind, rhpd), 0);

  const csv = rows2csv([
    ["Payroll run", `${run.period_start} to ${run.period_end}`],
    ["Frequency", PERIOD_LABELS[run.kind]],
    ["Status", run.status],
    ["Employees", run.slips.length],
    ["Hourly-equivalent basis", `${rhpd} hours/day, 26 days/month`],
    [],
    head,
    ...body,
    [],
    ["TOTAL", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", pesos(totalGross), pesos(totalNet)],
  ]);

  return { filename: `payroll-${run.period_start}-to-${run.period_end}.csv`, csv };
}

/** One day's roster, one row per employee. */
export async function exportAttendanceCsv(date: string): Promise<ExportFile | null> {
  const att = await getHrAttendance(date);
  if (!att) return null;

  const body = att.rows.map((r: AttendanceRow) => [
    r.name, r.role, r.status,
    hhmm(r.sched_start), hhmm(r.sched_end),
    hhmm(r.first_in), hhmm(r.last_out),
    (r.worked_min / 60).toFixed(2), r.late_min, r.leave_name ?? "",
  ]);

  const csv = rows2csv([
    ["Attendance", att.date],
    ["Timezone", att.timezone],
    [],
    ["Employee", "Role", "Status", "Sched in", "Sched out", "Time in", "Time out", "Hours worked", "Late (min)", "Leave"],
    ...body,
  ]);

  return { filename: `attendance-${att.date}.csv`, csv };
}

/** The requests log — whatever status filter is on screen. */
export async function exportRequestsCsv(
  status: RequestStatus | "all",
): Promise<ExportFile> {
  const reqs = await getHrRequests(status);
  const body = reqs.map((r: HrRequest) => [
    r.employee_name ?? "", r.role, r.kind,
    r.start_date, r.end_date ?? "", r.hours ?? "",
    r.leave_type_name ?? "", r.leave_paid === null ? "" : r.leave_paid ? "Paid" : "Unpaid",
    r.reason ?? "", r.status, r.decided_by ?? "", r.decided_at ?? "", r.decision_note ?? "",
    r.created_at,
  ]);

  const csv = rows2csv([
    ["Requests", status === "all" ? "All" : status],
    [],
    ["Employee", "Role", "Type", "Start", "End", "Hours", "Leave type", "Paid?",
     "Reason", "Status", "Decided by", "Decided at", "Note", "Filed"],
    ...body,
  ]);

  return { filename: `requests-${status}.csv`, csv };
}
