"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ScheduleEntry = { weekday: number; start: string; end: string };
export type PortalMe = {
  employee_id: string;
  tenant_id: string;
  name: string;
  schedule: ScheduleEntry[] | null;
  store_code: string | null;
  geofenced: boolean;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_radius_m: number;
  selfie_required: boolean;
} | null;

export type DaySummary = {
  date: string;
  dayoff: boolean;
  worked_min: number;
  regular_min: number;
  late_min: number;
  undertime_min: number;
  ot_min: number;
  ot_pending_min: number;
  restday_min: number;
  nightdiff_min: number;
  first_in: number | null;
  last_out: number | null;
} | null;

export type PortalRequest = {
  id: string;
  kind: "leave" | "ot" | "undertime";
  start_date: string;
  end_date: string | null;
  leave_type_name: string | null;
  hours: number | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  decision_note: string | null;
  created_at: string;
};

export type LeaveType = { id: string; name: string; paid: boolean; emoji?: string };

export type WeekSummary = {
  week_start: string;
  week_end: string;
  offset: number;
  days: NonNullable<DaySummary>[];
  totals: {
    worked_min: number; late_min: number; undertime_min: number;
    ot_min: number; restday_min: number;
  };
} | null;

export type LeaveCredit = {
  id: string;
  name: string;
  emoji?: string;
  paid: boolean;
  annual_days: number | null;
  used_days: number;
  remaining_days: number | null;
};

// Every portal RPC takes the store code from the QR's ?store=. It checks the
// signed-in email is an employee AT THAT store — it never widens access, so
// it's safe to pass straight from the URL. (No store picker: the URL decides.)
export async function getMe(store?: string | null): Promise<PortalMe> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_me", { p_store: store ?? null });
  return (data as PortalMe) ?? null;
}

export async function getToday(date: string, store?: string | null): Promise<DaySummary> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_my_summary", { p_date: date, p_store: store ?? null });
  return (data as DaySummary) ?? null;
}

export async function getClockOpen(store?: string | null): Promise<boolean> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_clock_open", { p_store: store ?? null });
  return data === true;
}

export async function getRequests(store?: string | null): Promise<PortalRequest[]> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_my_requests", { p_store: store ?? null });
  return (data ?? []) as PortalRequest[];
}

export async function getLeaveTypes(store?: string | null): Promise<LeaveType[]> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_leave_types", { p_store: store ?? null });
  return (data ?? []) as LeaveType[];
}

export async function getWeek(offset: number, store?: string | null): Promise<WeekSummary> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_week", { p_offset: offset, p_store: store ?? null });
  return (data as WeekSummary) ?? null;
}

export async function getLeaveCredits(store?: string | null): Promise<LeaveCredit[]> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_leave_credits", { p_store: store ?? null });
  return (data ?? []) as LeaveCredit[];
}

export type PortalPayslip = {
  run_id: string;
  period_start: string;
  period_end: string;
  kind: "weekly" | "biweekly" | "semi_monthly" | "monthly";
  status: "finalized" | "paid";
  paid_at: string | null;
  compensation_type: "hourly" | "daily" | "salaried";
  hours_worked: number;
  hourly_rate: number;
  daily_rate: number;
  monthly_salary: number;
  bonus: number;
  deductions: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  ot_hours: number;
  undertime_hours: number;
  late_minutes: number;
  ot_multiplier: number;
  deduct_undertime: boolean;
  restday_hours: number;
  restday_mult: number;
  nightdiff_hours: number;
  nightdiff_mult: number;
  absent_days: number;
  holiday_premium_hours: number;
  regular_hours_per_day: number;
};

export async function getMyPayslips(store?: string | null): Promise<PortalPayslip[]> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_my_payslips", { p_store: store ?? null });
  return (data ?? []) as PortalPayslip[];
}

export async function punch(input: {
  kind: "in" | "out";
  lat: number | null;
  lng: number | null;
  selfie: string;
  device: string;
  store?: string | null;
}): Promise<{ ok: boolean; result?: { kind: string; at: string }; error?: string }> {
  const supa = createClient();
  const { data, error } = await supa.rpc("portal_punch", {
    p_kind: input.kind,
    p_lat: input.lat,
    p_lng: input.lng,
    p_selfie: input.selfie,
    p_device: input.device,
    p_store: input.store ?? null,
  });
  if (error) return { ok: false, error: mapPunchErr(error.message) };
  return { ok: true, result: data };
}

export async function fileRequest(input: {
  kind: "leave" | "ot" | "undertime";
  start: string;
  end: string | null;
  leaveType: string | null;
  hours: number | null;
  reason: string;
  store?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const { error } = await supa.rpc("file_request", {
    p_kind: input.kind,
    p_start: input.start,
    p_end: input.end,
    p_leave_type: input.leaveType,
    p_hours: input.hours,
    p_reason: input.reason,
    p_store: input.store ?? null,
  });
  if (error) return { ok: false, error: mapFileErr(error.message) };
  return { ok: true };
}

function mapFileErr(m: string): string {
  if (m.includes("NOT_PORTAL_USER") || m.includes("NOT_AUTHORIZED"))
    return "Your portal access isn't active.";
  if (m.includes("BAD_KIND")) return "That request type isn't allowed.";
  if (m.toLowerCase().includes("date")) return "Check the dates and try again.";
  return "Couldn't file the request. Please try again.";
}

export async function portalSignOut() {
  const supa = createClient();
  await supa.auth.signOut();
  redirect("/portal/login");
}

function mapPunchErr(m: string): string {
  const far = m.match(/TOO_FAR:(\d+)/);
  if (far) return `You're about ${far[1]} m away — clock in at the store.`;
  if (m.includes("SELFIE_REQUIRED")) return "Take a selfie first.";
  if (m.includes("GPS_REQUIRED")) return "Turn on location — you must be at the store.";
  if (m.includes("ALREADY_IN")) return "You're already clocked in.";
  if (m.includes("NOT_IN")) return "You haven't clocked in yet.";
  if (m.includes("TOO_SOON")) return "Wait a few seconds and try again.";
  if (m.includes("NOT_PORTAL_USER")) return "Your portal access isn't active.";
  return "Something went wrong. Try again.";
}
