"use client";

import { useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import type { Subscription } from "@/lib/data/types";
import { peso } from "@/lib/format";
import { PlanBadge, StatusDot } from "./bits";
import { updateSubscription } from "@/app/admin/actions";

const PLANS = ["trial", "basic", "pro"];
const STATUSES = ["trialing", "active", "past_due", "paused", "canceled"];
const CYCLES = ["monthly", "yearly"];

/** Admin-only inline editor for a tenant's subscription. */
export function SubscriptionEditor({
  tenantId,
  sub,
}: {
  tenantId: string;
  sub: Subscription | null;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plan, setPlan] = useState(sub?.plan ?? "trial");
  const [status, setStatus] = useState(sub?.status ?? "trialing");
  const [price, setPrice] = useState(((sub?.price_cents ?? 0) / 100).toString());
  const [cycle, setCycle] = useState(sub?.billing_cycle ?? "monthly");
  const [periodEnd, setPeriodEnd] = useState(
    sub?.current_period_end ? sub.current_period_end.slice(0, 10) : "",
  );

  async function save() {
    setBusy(true);
    setError(null);
    const res = await updateSubscription({
      tenantId,
      plan,
      status,
      priceCents: Math.round(parseFloat(price || "0") * 100),
      billingCycle: cycle,
      periodEnd: periodEnd || null,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save.");
      return;
    }
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="space-y-2.5 text-[13px]">
        <Row label="Plan"><PlanBadge plan={sub?.plan ?? "trial"} /></Row>
        <Row label="Status"><StatusDot status={sub?.status ?? "trialing"} /></Row>
        <Row label="Price">
          {sub && sub.price_cents > 0 ? `${peso(sub.price_cents)} / ${sub.billing_cycle}` : "—"}
        </Row>
        <Row label="Renews">
          {sub?.current_period_end
            ? new Date(sub.current_period_end).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })
            : "—"}
        </Row>
        <button
          onClick={() => setEditing(true)}
          className="mt-1 flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-brand-deep transition hover:bg-surface-3"
        >
          <Pencil size={13} /> Edit subscription
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[13px]">
      <Field label="Plan">
        <Seg options={PLANS} value={plan} onChange={setPlan} />
      </Field>
      <Field label="Status">
        <Seg options={STATUSES} value={status} onChange={setStatus} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₱)">
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 outline-none focus:border-brand"
          />
        </Field>
        <Field label="Billing">
          <Seg options={CYCLES} value={cycle} onChange={setCycle} />
        </Field>
      </div>
      <Field label="Renews on">
        <input
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 outline-none focus:border-brand"
        />
      </Field>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save</>}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-full border border-hairline bg-surface-1 px-4 py-2.5 text-[13px] font-semibold text-ink-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Seg({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
            value === o
              ? "bg-brand text-white"
              : "border border-hairline bg-surface-2 text-ink-muted hover:text-ink"
          }`}
        >
          {o.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{children}</span>
    </div>
  );
}
