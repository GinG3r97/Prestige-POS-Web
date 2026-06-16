"use server";

import { createClient } from "@/lib/supabase/server";

export async function requestPortalOtp(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const supa = createClient();
  const { data: isPortal } = await supa.rpc("email_is_portal", { p_email: clean });
  if (!isPortal) {
    return {
      ok: false,
      error: "No portal access for this email. Ask your manager to enable it.",
    };
  }
  const { error } = await supa.auth.signInWithOtp({
    email: clean,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
