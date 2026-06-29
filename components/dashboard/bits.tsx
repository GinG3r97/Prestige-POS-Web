import type { LucideIcon } from "lucide-react";
import { peso } from "@/lib/format";

/** Small stat card used in the KPI grid. */
export function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-card ${
        accent
          ? "border-brand/30 bg-gradient-to-br from-brand-tint/60 to-surface-1"
          : "border-hairline bg-surface-1"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        {Icon && <Icon size={15} className="text-brand-deep" />}
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-subtle">{sub}</p>}
    </div>
  );
}

const PLAN_STYLES: Record<string, string> = {
  pro: "bg-brand text-white",
  basic: "bg-brand-tint text-brand-deep",
  trial: "bg-amber-100 text-amber-700",
};

export function PlanBadge({ plan }: { plan: string | null }) {
  const p = plan ?? "trial";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        PLAN_STYLES[p] ?? "bg-surface-3 text-ink-muted"
      }`}
    >
      {p}
    </span>
  );
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  trialing: "bg-amber-500",
  past_due: "bg-red-500",
  paused: "bg-orange-500",
  canceled: "bg-ink-subtle",
};

export function StatusDot({ status }: { status: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status ?? ""] ?? "bg-ink-subtle"}`} />
      {status ?? "—"}
    </span>
  );
}

/** 14-day revenue mini bar chart from the `daily` series. */
export function Bars({ data }: { data: { d: string; rev: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-hairline text-[12px] text-ink-subtle">
        No sales in the last 14 days
      </div>
    );
  }
  const max = Math.max(...data.map((x) => x.rev), 1);
  return (
    <div className="flex h-24 items-end gap-1">
      {data.map((x) => (
        <div key={x.d} className="group flex h-full flex-1 flex-col items-center justify-end">
          <div
            title={`${new Date(x.d).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} · ${peso(x.rev)}`}
            className="w-full rounded-t bg-brand/70 transition group-hover:bg-brand"
            style={{ height: `${Math.max(6, (x.rev / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
