"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Receipt } from "lucide-react";
import type { PaymentRequest } from "@/lib/data/types";
import { peso, timeAgo } from "@/lib/format";
import { resolvePayment } from "@/app/admin/actions";

export function PaymentsList({ requests }: { requests: PaymentRequest[] }) {
  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-5">
      <Section title={`To verify (${pending.length})`}>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-surface-1 p-6 text-center text-sm text-ink-subtle">
            No payments waiting. 🎉
          </p>
        ) : (
          pending.map((r) => <Card key={r.id} r={r} actionable />)
        )}
      </Section>

      {resolved.length > 0 && (
        <Section title="History">
          {resolved.map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-deep">{title}</h2>
      {children}
    </div>
  );
}

function Card({ r, actionable = false }: { r: PaymentRequest; actionable?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"verify" | "reject" | null>(null);

  function run(action: "verify" | "reject") {
    setBusy(action);
    startTransition(async () => {
      await resolvePayment(r.id, action);
      router.refresh();
      setBusy(null);
    });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface-1 p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">{r.business_name}</p>
          <p className="text-[12px] text-ink-muted">
            <span className="font-mono">{r.store_code}</span> · {r.email}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
            r.status === "pending"
              ? "bg-amber-100 text-amber-700"
              : r.status === "verified"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {r.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-xl bg-surface-2 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-ink-subtle">Plan</p>
          <p className="font-semibold capitalize text-ink">
            {r.requested_plan} · {r.billing_cycle}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-ink-subtle">Amount</p>
          <p className="font-semibold text-ink">{peso(r.amount_cents)}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-muted">
        <Receipt size={13} /> Ref <span className="font-mono text-ink">{r.gcash_reference}</span>
        <span className="ml-auto">{timeAgo(r.created_at)}</span>
      </div>

      {actionable ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => run("verify")}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-green-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {busy === "verify" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Verify & activate
          </button>
          <button
            onClick={() => run("reject")}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 rounded-full border border-hairline px-4 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            {busy === "reject" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Reject
          </button>
        </div>
      ) : (
        r.verified_by && (
          <p className="mt-2 text-[11px] text-ink-subtle">
            {r.status} by {r.verified_by} {r.verified_at ? timeAgo(r.verified_at) : ""}
          </p>
        )
      )}
    </div>
  );
}
