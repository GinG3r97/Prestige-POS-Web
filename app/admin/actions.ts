"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Defense-in-depth: every admin RPC also enforces is_admin() in-DB, but server
 * actions are plain POST endpoints callable by any signed-in user, so we re-check
 * here too. Fail closed.
 */
async function ensureAdmin(
  supa: ReturnType<typeof createClient>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return "Please sign in.";
  const { data } = await supa.rpc("is_admin");
  if (data !== true) return "Not authorized.";
  return null;
}

export type SubscriptionInput = {
  tenantId: string;
  plan: string;
  status: string;
  priceCents: number;
  billingCycle: string;
  periodEnd: string | null; // yyyy-mm-dd or null
};

export async function updateSubscription(
  input: SubscriptionInput,
): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const denied = await ensureAdmin(supa);
  if (denied) return { ok: false, error: denied };
  const { error } = await supa.rpc("admin_update_subscription", {
    p_tenant: input.tenantId,
    p_plan: input.plan,
    p_status: input.status,
    p_price_cents: Math.round(input.priceCents),
    p_billing_cycle: input.billingCycle,
    p_period_end: input.periodEnd ? new Date(input.periodEnd).toISOString() : null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/${input.tenantId}`);
  revalidatePath("/admin");
  return { ok: true };
}

/** Pause / resume / activate / revoke — quick status change. */
export async function setSubscriptionStatus(
  tenantId: string,
  status: "trialing" | "active" | "past_due" | "paused" | "canceled",
): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const denied = await ensureAdmin(supa);
  if (denied) return { ok: false, error: denied };
  const { error } = await supa.rpc("admin_set_subscription_status", {
    p_tenant: tenantId,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/${tenantId}`);
  revalidatePath("/admin");
  return { ok: true };
}

/** Verify (activate the paid plan) or reject a GCash payment request. */
export async function resolvePayment(
  id: string,
  action: "verify" | "reject",
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const denied = await ensureAdmin(supa);
  if (denied) return { ok: false, error: denied };
  const { error } = await supa.rpc("admin_resolve_payment", {
    p_id: id,
    p_action: action,
    p_note: note ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return { ok: true };
}

/** Grant / extend access by N days (also flips to active). */
export async function extendAccess(
  tenantId: string,
  days: number,
): Promise<{ ok: boolean; error?: string }> {
  const supa = createClient();
  const denied = await ensureAdmin(supa);
  if (denied) return { ok: false, error: denied };
  const { error } = await supa.rpc("admin_extend_access", {
    p_tenant: tenantId,
    p_days: days,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/${tenantId}`);
  revalidatePath("/admin");
  return { ok: true };
}
