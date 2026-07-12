"use server";

import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/paymongo";

export type Store = {
  tenant_id: string;
  business_name: string;
  store_code: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

/** Stores the signed-in owner/co-owner can manage. Empty if not signed in. */
export async function getMyStores(): Promise<Store[]> {
  const supa = createClient();
  const { data, error } = await supa.rpc("my_stores");
  if (error) return [];
  return (data ?? []) as Store[];
}

/**
 * Identify-first gate: look up a store's subscription by store code + the
 * email used in the POS app. Returns null unless BOTH match (the RPC checks
 * the email against the store's owner/members), so codes can't be probed.
 * Pre-auth by design — managing/paying still requires signing in.
 */
export async function lookupSubscription(
  storeCode: string,
  email: string,
): Promise<Store | null> {
  const supa = createClient();
  const { data, error } = await supa.rpc("subscription_lookup", {
    p_store_code: storeCode.trim(),
    p_email: email.trim(),
  });
  if (error || !data) return null;
  const rows = data as Store[];
  return rows.length > 0 ? rows[0] : null;
}

/** Schedule a downgrade to Trial at period end (or undo it). */
export async function setCancel(
  tenantId: string,
  cancel: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  const supa = createClient();
  const { error } = await supa.rpc("set_subscription_cancel", {
    p_tenant: tenantId,
    p_cancel: cancel,
  });
  if (error) return { error: "Couldn't update your plan. Please try again." };
  return { ok: true };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function friendly(msg: string): string {
  if (msg.includes("NOT_AUTHORIZED"))
    return "You don't have access to that store.";
  if (msg.includes("BAD_PLAN")) return "Please pick Basic or Pro.";
  if (msg.includes("BAD_CYCLE")) return "Please pick monthly or yearly.";
  if (msg.includes("BAD_QTY")) return "Please choose between 1 and 20 branches.";
  if (msg.includes("PRO_REQUIRED"))
    return "Additional branches are available on the Pro plan.";
  return "Something went wrong. Please try again.";
}

/**
 * Create a pending request + a PayMongo checkout session for the chosen
 * store and plan. Returns the hosted checkout URL to redirect to.
 */
export async function createCheckout(input: {
  tenantId: string;
  plan: "basic" | "pro";
  cycle: "monthly" | "yearly";
}): Promise<{ url?: string; error?: string }> {
  const supa = createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data, error } = await supa.rpc("start_subscription_checkout", {
    p_tenant: input.tenantId,
    p_plan: input.plan,
    p_cycle: input.cycle,
  });
  if (error) return { error: friendly(error.message) };

  const req = data as {
    id: string;
    amount_cents: number;
    business_name: string;
    plan: string;
    cycle: string;
  };

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || "https://pos.prestigeitsolutions.tech";

  try {
    const { url } = await createCheckoutSession({
      amountCents: req.amount_cents,
      planLabel: `Prestige POS ${cap(req.plan)} (${req.cycle})`,
      description: `${req.business_name}: Prestige POS ${cap(req.plan)} (${req.cycle})`,
      email: user.email ?? undefined,
      successUrl: `${origin}/subscribe/success`,
      cancelUrl: `${origin}/subscribe?plan=${input.plan}&cancelled=1`,
      metadata: {
        request_id: req.id,
        tenant_id: input.tenantId,
        plan: input.plan,
        cycle: input.cycle,
      },
    });
    return { url };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Create a pending request + PayMongo checkout for N additional branches on a
 * Pro store. Same pipeline as a plan upgrade: the webhook calls
 * activate_subscription_by_request, which increments extra_branches. Pricing is
 * computed server-side in start_branch_addon_checkout.
 */
export async function createBranchCheckout(input: {
  tenantId: string;
  qty: number;
  cycle: "monthly" | "yearly";
}): Promise<{ url?: string; error?: string }> {
  const supa = createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data, error } = await supa.rpc("start_branch_addon_checkout", {
    p_tenant: input.tenantId,
    p_qty: input.qty,
    p_cycle: input.cycle,
  });
  if (error) return { error: friendly(error.message) };

  const req = data as {
    id: string;
    amount_cents: number;
    qty: number;
    business_name: string;
    cycle: string;
  };

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || "https://pos.prestigeitsolutions.tech";
  const label = `${req.qty} additional branch${req.qty > 1 ? "es" : ""} (${req.cycle})`;

  try {
    const { url } = await createCheckoutSession({
      amountCents: req.amount_cents,
      planLabel: `Prestige POS — ${label}`,
      description: `${req.business_name}: ${label}`,
      email: user.email ?? undefined,
      successUrl: `${origin}/subscribe/success`,
      cancelUrl: `${origin}/subscribe?branches=1&cancelled=1`,
      metadata: {
        request_id: req.id,
        tenant_id: input.tenantId,
        kind: "branch_addon",
        qty: String(req.qty),
        cycle: input.cycle,
      },
    });
    return { url };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
