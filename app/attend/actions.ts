"use server";

import { createClient } from "@/lib/supabase/server";

export type Roster = {
  business_name: string;
  geofenced: boolean;
  employees: { id: string; name: string }[];
};

export async function getRoster(
  code: string,
): Promise<{ ok: boolean; roster?: Roster; error?: string }> {
  const supa = createClient();
  const { data, error } = await supa.rpc("attendance_roster", {
    p_store_code: code.trim(),
  });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Store not found — check the QR code." };
  return { ok: true, roster: data as Roster };
}

export async function submitPunch(input: {
  code: string;
  employeeId: string;
  pin: string;
  kind: "in" | "out";
  lat: number | null;
  lng: number | null;
  selfie: string;
  device: string;
}): Promise<{
  ok: boolean;
  result?: { employee_name: string; kind: string; at: string };
  error?: string;
}> {
  // Validate the selfie payload before it reaches the DB (a crafted direct
  // POST could otherwise send a huge or non-image string).
  const selfie = input.selfie ?? "";
  if (selfie.length > 0) {
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(selfie)) {
      return { ok: false, error: "That photo didn't upload correctly. Try again." };
    }
    if (selfie.length > 3_000_000) {
      return { ok: false, error: "Photo is too large. Please try again." };
    }
  }

  const supa = createClient();
  const { data, error } = await supa.rpc("record_attendance_punch", {
    p_store_code: input.code.trim(),
    p_employee_id: input.employeeId,
    p_pin: input.pin,
    p_kind: input.kind,
    p_lat: input.lat,
    p_lng: input.lng,
    p_selfie: input.selfie,
    p_device: input.device,
  });
  if (error) return { ok: false, error: mapErr(error.message) };
  return { ok: true, result: data };
}

function mapErr(m: string): string {
  const far = m.match(/TOO_FAR:(\d+)/);
  if (far) return `You're about ${far[1]} m from the store — you can only clock in at the store.`;
  if (m.includes("BAD_PIN")) return "Wrong PIN — try again.";
  if (m.includes("EMPLOYEE_NOT_FOUND")) return "Pick your name first.";
  if (m.includes("SELFIE_REQUIRED")) return "Take a selfie first.";
  if (m.includes("GPS_REQUIRED")) return "Turn on location — you must be at the store to clock in.";
  if (m.includes("ALREADY_IN")) return "You're already clocked in.";
  if (m.includes("NOT_IN")) return "You haven't clocked in yet today.";
  if (m.includes("TOO_SOON")) return "Wait a few seconds, then try again.";
  if (m.includes("STORE_NOT_FOUND")) return "Store not found — check the QR code.";
  return "Something went wrong. Please try again.";
}
