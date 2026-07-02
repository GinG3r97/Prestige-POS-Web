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
};

/** Stores the signed-in owner/co-owner can manage. Empty if not signed in. */
export async function getMyStores(): Promise<Store[]> {
  const supa = createClient();
  const { data, error } = await supa.rpc("my_stores");
  if (error) return [];
  return (data ?? []) as Store[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function friendly(msg: string): string {
  if (msg.includes("NOT_AUTHORIZED"))
    return "You don't have access to that store.";
  if (msg.includes("BAD_PLAN")) return "Please pick Basic or Pro.";
  if (msg.includes("BAD_CYCLE")) return "Please pick monthly or yearly.";
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
