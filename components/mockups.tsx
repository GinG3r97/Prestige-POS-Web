// Faithful, stylised recreations of real Prestige POS screens. Labels,
// structure AND icons mirror lib/features/* in the app — the icons use
// Material Symbols, the same set Flutter's Icons.* draws from.
import { MIcon } from "./micon";

const peso = (n: number) => "₱" + n.toLocaleString("en-PH");

function Window({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-[0_24px_60px_-24px_rgba(142,110,73,0.4)] ring-1 ring-black/5">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          {sub && <p className="text-[10px] text-ink-subtle">{sub}</p>}
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-soft" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
        </div>
      </div>
      {children}
    </div>
  );
}

/* 1 — Sell screen, Customize mode (Icons.tune, Icons.add, drag) */
export function SellCustomizeMockup() {
  const tiles = [
    { e: "☕", n: "Americano", p: 100 },
    { e: "🥛", n: "Latte", p: 110 },
    { e: "🍵", n: "Matcha", p: 200 },
    { e: "🍫", n: "Mocha", p: 110 },
    { e: "🥐", n: "Croissant", p: 90 },
  ];
  return (
    <Window title="Sell · Customize" sub="Drag to reorder · tap to edit">
      <div className="flex items-center gap-2 border-b border-hairline bg-surface-2 px-4 py-2.5">
        {["Beverages", "Food", "Desserts"].map((t, i) => (
          <span key={t} className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${i === 0 ? "bg-brand text-white" : "bg-surface-1 text-ink-muted border border-hairline"}`}>{t}</span>
        ))}
        <span className="ml-auto flex items-center gap-1 rounded-lg bg-brand-tint px-2.5 py-1 text-[10px] font-semibold text-brand-deep">
          <MIcon name="tune" size={13} /> Customize
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 p-4">
        {tiles.map((it) => (
          <div key={it.n} className="relative rounded-xl border-2 border-dashed border-brand-soft bg-surface-1 p-2.5">
            <MIcon name="drag_indicator" size={15} className="absolute right-1 top-1.5 text-ink-subtle" />
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-tint text-base">{it.e}</div>
            <p className="mt-2 truncate text-[11px] font-medium text-ink">{it.n}</p>
            <p className="text-[11px] font-semibold text-brand-deep">{peso(it.p)}</p>
          </div>
        ))}
        <div className="grid place-items-center rounded-xl border-2 border-dashed border-hairline text-ink-subtle">
          <div className="text-center">
            <MIcon name="add" size={18} />
            <p className="mt-0.5 text-[9px] font-medium">Add product</p>
          </div>
        </div>
      </div>
    </Window>
  );
}

/* 2 — Inventory (Icons.inventory_2 / warning_amber / cancel / payments) */
export function InventoryMockup() {
  const rows = [
    { dot: "bg-green-500", n: "Arabica Coffee Beans", sku: "ABR001", meta: "Coffee & Tea · kg", stock: "45.5 kg", bar: "78%", barC: "bg-green-500", badge: "" },
    { dot: "bg-amber-500", n: "Espresso Shots", sku: "", meta: "Coffee & Tea · L", stock: "8.0 L", bar: "30%", barC: "bg-amber-500", badge: "LOW" },
    { dot: "bg-red-500", n: "Steamed Milk", sku: "", meta: "Coffee & Tea · L", stock: "0.0 L", bar: "3%", barC: "bg-red-500", badge: "OUT" },
    { dot: "bg-green-500", n: "Chocolate Syrup", sku: "CHO002", meta: "Syrups · ml", stock: "120 ml", bar: "65%", barC: "bg-green-500", badge: "" },
  ];
  const stats = [
    { l: "ITEMS", v: "24", c: "text-brand-deep", i: "inventory_2" },
    { l: "LOW STOCK", v: "3", c: "text-amber-600", i: "warning" },
    { l: "OUT", v: "1", c: "text-red-600", i: "cancel" },
    { l: "STOCK VALUE", v: "₱48,200", c: "text-brand-deep", i: "payments" },
  ];
  return (
    <Window title="Inventory" sub="24 items · auto-deducts on each sale">
      <div className="grid grid-cols-4 gap-2 px-4 pt-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-lg border border-hairline bg-surface-2 p-2">
            <MIcon name={s.i} size={15} className={s.c} />
            <p className="mt-1 text-[8px] font-semibold tracking-wide text-ink-subtle">{s.l}</p>
            <p className={`text-[13px] font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-hairline px-4 pb-3 pt-2">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center gap-2.5 py-2.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[11px] font-semibold text-ink">{r.n}</p>
                {r.sku && <span className="rounded bg-surface-3 px-1 text-[8px] font-mono text-ink-muted">{r.sku}</span>}
              </div>
              <p className="text-[9px] text-ink-subtle">{r.meta}</p>
            </div>
            <div className="w-24 shrink-0">
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-[11px] font-semibold text-ink">{r.stock}</p>
                {r.badge && <span className={`rounded px-1 text-[8px] font-bold text-white ${r.badge === "OUT" ? "bg-red-500" : "bg-amber-500"}`}>{r.badge}</span>}
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                <div className={`h-full ${r.barC}`} style={{ width: r.bar }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Window>
  );
}

/* 3 — Payroll run (Icons.person avatars, Icons.payments) */
export function PayrollMockup() {
  const slips = [
    { n: "Maria Gonzalez", role: "Manager", detail: "40h × ₱500/day", net: 20000 },
    { n: "John Smith", role: "Cashier", detail: "39.5h × ₱180/hr", net: 7110 },
    { n: "Sarah Johnson", role: "Inventory", detail: "Salaried · ₱25,000/mo", net: 25000 },
  ];
  const net = slips.reduce((a, s) => a + s.net, 0);
  return (
    <Window title="Pay run · Jun 2 – Jun 8" sub="Weekly · 3 employees">
      <div className="px-4 py-2">
        <span className="rounded-md bg-brand-tint px-2 py-0.5 text-[9px] font-bold text-brand-deep">DRAFT</span>
      </div>
      <div className="divide-y divide-hairline px-4">
        {slips.map((s) => (
          <div key={s.n} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-tint text-brand-deep">
                <MIcon name="person" size={18} />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-ink">{s.n}</p>
                <p className="text-[9px] text-ink-subtle">{s.role} · {s.detail}</p>
              </div>
            </div>
            <p className="text-[12px] font-bold text-brand-deep">{peso(s.net)}</p>
          </div>
        ))}
      </div>
      <div className="m-4 rounded-xl bg-brand-deep px-4 py-3 text-white">
        <div className="flex items-center justify-between text-[10px] text-brand-soft">
          <span>Gross</span><span>{peso(net)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wide text-brand-soft">NET PAYABLE</span>
          <span className="text-[18px] font-bold">{peso(net)}</span>
        </div>
      </div>
    </Window>
  );
}

/* 4 — Employees (Icons.search, Icons.person, Icons.add) */
export function EmployeesMockup() {
  const list = [
    { n: "Maria Gonzalez", role: "Manager", badge: "" },
    { n: "John Smith", role: "Cashier", badge: "" },
    { n: "Sarah Johnson", role: "Inventory Manager", badge: "LEAVE" },
    { n: "Carlos Mendez", role: "Cashier", badge: "" },
  ];
  return (
    <Window title="Employees" sub="4 active · 1 inactive">
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
          <MIcon name="search" size={13} className="text-ink-subtle" />
          <span className="text-[10px] text-ink-subtle">Search by name, role, PIN…</span>
        </div>
        <span className="flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-[10px] font-semibold text-white">
          <MIcon name="add" size={13} /> Add
        </span>
      </div>
      <div className="flex gap-1.5 px-4 pt-2">
        {["All", "Manager", "Cashier"].map((r, i) => (
          <span key={r} className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${i === 0 ? "bg-brand text-white" : "bg-surface-2 text-ink-muted border border-hairline"}`}>{r}</span>
        ))}
      </div>
      <div className="divide-y divide-hairline px-4 pb-3 pt-1">
        {list.map((e) => (
          <div key={e.n} className="flex items-center gap-2.5 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-tint text-brand-deep">
              <MIcon name="person" size={20} />
            </span>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-ink">{e.n}</p>
              <p className="text-[9px] text-ink-subtle">{e.role}</p>
            </div>
            {e.badge
              ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600">{e.badge}</span>
              : <span className="h-2 w-2 rounded-full bg-green-500" />}
          </div>
        ))}
      </div>
    </Window>
  );
}

/* 5 — Dashboard (Icons.payments / receipt_long / local_mall / local_cafe) */
export function DashboardMockup() {
  const kpis = [
    { l: "TODAY'S REVENUE", v: "₱12,450", up: "+18%", i: "payments" },
    { l: "ORDERS", v: "23", up: "+5%", i: "receipt_long" },
    { l: "ITEMS SOLD", v: "67", up: "", i: "local_mall" },
    { l: "AVG TICKET", v: "₱542", up: "", i: "local_cafe" },
  ];
  const top = [
    { n: "Iced Vanilla Latte", q: 23, w: "100%" },
    { n: "Cappuccino", q: 14, w: "62%" },
    { n: "Espresso Shots", q: 8, w: "36%" },
    { n: "Croissant", q: 5, w: "22%" },
  ];
  return (
    <Window title="Dashboard" sub="Here's how Aurora Café is doing today">
      <div className="grid grid-cols-4 gap-2 px-4 pt-4">
        {kpis.map((k) => (
          <div key={k.l} className="rounded-lg border border-hairline bg-surface-2 p-2">
            <MIcon name={k.i} size={15} className="text-brand-deep" />
            <p className="mt-1 text-[8px] font-semibold tracking-wide text-ink-subtle">{k.l}</p>
            <div className="flex items-center gap-0.5">
              <p className="text-[13px] font-bold text-ink">{k.v}</p>
              {k.up && (
                <span className="flex items-center text-[9px] font-semibold text-green-600">
                  <MIcon name="arrow_drop_up" size={14} />{k.up}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="text-[11px] font-semibold text-ink">Top sellers today</p>
        <div className="mt-2 space-y-2">
          {top.map((t) => (
            <div key={t.n} className="flex items-center gap-2">
              <p className="w-28 shrink-0 truncate text-[10px] text-ink-muted">{t.n}</p>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-brand" style={{ width: t.w }} />
              </div>
              <p className="w-5 shrink-0 text-right text-[10px] font-bold text-ink">{t.q}</p>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}
