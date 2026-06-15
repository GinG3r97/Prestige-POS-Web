import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { TenantOverview } from "@/lib/data/types";
import { peso, num, timeAgo } from "@/lib/format";
import { PlanBadge } from "./bits";

/** One client row on the admin home grid. */
export function StoreCard({ t }: { t: TenantOverview }) {
  return (
    <Link
      href={`/admin/${t.tenant_id}`}
      className="group block rounded-2xl border border-hairline bg-surface-1 p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">{t.business_name}</h3>
          <span
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              t.open_shift_today ? "bg-green-50 text-green-700" : "bg-surface-3 text-ink-muted"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${t.open_shift_today ? "bg-green-500" : "bg-ink-subtle"}`} />
            {t.open_shift_today ? "Open today" : "Quiet"}
          </span>
        </div>
        <PlanBadge plan={t.plan} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-2 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-ink-subtle">Today</p>
          <p className="text-[15px] font-semibold text-ink">{peso(t.revenue_today_cents)}</p>
          <p className="text-[10px] text-ink-subtle">{num(t.orders_today)} orders</p>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-ink-subtle">30-day</p>
          <p className="text-[15px] font-semibold text-ink">{peso(t.revenue_30d_cents)}</p>
          <p className="text-[10px] text-ink-subtle">all-time {peso(t.gross_cents)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
        <span className="flex items-center gap-2">
          <span>{num(t.product_count)} products</span>
          <span>·</span>
          <span>{num(t.employee_count)} staff</span>
          {t.low_stock_count > 0 && (
            <span className="inline-flex items-center gap-0.5 text-red-600">
              <AlertTriangle size={11} /> {num(t.low_stock_count)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1">
          {timeAgo(t.last_order_at)}
          <ChevronRight size={14} className="text-ink-subtle transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
