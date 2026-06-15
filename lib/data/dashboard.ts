import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentRequest, TenantDetail, TenantOverview } from "./types";

/**
 * All data runs through SECURITY DEFINER functions that authorize the caller
 * in-DB (admin allowlist or tenant owner), so we use the user's own session —
 * no service-role key required.
 */

export async function getTenantOverviews(): Promise<TenantOverview[]> {
  const supa = createClient();
  const { data, error } = await supa.rpc("admin_tenant_overviews");
  if (error) throw new Error(error.message);
  return (data ?? []) as TenantOverview[];
}

export async function getTenantDetail(tenantId: string): Promise<TenantDetail> {
  const supa = createClient();
  const { data, error } = await supa.rpc("admin_tenant_detail", {
    p_tenant: tenantId,
  });
  if (error) throw new Error(error.message);
  return data as TenantDetail;
}

export async function getMyTenantId(): Promise<string | null> {
  const supa = createClient();
  const { data, error } = await supa.rpc("my_tenant_id");
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function getPaymentRequests(): Promise<PaymentRequest[]> {
  const supa = createClient();
  const { data, error } = await supa.rpc("admin_payment_requests");
  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentRequest[];
}

export async function isAdmin(): Promise<boolean> {
  const supa = createClient();
  const { data } = await supa.rpc("is_admin");
  return data === true;
}
