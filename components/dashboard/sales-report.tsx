"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, CreditCard, Tag, Layers, TrendingUp, Award, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { peso, pesoCompact, num, PAYMENT_LABELS } from "@/lib/format";
import { Bars } from "./bits";

/** Shape returned by the public.tenant_sales_report RPC. */
type SalesReportData = {
  range: { from: string; to: string; method: string | null };
  kpis: {
    revenue_cents: number;
    orders: number;
    avg_ticket_cents: number;
    last_order_at: string | null;
  };
  split: {
    general_cents: number;
    separated_cents: number;
    general_qty: number;
    separated_qty: number;
  };
  payment_mix: { method: string; amount: number; count: number }[];
  by_category: { category: string; cents: number; qty: number; separated: boolean }[];
  top_sellers: { name: string; qty: number; revenue: number }[];
  daily: { d: string; rev: number; orders: number }[];
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

/** Local-time day boundaries (PH users run in +08, so "today" lines up). */
function rangeBounds(key: RangeKey): { from: Date; to: Date } {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startToday.getDate() + 1);
  switch (key) {
    case "today":
      return { from: startToday, to: startTomorrow };
    case "yesterday": {
      const y = new Date(startToday);
      y.setDate(y.getDate() - 1);
      return { from: y, to: startToday };
    }
    case "7d": {
      const f = new Date(startToday);
      f.setDate(f.getDate() - 6);
      return { from: f, to: startTomorrow };
    }
    case "30d": {
      const f = new Date(startToday);
      f.setDate(f.getDate() - 29);
      return { from: f, to: startTomorrow };
    }
    case "month": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: f, to: startTomorrow };
    }
    case "all":
      return { from: new Date(2000, 0, 1), to: startTomorrow };
  }
}

const fmtDay = (d: Date) => d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });

/** Plain-language label of the period being shown, e.g. "Jun 1 – Jun 29". */
function rangeLabel(key: RangeKey): string {
  if (key === "all") return "All time";
  const { from, to } = rangeBounds(key);
  const last = new Date(to);
  last.setDate(last.getDate() - 1);
  if (key === "today") return `Today · ${fmtDay(from)}`;
  if (key === "yesterday") return `Yesterday · ${fmtDay(from)}`;
  if (from.toDateString() === last.toDateString()) return fmtDay(from);
  return `${fmtDay(from)} – ${fmtDay(last)}`;
}

/** Payment-method tones — mirror the POS app's Reports palette. */
const PAY_TONE: Record<string, string> = {
  cash: "#5C8A6B",
  gcash: "#3D5A7A",
  qrph: "#6E5AA0",
  bank_transfer: "#7C8F65",
  paymaya: "#8A5A8A",
  card: "#C29A36",
  other: "#8A8A8A",
};
const toneFor = (m: string) => PAY_TONE[m] ?? "#8A8A8A";

