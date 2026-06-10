// A stylised recreation of the Prestige POS Sell screen, used as the hero
// visual so the site shows the product without needing real screenshots.
// Layout and icons mirror the real app (lib/features/sell): type boxes,
// category rail, search + customize pills, product cards, and the order panel.

import { MIcon } from "./micon";

const products = [
  { i: "coffee", n: "Americano", p: 100, custom: true },
  { i: "local_cafe", n: "Latte", p: 110 },
  { i: "coffee_maker", n: "Spanish Latte", p: 110 },
  { i: "emoji_food_beverage", n: "Mocha", p: 110 },
  { i: "eco", n: "Matcha", p: 200 },
  { i: "bakery_dining", n: "Croissant", p: 90 },
  { i: "cake", n: "Muffin", p: 85 },
  { i: "cookie", n: "Cheesecake", p: 150 },
];

const cart = [
  { n: "Spanish Latte", q: 1, p: 110, sub: "Large · Iced" },
  { n: "Croissant", q: 2, p: 90, sub: "" },
  { n: "Matcha", q: 1, p: 200, sub: "Large" },
];

const peso = (n: number) => "₱" + n.toLocaleString("en-PH");

export function PosMockup() {
  const subtotal = cart.reduce((a, c) => a + c.q * c.p, 0);
  const vat = Math.round((subtotal / 1.12) * 0.12);
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-hairline bg-surface-1 shadow-[0_30px_80px_-20px_rgba(142,110,73,0.35)] ring-1 ring-black/5">
      {/* top bar — store, shift numbers, branch + printer */}
      <div className="flex items-center justify-between border-b border-hairline bg-surface-1 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white text-xs font-bold">A</span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-ink">Aurora Café</p>
            <p className="text-[10px] text-ink-subtle">Thursday · 2:14 PM</p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-brand-soft bg-brand-tint px-3 py-1 text-[10px] font-medium text-brand-deep sm:flex">
          <span>Float ₱2,000</span>
          <span className="text-brand-soft">·</span>
          <span>Sales ₱8,450</span>
          <span className="text-brand-soft">·</span>
          <span>Orders 32</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-[10px] font-medium text-ink-muted">Main Branch</span>
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Printer
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6">
        {/* left rail — categories, like the app's Sell page */}
        <div className="hidden flex-col gap-2 border-r border-hairline bg-surface-1 p-3 md:flex">
          <div className="flex items-center gap-1.5 rounded-lg bg-brand/90 px-2.5 py-1.5 text-white">
            <MIcon name="grid_view" size={13} />
            <span className="text-[10px] font-semibold">All</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-ink-muted">
            <MIcon name="coffee" size={13} />
            <span className="text-[10px] font-medium">Coffee</span>
          </div>
        </div>

        {/* type boxes + search/customize — one row above the grid, like the app */}
        <div className="bg-surface-2 p-4 md:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl bg-brand text-white shadow-card">
                <MIcon name="local_cafe" size={16} />
                <span className="text-[9px] font-semibold">Drink</span>
              </div>
              <div className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-hairline bg-surface-1 text-ink-muted">
                <MIcon name="sell" size={16} />
                <span className="text-[9px] font-medium">Item</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-hairline bg-surface-1 text-brand-deep">
                <MIcon name="search" size={16} />
                <span className="text-[9px] font-medium">Search</span>
              </div>
              <div className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-hairline bg-surface-1 text-brand-deep">
                <MIcon name="tune" size={16} />
                <span className="text-[9px] font-medium">Customize</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-3">
            {products.map((it) => (
              <div
                key={it.n}
                className="flex flex-col rounded-xl border border-hairline bg-surface-1 p-2.5"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-tint text-brand-deep">
                  <MIcon name={it.i} size={17} />
                </div>
                <p className="mt-2 truncate text-[11px] font-medium text-ink">{it.n}</p>
                {it.custom ? (
                  <p className="flex items-center gap-1 text-[10px] font-semibold text-brand-deep">
                    Custom price <MIcon name="edit" size={10} />
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-brand-deep">{peso(it.p)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* order panel — mirrors the app's Current Order pane */}
        <div className="flex flex-col border-t border-hairline bg-surface-1 p-4 md:col-span-2 md:border-l md:border-t-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-ink">Current Order</p>
              <p className="text-[9px] text-ink-subtle">3 items</p>
            </div>
            <span className="rounded-full border border-hairline px-2.5 py-1 text-[9px] font-medium text-ink-muted">
              Hold / Clear
            </span>
          </div>
          <div className="mt-3 flex-1 space-y-3">
            {cart.map((c) => (
              <div key={c.n} className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand text-[10px] font-bold text-white">
                    {c.q}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-ink">{c.n}</p>
                    {c.sub && <p className="truncate text-[9px] text-ink-subtle">{c.sub}</p>}
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-ink">{peso(c.q * c.p)}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1 border-t border-hairline pt-3 text-[10px] text-ink-muted">
            <div className="flex justify-between"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
            <div className="flex justify-between"><span>VAT (12%)</span><span>{peso(vat)}</span></div>
            <div className="flex justify-between pt-1 text-[13px] font-bold text-ink">
              <span>Total</span><span>{peso(subtotal)}</span>
            </div>
          </div>
          <button className="mt-3 w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white shadow-card">
            Pay {peso(subtotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
