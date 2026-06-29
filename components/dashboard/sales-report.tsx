"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ReceiptText,
  TrendingUp,
  CreditCard,
  Layers,
  Tag,
  RefreshCw,
} from "lucide-react";
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
  const [tab, setTab] = useState<"general" | "separated">("general");
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

  const cats = (data?.by_category ?? []).filter(
    (c) => c.separated === (tab === "separated"),
  );
  const catTotal = cats.reduce((a, c) => a + c.cents, 0) || 1;
  const payTotal = (data?.payment_mix ?? []).reduce((a, p) => a + p.amount, 0) || 1;
  const tabRevenue =
    tab === "separated" ? data?.split.separated_cents ?? 0 : data?.split.general_cents ?? 0;
  const tabQty =
    tab === "separated" ? data?.split.separated_qty ?? 0 : data?.split.general_qty ?? 0;

  return (
    <section className="rounded-2xl border border-hairline bg-surface-1 p-5 shadow-card">
      {/* Heading + refresh */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-deep">
          <TrendingUp size={16} /> Sales report
        </h2>
        <button
          onClick={load}
          className="grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface-1 text-ink-muted transition hover:text-ink"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Date range chips */}
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {RANGES.map((r) => (
          <Chip key={r.key} active={rangeKey === r.key} onClick={() => setRangeKey(r.key)}>
            {r.label}
          </Chip>
        ))}
      </div>

      {/* General / Separated tabs */}
      <div className="mb-3 flex gap-1.5">
        <Chip active={tab === "general"} onClick={() => setTab("general")}>
          <Layers size={13} className="mr-1 inline" /> General
        </Chip>
        <Chip active={tab === "separated"} onClick={() => setTab("separated")}>
          <Tag size={13} className="mr-1 inline" /> Separated
        </Chip>
      </div>

      {/* Payment-method filter chips */}
      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <Chip active={method === null} onClick={() => setMethod(null)}>
          All payments
        </Chip>
        {(data?.payment_mix ?? []).map((p) => (
          <Chip key={p.method} active={method === p.method} onClick={() => setMethod(p.method)}>
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
              style={{ backgroundColor: toneFor(p.method) }}
            />
            {PAYMENT_LABELS[p.method] ?? p.method}
          </Chip>
        ))}
      </div>

      {err ? (
        <Empty>Couldn&apos;t load sales. Tap refresh to try again.</Empty>
      ) : loading && !data ? (
        <div className="grid h-32 place-items-center text-[13px] text-ink-subtle">
          Loading…
        </div>
      ) : !data ? null : (
        <div className="space-y-4">
          {/* Headline KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <Stat
              accent
              label={method ? `${PAYMENT_LABELS[method] ?? method} sales` : "Total sales"}
              value={peso(data.kpis.revenue_cents)}
              sub={`${num(data.kpis.orders)} orders`}
              icon={Wallet}
            />
            <Stat
              label="Avg ticket"
              value={peso(data.kpis.avg_ticket_cents)}
              sub="paid orders"
              icon={ReceiptText}
            />
            <Stat
              label={tab === "separated" ? "Separated" : "General"}
              value={peso(tabRevenue)}
              sub={`${num(tabQty)} items`}
              icon={tab === "separated" ? Tag : Layers}
            />
          </div>

          {/* General vs Separated split bar */}
          <div className="rounded-xl border border-hairline bg-surface-2 p-3">
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-ink-muted">General vs Separated</span>
              <span className="text-ink-subtle">line revenue</span>
            </div>
            <SplitBar general={data.split.general_cents} separated={data.split.separated_cents} />
          </div>

          {/* By payment method */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <CreditCard size={13} /> By payment method
            </p>
            {data.payment_mix.length === 0 ? (
              <Empty>No payments in range.</Empty>
            ) : (
              <div className="space-y-2.5">
                {data.payment_mix.map((p) => {
                  const pct = (p.amount / payTotal) * 100;
                  return (
                    <button
                      key={p.method}
                      onClick={() => setMethod(method === p.method ? null : p.method)}
                      className={`w-full rounded-lg px-1 py-1 text-left transition ${
                        method === p.method ? "bg-brand-tint/40" : "hover:bg-surface-2"
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
                          {peso(p.amount)} · {num(p.count)} tx · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
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

          {/* Revenue by category (scoped to the active tab) */}
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              {tab === "separated" ? "Separated revenue by group" : "Revenue by category"}
              {method ? ` · ${PAYMENT_LABELS[method] ?? method}` : ""}
            </p>
            {cats.length === 0 ? (
              <Empty>
                {tab === "separated"
                  ? "No separated sales in this range. Flag a Category or Product Type as “Separate in Sales reports” in the app."
                  : "No sales in this range yet."}
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
                          {peso(c.cents)} · {num(c.qty)} sold
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top sellers */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <Tag size={13} /> Top sellers
            </p>
            {data.top_sellers.length === 0 ? (
              <Empty>No sales in range.</Empty>
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

          {/* Daily trend */}
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              Daily revenue
            </p>
            <Bars data={data.daily} />
          </div>
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
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-hairline bg-surface-1 text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 shadow-card ${
        accent
          ? "border-brand/30 bg-gradient-to-br from-brand-tint/60 to-surface-1"
          : "border-hairline bg-surface-1"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        <Icon size={14} className="text-brand-deep" />
      </div>
      <p className="mt-1 text-base font-semibold tracking-tight text-ink sm:text-lg">{value}</p>
      {sub && <p className="text-[11px] text-ink-subtle">{sub}</p>}
    </div>
  );
}

function SplitBar({ general, separated }: { general: number; separated: number }) {
  const total = general + separated || 1;
  const gPct = (general / total) * 100;
  const sPct = (separated / total) * 100;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full bg-brand" style={{ width: `${gPct}%` }} />
        <div className="h-full bg-brand-deep" style={{ width: `${sPct}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand" /> General {peso(general)}
        </span>
        <span className="flex items-center gap-1.5">
          Separated {peso(separated)} <span className="h-2 w-2 rounded-full bg-brand-deep" />
        </span>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[12px] text-ink-subtle">
      {children}
    </div>
  );
}
