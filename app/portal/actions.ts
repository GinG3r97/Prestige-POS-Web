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

export async function getMe(): Promise<PortalMe> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_me");
  return (data as PortalMe) ?? null;
}

export async function getToday(date: string): Promise<DaySummary> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_my_summary", { p_date: date });
  return (data as DaySummary) ?? null;
}

export async function getClockOpen(): Promise<boolean> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_clock_open");
  return data === true;
}

export async function getRequests(): Promise<PortalRequest[]> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_my_requests");
  return (data ?? []) as PortalRequest[];
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const supa = createClient();
  const { data } = await supa.rpc("portal_leave_types");
  return (data ?? []) as LeaveType[];
}

export async function punch(input: {
  kind: "in" | "out";
  lat: number | null;
  lng: number | null;
  selfie: string;
  device: string;
}): Promise<{ ok: boolean; result?: { kind: string; at: string }; error?: string }> {
  const supa = createClient();
  const { data, error } = await supa.rpc("portal_punch", {
    p_kind: input.kind,
    p_lat: input.lat,
    p_lng: input.lng,
    p_selfie: input.selfie,
    p_device: input.device,
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
}): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const { error } = await supa.rpc("file_request", {
    p_kind: input.kind,
    p_start: input.start,
    p_end: input.end,
    p_leave_type: input.leaveType,
    p_hours: input.hours,
    p_reason: input.reason,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
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
