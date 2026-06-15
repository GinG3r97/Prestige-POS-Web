"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setGeofence(
  lat: number,
  lng: number,
  radius: number,
): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const { error } = await supa.rpc("set_store_geofence", {
    p_lat: lat,
    p_lng: lng,
    p_radius: Math.round(radius),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/attendance");
  return { ok: true };
}