export function SalesReport({ tenantId }: { tenantId: string }) {
  const supa = useMemo(() => createClient(), []);
  const [rangeKey, setRangeKey] = useState<RangeKey>("today");
  const [method, setMethod] = useState<string | null>(null);
  const [tab, setTab] = useState<"regular" | "separated">("regular");
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(false);
    const { from, to } = rangeBounds(rangeKey);
    const { data: d, error } = await supa.rpc("tenant_sales_report", {
      p_tenant: tenantId,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
      p_method: method,
    });
    if (error) {
      setErr(true);
      setData(null);
    } else {
      setData(d as SalesReportData);
    }
    setLoading(false);
  }, [supa, tenantId, rangeKey, method]);

  useEffect(() => {
    load();
  }, [load]);

  // Only surface the Regular/Separated split when this store actually
  // separates anything — otherwise it's noise.
  const hasSeparated =
    (data?.by_category ?? []).some((c) => c.separated) ||
    (data?.split.separated_cents ?? 0) > 0;
  const activeTab = hasSeparated ? tab : "regular";

  const cats = (data?.by_category ?? []).filter(
    (c) => c.separated === (activeTab === "separated"),
  );
  const catTotal = cats.reduce((a, c) => a + c.cents, 0) || 1;
  const payTotal = (data?.payment_mix ?? []).reduce((a, p) => a + p.amount, 0) || 1;
  const methodLabel = method ? PAYMENT_LABELS[method] ?? method : null;

  return (
    <section className="rounded-2xl border border-hairline bg-surface-1 p-5 shadow-card">
      {/* Heading + refresh */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-deep">
          <TrendingUp size={16} /> Sales
        </h2>
        <button
          onClick={load}
          className="grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface-1 text-ink-muted transition hover:text-ink"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Pick a period */}
      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {RANGES.map((r) => (
          <Chip key={r.key} active={rangeKey === r.key} onClick={() => setRangeKey(r.key)}>
            {r.label}
          </Chip>
        ))}
      </div>

      {err ? (
        <Empty>Couldn&apos;t load your sales. Tap the refresh button to try again.</Empty>
      ) : loading && !data ? (
        <div className="grid h-40 place-items-center text-[13px] text-ink-subtle">
          Loading your sales…
        </div>
      ) : !data ? null : (
        <div className="space-y-5">
          {/* Hero — total sales for the chosen period */}
          <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand-tint/60 to-surface-1 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-deep">
                {methodLabel ? `${methodLabel} sales` : "Total sales"}
              </p>
              <span className="text-[11px] font-medium text-ink-muted">{rangeLabel(rangeKey)}</span>
            </div>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {peso(data.kpis.revenue_cents)}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">
              {num(data.kpis.orders)} {data.kpis.orders === 1 ? "order" : "orders"}
              <span className="mx-1.5 text-ink-subtle">·</span>
              {peso(data.kpis.avg_ticket_cents)} average sale
            </p>
            {methodLabel && (
              <button
                onClick={() => setMethod(null)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-1 px-3 py-1 text-[12px] font-semibold text-ink-muted shadow-card transition hover:text-ink"
              >
                Showing {methodLabel} only <X size={13} /> clear
              </button>
            )}
          </div>

          {/* How customers paid — the bars ARE the filter (tap to focus one) */}
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <CreditCard size={14} className="text-brand-deep" /> How customers paid
            </p>
            <p className="mb-2.5 text-[12px] text-ink-subtle">
              Tap a payment type to see only those sales.
            </p>
            {data.payment_mix.length === 0 ? (
              <Empty>No payments recorded in this period.</Empty>
            ) : (
              <div className="space-y-2.5">
                {data.payment_mix.map((p) => {
                  const pct = (p.amount / payTotal) * 100;
                  const on = method === p.method;
                  return (
                    <button
                      key={p.method}
                      onClick={() => setMethod(on ? null : p.method)}
                      className={`w-full rounded-xl px-2 py-1.5 text-left transition ${
                        on ? "bg-brand-tint/50 ring-1 ring-brand/30" : "hover:bg-surface-2"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 font-medium text-ink">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: toneFor(p.method) }}
                          />
                          {PAYMENT_LABELS[p.method] ?? p.method}
                        </span>
                        <span className="text-ink-muted">
                          {peso(p.amount)}
                          <span className="ml-1.5 text-ink-subtle">{pct.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: toneFor(p.method) }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Regular vs Separated — only when this store separates sales */}
          {hasSeparated && (
            <div className="grid grid-cols-2 gap-2">
              <TabCard
                active={activeTab === "regular"}
                onClick={() => setTab("regular")}
                icon={Layers}
                label="Regular sales"
                value={peso(data.split.general_cents)}
              />
              <TabCard
                active={activeTab === "separated"}
                onClick={() => setTab("separated")}
                icon={Tag}
                label="Separated"
                value={peso(data.split.separated_cents)}
              />
            </div>
          )}

          {/* Sales by category (scoped to the active tab) */}
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink">
              {activeTab === "separated" ? "Separated sales by group" : "Sales by category"}
              {methodLabel ? (
                <span className="font-normal text-ink-muted"> · {methodLabel}</span>
              ) : null}
            </p>
            {cats.length === 0 ? (
              <Empty>
                {activeTab === "separated"
                  ? "No separated sales in this period. In the app, flag a category or product type as “Separate in sales reports” (e.g. consigned Books) and they’ll show here on their own."
                  : "No sales in this period yet. Try a wider range like “Last 7 days”."}
              </Empty>
            ) : (
              <div className="space-y-2.5">
                {cats.map((c) => {
                  const pct = (c.cents / catTotal) * 100;
                  return (
                    <div key={c.category}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="min-w-0 truncate font-medium text-ink">{c.category}</span>
                        <span className="shrink-0 text-ink-muted">
                          {peso(c.cents)}
                          <span className="ml-1.5 text-ink-subtle">{num(c.qty)} sold</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Best sellers */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <Award size={14} className="text-brand-deep" /> Best sellers
            </p>
            {data.top_sellers.length === 0 ? (
              <Empty>No sales in this period yet.</Empty>
            ) : (
              <ol className="space-y-2.5">
                {data.top_sellers.map((s, i) => (
                  <li key={s.name} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-tint text-[11px] font-bold text-brand-deep">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                      {s.name}
                    </span>
                    <span className="text-[12px] text-ink-muted">{num(s.qty)} sold</span>
                    <span className="w-16 text-right text-[12px] font-semibold text-ink">
                      {pesoCompact(s.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Daily sales */}
          {data.daily.length > 1 && (
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Daily sales</p>
              <Bars data={data.daily} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-hairline bg-surface-1 text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function TabCard({
  active,
  onClick,
  icon: Icon,
  label,
  value,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? "border-brand bg-brand-tint/40 ring-1 ring-brand/30"
          : "border-hairline bg-surface-1 hover:bg-surface-2"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        <Icon size={13} /> {label}
      </span>
      <p className="mt-1 text-base font-semibold tracking-tight text-ink">{value}</p>
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[12px] leading-relaxed text-ink-subtle">
      {children}
    </div>
  );
}
