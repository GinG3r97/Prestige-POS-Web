import {
  Wallet,
  ReceiptText,
  Boxes,
  Users,
  Building2,
  Tag,
  AlertTriangle,
  Clock,
  PauseCircle,
  Ban,
} from "lucide-react";
import type { TenantDetail } from "@/lib/data/types";
import { peso, num, timeAgo } from "@/lib/format";
import { PlanBadge, StatusDot } from "./bits";
import { SubscriptionEditor } from "./subscription-editor";
import { TenantActions } from "./tenant-actions";

function Section({
  title,
  icon: Icon,
  children,
  right,
}: {
  title: string;
  icon: typeof Wallet;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface-1 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-deep">
          <Icon size={16} /> {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function StoreDashboard({
  d,
  editable = false,
}: {
  d: TenantDetail;
  editable?: boolean;
}) {
  const k = d.kpis;
  const status = d.subscription?.status ?? "trialing";
  const openToday = d.recent_shifts.some(
    (s) =>
      s.status === "open" ||
      new Date(s.opened_at).toDateString() === new Date().toDateString(),
  );

  return (
    <div className="space-y-4">
      {/* Access banner */}
      {(status === "paused" || status === "canceled") && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-[13px] font-semibold ${
            status === "paused"
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status === "paused" ? <PauseCircle size={16} /> : <Ban size={16} />}
          {status === "paused" ? "Access paused" : "Access revoked"}
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-hairline bg-surface-1 p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
              {d.tenant.business_name}
            </h1>
            <p className="mt-1 text-[12px] text-ink-muted">
              {d.tenant.address || "No address on file"}
            </p>
          </div>
          <PlanBadge plan={d.subscription?.plan ?? null} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              openToday ? "bg-green-50 text-green-700" : "bg-surface-3 text-ink-muted"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${openToday ? "bg-green-500" : "bg-ink-subtle"}`} />
            {openToday ? "Open today" : "Quiet today"}
          </span>
          <span>Last sale {timeAgo(k.last_order_at)}</span>
          <span>Since {new Date(d.tenant.created_at).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}</span>
        </div>
      </div>

      {/* Admin controls */}
      {editable && <TenantActions tenantId={d.tenant.id} sub={d.subscription} />}

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <CountCard icon={Tag} label="Products" value={d.counts.products} />
        <CountCard icon={Boxes} label="Categories" value={d.counts.categories} />
        <CountCard icon={Boxes} label="Inventory" value={d.counts.inventory} />
        <CountCard icon={Users} label="Employees" value={d.counts.employees} />
        <CountCard icon={Building2} label="Branches" value={d.counts.branches} />
        <CountCard icon={AlertTriangle} label="Low stock" value={d.counts.low_stock} warn={d.counts.low_stock > 0} />
      </div>

      {/* Section cards — single column on phone, 2-col masonry on tablet/desktop */}
      <div className="lg:columns-2 lg:gap-4 [&>section]:mb-4 lg:[&>section]:break-inside-avoid">
        {d.low_stock_items.length > 0 && (
          <Section title="Low / out of stock" icon={AlertTriangle}>
            <ul className="space-y-2">
              {d.low_stock_items.map((it) => (
                <li key={it.name} className="flex items-center justify-between text-[13px]">
                  <span className="min-w-0 truncate text-ink">{it.name}</span>
                  <span className="shrink-0 font-medium text-red-600">
                    {num(it.stock)} / {num(it.threshold)} {it.unit ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Cashier shifts" icon={Clock}>
          {d.recent_shifts.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">No shifts recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {d.recent_shifts.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 border-b border-hairline/60 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                      <span className={`h-1.5 w-1.5 rounded-full ${s.status === "open" ? "bg-green-500" : "bg-ink-subtle"}`} />
                      {s.opened_by || "Cashier"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">
                      {new Date(s.opened_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {s.status === "open" ? " · open" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-semibold text-ink">{peso(s.total_sales)}</p>
                    <p className="text-[11px] text-ink-subtle">{num(s.orders)} orders</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent orders" icon={ReceiptText}>
          {d.recent_orders.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">No orders yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {d.recent_orders.map((o, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
                  <div className="min-w-0">
                    <span className="font-medium text-ink">#{o.order_number}</span>
                    <span className="ml-2 text-ink-subtle">{o.cashier || "—"}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {o.status !== "paid" && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-600">{o.status}</span>
                    )}
                    <span className="text-ink-muted">{timeAgo(o.at)}</span>
                    <span className="w-16 text-right font-semibold text-ink">{peso(o.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Team" icon={Users}>
          {d.employees.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">No employees added.</p>
          ) : (
            <ul className="grid gap-2">
              {d.employees.map((e, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-hairline bg-surface-2 px-3 py-2 text-[13px]">
                  <span className="min-w-0 truncate font-medium text-ink">{e.name}</span>
                  <span className="shrink-0 text-[11px] text-ink-muted">{e.role ?? e.status ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Subscription" icon={Wallet}>
          {editable ? (
            <SubscriptionEditor tenantId={d.tenant.id} sub={d.subscription} />
          ) : d.subscription ? (
            <div className="space-y-2.5 text-[13px]">
              <Row label="Plan"><PlanBadge plan={d.subscription.plan} /></Row>
              <Row label="Status"><StatusDot status={d.subscription.status} /></Row>
              <Row label="Price">
                {d.subscription.price_cents > 0
                  ? `${peso(d.subscription.price_cents)} / ${d.subscription.billing_cycle}`
                  : "—"}
              </Row>
              <Row label="Started">{new Date(d.subscription.started_at).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })}</Row>
              <Row label="Renews">
                {d.subscription.current_period_end
                  ? new Date(d.subscription.current_period_end).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </Row>
            </div>
          ) : (
            <p className="text-[13px] text-ink-subtle">No subscription record.</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function CountCard({
  icon: Icon,
  label,
  value,
  warn = false,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 text-center shadow-card ${warn ? "border-red-200 bg-red-50" : "border-hairline bg-surface-1"}`}>
      <Icon size={16} className={`mx-auto ${warn ? "text-red-500" : "text-brand-deep"}`} />
      <p className={`mt-1 text-lg font-semibold ${warn ? "text-red-600" : "text-ink"}`}>{num(value)}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-subtle">{label}</p>
    </div>
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
