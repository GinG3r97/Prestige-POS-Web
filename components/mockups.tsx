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

/* 1 — Sell screen, arrange mode (dashed borders, drag handles, + boxes, Done) */
export function SellCustomizeMockup() {
  const tiles = [
    { i: "coffee", n: "Americano", p: 100 },
    { i: "local_cafe", n: "Latte", p: 110 },
    { i: "eco", n: "Matcha", p: 200, drag: true },
    { i: "emoji_food_beverage", n: "Mocha", p: 110 },
    { i: "bakery_dining", n: "Croissant", p: 90 },
  ];
  return (
    <Window title="Sell · Arrange mode" sub="Hold & drag to reorder · tap to edit">
      {/* type squares — dashed in edit mode, with a + to add and Done to exit */}
      <div className="flex items-center gap-2 border-b border-hairline bg-surface-2 px-4 py-2.5">
        <span className="flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-brand bg-brand text-white shadow-card">
          <MIcon name="local_cafe" size={13} />
          <span className="text-[8px] font-semibold">Drink</span>
        </span>
        <span className="flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-brand-soft bg-surface-1 text-ink-muted">
          <MIcon name="sell" size={13} />
          <span className="text-[8px] font-medium">Item</span>
        </span>
        <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-dashed border-hairline text-ink-subtle">
          <MIcon name="add" size={15} />
        </span>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-brand px-3.5 py-1.5 text-[10px] font-semibold text-white shadow-card">
          <MIcon name="check" size={12} /> Done
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 p-4">
        {tiles.map((it) =>
          it.drag ? (
            /* tile caught mid-drag — lifted, tilted, brand ring */
            <div key={it.n} className="relative -rotate-2 scale-[1.04] rounded-xl border-2 border-brand bg-surface-1 p-2.5 shadow-[0_14px_30px_-10px_rgba(142,110,73,0.45)]">
              <MIcon name="drag_indicator" size={15} className="absolute right-1 top-1.5 text-brand" />
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-tint text-brand-deep">
                <MIcon name={it.i} size={17} />
              </div>
              <p className="mt-2 truncate text-[11px] font-medium text-ink">{it.n}</p>
              <p className="text-[11px] font-semibold text-brand-deep">{peso(it.p)}</p>
            </div>
          ) : (
            <div key={it.n} className="relative rounded-xl border-2 border-dashed border-brand-soft bg-surface-1 p-2.5">
              <MIcon name="drag_indicator" size={15} className="absolute right-1 top-1.5 text-ink-subtle" />
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-tint text-brand-deep">
                <MIcon name={it.i} size={17} />
              </div>
              <p className="mt-2 truncate text-[11px] font-medium text-ink">{it.n}</p>
              <p className="text-[11px] font-semibold text-brand-deep">{peso(it.p)}</p>
            </div>
          )
        )}
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
  return (
    <Window title="Inventory" sub="Auto-deducts on each sale">
      <div className="flex">
        {/* left rail — filters + categories, like the app */}
        <div className="hidden w-[108px] shrink-0 flex-col gap-1.5 border-r border-hairline p-2.5 sm:flex">
          {[
            { i: "inventory_2", l: "All items", n: "24", on: true },
            { i: "warning", l: "Low stock", n: "3", c: "text-amber-600" },
            { i: "cancel", l: "Out", n: "1", c: "text-red-600" },
          ].map((f) => (
            <span key={f.l} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] font-semibold ${f.on ? "bg-brand text-white" : `border border-hairline ${f.c ?? "text-ink-muted"}`}`}>
              <MIcon name={f.i} size={11} /> {f.l}
              <span className="ml-auto">{f.n}</span>
            </span>
          ))}
          <p className="mt-1 px-1 text-[7px] font-bold tracking-widest text-ink-subtle">CATEGORIES</p>
          <span className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1.5 text-[9px] font-medium text-ink-muted">
            <MIcon name="coffee" size={11} /> Coffee &amp; Tea
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1.5 text-[9px] font-medium text-ink-muted">
            <MIcon name="water_drop" size={11} /> Syrups
          </span>
        </div>
        {/* right pane — search + value pill + Add, then bordered item cards */}
        <div className="min-w-0 flex-1 p-3">
          <div className="mb-2.5 flex items-center gap-1.5">
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-2 py-1.5">
              <MIcon name="search" size={12} className="text-ink-subtle" />
              <span className="truncate text-[9px] text-ink-subtle">Search by name, SKU…</span>
            </div>
            <span className="flex items-center gap-1 rounded-lg bg-brand-tint px-2 py-1.5 text-[9px] font-bold text-brand-deep">
              <MIcon name="payments" size={12} /> ₱48,200
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-brand px-2 py-1.5 text-[9px] font-semibold text-white">
              <MIcon name="add" size={12} /> Add
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {rows.map((r) => (
              <div key={r.n} className="rounded-xl border border-hairline bg-surface-1 p-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
                  <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink">{r.n}</p>
                  {r.badge && <span className={`rounded px-1 text-[8px] font-bold text-white ${r.badge === "OUT" ? "bg-red-500" : "bg-amber-500"}`}>{r.badge}</span>}
                  <MIcon name="more_horiz" size={13} className="text-ink-subtle" />
                </div>
                <p className="mt-0.5 text-[9px] text-ink-subtle">{r.meta}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div className={`h-full ${r.barC}`} style={{ width: r.bar }} />
                  </div>
                  <p className="text-[10px] font-semibold text-ink">{r.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
      {/* header row — role dropdown + square search + Add, like the app */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-1 px-2.5 py-2 text-[10px] font-medium text-ink">
          All roles <MIcon name="arrow_drop_down" size={14} className="text-ink-subtle" />
        </span>
        <span className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-hairline bg-surface-2 text-brand-deep">
          <MIcon name="search" size={15} />
        </span>
        <span className="flex h-9 items-center gap-1 rounded-lg bg-brand px-3 text-[10px] font-semibold text-white">
          <MIcon name="add" size={13} /> Add
        </span>
      </div>
      {/* bordered staff cards — name | role on one line, status at right */}
      <div className="space-y-2 px-4 pb-4 pt-3">
        {list.map((e) => (
          <div key={e.n} className="flex items-center gap-2.5 rounded-xl border border-hairline bg-surface-1 px-3 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-tint text-brand-deep">
              <MIcon name="person" size={20} />
            </span>
            <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
              <p className="truncate text-[11px] font-semibold text-ink">{e.n}</p>
              <span className="text-[9px] text-ink-subtle">|</span>
              <p className="truncate text-[9px] font-medium text-brand-deep">{e.role}</p>
            </div>
            {e.badge
              ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600">{e.badge}</span>
              : <span className="flex items-center gap-1 text-[8px] font-semibold text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active</span>}
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
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-ink">Top sellers today</p>
          <span className="flex items-center gap-1 rounded-full border border-hairline px-2 py-0.5 text-[8px] font-semibold text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
          </span>
        </div>
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
