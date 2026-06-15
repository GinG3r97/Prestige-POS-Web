"use server";

import { createClient } from "@/lib/supabase/server";

export type StoreMatch = {
  tenant_id: string;
  business_name: string;
  store_code: string;
  plan: string;
};

export async function lookupStore(
  code: string,
  email: string,
): Promise<{ ok: boolean; store?: StoreMatch; error?: string }> {
  const supa = createClient();
  const { data, error } = await supa.rpc("lookup_store", {
    p_code: code.trim(),
    p_email: email.trim(),
  });
  if (error) return { ok: false, error: error.message };
  if (!data) {
    return {
      ok: false,
      error: "That Store ID and email don't match. Check both and try again.",
    };
  }
  return { ok: true, store: data as StoreMatch };
}

export async function submitUpgrade(input: {
  code: string;
  email: string;
  plan: "basic" | "pro";
  cycle: "monthly" | "yearly";
  reference: string;
}): Promise<{ ok: boolean; businessName?: string; amountCents?: number; error?: string }> {
  const supa = createClient();
  const { data, error } = await supa.rpc("submit_upgrade_request", {
    p_code: input.code.trim(),
    p_email: input.email.trim(),
    p_plan: input.plan,
    p_cycle: input.cycle,
    p_reference: input.reference.trim(),
  });
  if (error) {
    const m = error.message;
    if (m.includes("STORE_NOT_FOUND"))
      return { ok: false, error: "That Store ID and email don't match." };
    if (m.includes("REF_REQUIRED"))
      return { ok: false, error: "Enter your GCash reference number." };
    return { ok: false, error: m };
  }
  const d = data as { business_name: string; amount_cents: number };
  return { ok: true, businessName: d.business_name, amountCents: d.amount_cents };
}
