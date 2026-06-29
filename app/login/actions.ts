"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

/**
 * Sends a 6-digit OTP. Admins (allowlist) are auto-provisioned on first
 * login; everyone else must already be a store owner — a non-existent
 * email returns "No account found" instead of silently creating one.
 */
export async function requestOtp(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const supa = createClient();
  // Admins and granted co-owners (tenant_members) may self-provision on
  // first sign-in; everyone else must already have an account.
  let allowCreate = isAdminEmail(clean);
  if (!allowCreate) {
    const { data } = await supa.rpc("email_is_member", { p_email: clean });
    allowCreate = data === true;
  }
  const { error } = await supa.auth.signInWithOtp({
    email: clean,
    options: { shouldCreateUser: allowCreate },
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("signups not allowed") || m.includes("not found")) {
      return {
        ok: false,
        error: "No account found for this email. Ask your provider to add you.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Where to send the user after a verified login (admin → /admin via DB check). */
export async function postLoginPath(): Promise<string> {
  const supa = createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return "/login";
  const { data: admin } = await supa.rpc("is_admin");
  return admin === true ? "/admin" : "/app";
}
