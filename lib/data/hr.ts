import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PayrollRun } from "@/lib/payroll";

/**
 * HR reads for the owner portal. Everything goes through the hr_* SECURITY
 * DEFINER RPCs, which authorize owner / co-owner / admin in-DB — the HR tables'
 * own RLS only matches tenants.owner_id, so a co-owner reading them directly
 * would silently get nothing.
 */

export type RequestKind = "leave" | "ot" | "undertime";
export type RequestStatus = "pending" | "approved" | "rejected";

export type HrRequest = {
  id: string;
  employee_id: string;
  employee_name: string | null;
  role: string;
  kind: RequestKind;
  start_date: string;
  end_date: string | null;
  leave_type_name: string | null;
  leave_paid: boolean | null;
  hours: number | null;
  reason: string | null;
  status: RequestStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
};

export type HrSummary = {
  tenant_id: string;
  business_name: string;
  date: string;
  timezone: string;
  headcount: number;
  pending_total: number;
  pending_leave: number;
  pending_ot: number;
  pending_ut: number;
  in_today: number;
  draft_runs: number;
  rules: { regular_hours_per_day?: number } | null;
} | null;

export type AttendanceRow = {
  employee_id: string;
  name: string;
  role: string;
  /** False when the employee has no shift schedule at all — see status. */
  has_schedule: boolean;
  sched_start: number | null;
  sched_end: number | null;
  first_in: number | null;
  last_out: number | null;
  worked_min: number;
  late_min: number;
  /** "noschedule" = nothing configured, distinct from a real "dayoff". */
  status: "in" | "out" | "leave" | "dayoff" | "noschedule" | "absent";
  leave_name: string | null;
};

export type HrAttendance = {
  date: string;
  timezone: string;
  rows: AttendanceRow[];
};

export type HrPayroll = {
  regular_hours_per_day: number;
  runs: PayrollRun[];
};

export async function getHrSummary(): Promise<HrSummary> {
  const supa = createClient();
  const { data, error } = await supa.rpc("hr_summary");
  if (error) return null;
  return data as HrSummary;
}

export async function getHrRequests(
  status: RequestStatus | "all" = "pending",
): Promise<HrRequest[]> {
  const supa = createClient();
  const { data, error } = await supa.rpc("hr_requests", { p_status: status });
  if (error) return [];
  return (data ?? []) as HrRequest[];
}

export async function getHrAttendance(date?: string): Promise<HrAttendance | null> {
  const supa = createClient();
  const { data, error } = await supa.rpc("hr_attendance", {
    p_date: date ?? null,
  });
  if (error) return null;
  return data as HrAttendance;
}

export async function getHrPayroll(): Promise<HrPayroll> {
  const supa = createClient();
  const { data, error } = await supa.rpc("hr_payroll", { p_run: null });
  if (error) return { regular_hours_per_day: 8, runs: [] };
  return data as HrPayroll;
}
