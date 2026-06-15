"use client";

import { useMemo, useState } from "react";
import { Search, Wallet, Store, AlertTriangle } from "lucide-react";
import type { TenantOverview } from "@/lib/data/types";
import { peso, num } from "@/lib/format";
import { Kpi } from "./bits";
import { StoreCard } from "./store-card";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const isQuiet = (o: TenantOverview) =>
  !o.last_order_at || Date.now() - new Date(o.last_order_at).getTime() > WEEK;

type Filter = "all" | "open" | "quiet" | "trialing" | "past_due" | "paused";
type Sort = "revenue" | "recent" | "name";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open today" },
  { key: "quiet", label: "Quiet 7d" },
  { key: "trialing", label: "Trialing" },
  { key: "past_due", label: "Past due" },
  { key: "paused", label: "Paused" },
];

export function AdminClientList({ overviews }: { overviews: TenantOverview[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("revenue");

  const mrr = useMemo(
    () =>
      overviews
        .filter((o) => o.status === "active")
        .reduce((a, o) => a + (o.billing_cycle === "yearly" ? o.price_cents / 12 : o.price_cents), 0),
    [overviews],
  );
  const activeCount = overviews.filter((o) => o.status === "active").length;
  const atRisk = overviews.filter(
    (o) => o.status === "past_due" || o.status === "paused" || isQuiet(o),
  ).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = overviews.filter((o) => {
      if (q && !o.business_name.toLowerCase().includes(q)) return false;
      switch (filter) {
        case "open": return o.open_shift_today;
        case "quiet": return isQuiet(o);
        case "trialing": return o.status === "trialing";
        case "past_due": return o.status === "past_due";
        case "paused": return o.status === "paused";
        default: return true;
      }
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.business_name.localeCompare(b.business_name);
      if (sort === "recent")
        return (b.last_order_at ? +new Date(b.last_order_at) : 0) - (a.last_order_at ? +new Date(a.last_order_at) : 0);
      return b.gross_cents - a.gross_cents;
    });
    return list;
  }, [overviews, query, filter, sort]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi accent label="MRR" value={peso(mrr)} sub="active plans" icon={Wallet} />
        <Kpi label="Active" value={`${activeCount}/${overviews.length}`} sub="paying" icon={Store} />
        <Kpi label="At risk" value={num(atRisk)} sub="past-due / quiet" icon={AlertTriangle} />
        <Kpi label="Open now" value={`${overviews.filter((o) => o.open_shift_today).length}`} sub="selling today" icon={Store} />
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-hairline bg-surface-1 px-3 focus-within:border-brand">
          <Search size={15} className="text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores…"
            className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl border border-hairline bg-surface-1 px-3 py-2.5 text-[13px] font-medium text-ink outline-none"
        >
          <option value="revenue">Top revenue</option>
          <option value="recent">Recent activity</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
              filter === f.key
                ? "bg-brand text-white"
                : "border border-hairline bg-surface-1 text-ink-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-subtle">No stores match.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <StoreCard key={t.tenant_id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
