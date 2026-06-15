"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Gift, CheckCircle, Ban, Loader2, Sliders } from "lucide-react";
import type { Subscription } from "@/lib/data/types";
import { setSubscriptionStatus, extendAccess } from "@/app/admin/actions";
import { StatusDot } from "./bits";

/** Admin-only quick controls for a tenant's access. */
export function TenantActions({
  tenantId,
  sub,
}: {
  tenantId: string;
  sub: Subscription | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const status = sub?.status ?? "trialing";
  const paused = status === "paused";
  const canceled = status === "canceled";

  function run(key: string, fn: () => Promise<unknown>) {
    setBusyKey(key);
    startTransition(async () => {
      await fn();
      router.refresh();
      setBusyKey(null);
      setConfirmRevoke(false);
    });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface-1 p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-deep">
          <Sliders size={16} /> Manage access
        </h2>
        <StatusDot status={status} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {paused ? (
          <ActionBtn icon={Play} label="Resume" busy={busyKey === "resume"} disabled={isPending}
            onClick={() => run("resume", () => setSubscriptionStatus(tenantId, "active"))} />
        ) : (
          <ActionBtn icon={Pause} label="Pause" busy={busyKey === "pause"} disabled={isPending || canceled}
            onClick={() => run("pause", () => setSubscriptionStatus(tenantId, "paused"))} />
        )}
        <ActionBtn icon={CheckCircle} label="Activate" busy={busyKey === "activate"} disabled={isPending}
          onClick={() => run("activate", () => setSubscriptionStatus(tenantId, "active"))} />
        <ActionBtn icon={Gift} label="Grant +7 days" busy={busyKey === "g7"} disabled={isPending}
          onClick={() => run("g7", () => extendAccess(tenantId, 7))} />
        <ActionBtn icon={Gift} label="Grant +30 days" busy={busyKey === "g30"} disabled={isPending}
          onClick={() => run("g30", () => extendAccess(tenantId, 30))} />
      </div>

      <div className="mt-3 border-t border-hairline pt-3">
        {confirmRevoke ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[12px] text-ink-muted">Revoke this store&apos;s access?</span>
            <button
              onClick={() => run("revoke", () => setSubscriptionStatus(tenantId, "canceled"))}
              className="rounded-full bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              {busyKey === "revoke" ? "…" : "Yes, revoke"}
            </button>
            <button
              onClick={() => setConfirmRevoke(false)}
              className="rounded-full border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRevoke(true)}
            disabled={canceled || isPending}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600 disabled:opacity-40"
          >
            <Ban size={13} /> {canceled ? "Access revoked" : "Remove / revoke access"}
          </button>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  busy,
  disabled,
  onClick,
}: {
  icon: typeof Pause;
  label: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-1.5 rounded-xl border border-hairline bg-surface-2 px-3 py-2.5 text-[13px] font-semibold text-ink transition hover:border-brand-soft hover:bg-surface-3 disabled:opacity-40"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} className="text-brand-deep" />}
      {label}
    </button>
  );
}
