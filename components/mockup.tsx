// A stylised recreation of the Prestige POS sell screen — used as the hero
// visual so the site shows the product without needing real screenshots.

const products = [
  { e: "☕", n: "Americano", p: 100 },
  { e: "🥛", n: "Latte", p: 110 },
  { e: "🇪🇸", n: "Spanish Latte", p: 110 },
  { e: "🍫", n: "Mocha", p: 110 },
  { e: "🍵", n: "Matcha", p: 200 },
  { e: "🥐", n: "Croissant", p: 90 },
  { e: "🧁", n: "Muffin", p: 85 },
  { e: "🍰", n: "Cheesecake", p: 150 },
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
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-hairline bg-surface-1 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white text-xs font-bold">A</span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-ink">Aurora Café</p>
            <p className="text-[10px] text-ink-subtle">Thursday · 2:14 PM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-[10px] font-medium text-ink-muted">Main Branch</span>
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Printer
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5">
        {/* product grid */}
        <div className="col-span-3 grid grid-cols-3 gap-2.5 bg-surface-2 p-4">
          {products.map((it) => (
            <div
              key={it.n}
              className="flex flex-col rounded-xl border border-hairline bg-surface-1 p-2.5"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-tint text-base">
                {it.e}
              </div>
              <p className="mt-2 truncate text-[11px] font-medium text-ink">{it.n}</p>
              <p className="text-[11px] font-semibold text-brand-deep">{peso(it.p)}</p>
            </div>
          ))}
        </div>

        {/* order panel */}
        <div className="col-span-2 flex flex-col border-l border-hairline bg-surface-1 p-4">
          <p className="text-[12px] font-semibold text-ink">Current order</p>
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
            Charge {peso(subtotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
