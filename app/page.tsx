import { Header, Footer } from "@/components/site";
import { PosMockup } from "@/components/mockup";
import {
  SellCustomizeMockup,
  InventoryMockup,
  PayrollMockup,
  EmployeesMockup,
  DashboardMockup,
} from "@/components/mockups";
import {
  Zap,
  ReceiptText,
  BadgePercent,
  Boxes,
  Clock,
  Wallet,
  KeyRound,
  Banknote,
  BarChart3,
  Printer,
  SlidersHorizontal,
  Building2,
  Check,
  type LucideIcon,
} from "lucide-react";

type Feature = { title: string; desc: string; icon: LucideIcon };

const features: Feature[] = [
  { title: "Lightning-fast checkout", desc: "Tap to ring up items, add sizes & extras, hold and resume orders. Built for a busy counter.", icon: Zap },
  { title: "BIR-ready receipts", desc: "Sales Invoice format, VAT breakdown, sequential numbering, Z-readings and e-Journal — handled.", icon: ReceiptText },
  { title: "Senior & PWD discounts", desc: "20% discount with VAT exemption, applied correctly and logged for your records — every time.", icon: BadgePercent },
  { title: "Inventory & stock", desc: "Track stock levels, restock, and run stock-takes so you always know what's on hand.", icon: Boxes },
  { title: "Shifts & Z-readings", desc: "Open and close cashier shifts with a cash count and over/short — clean, accountable handovers.", icon: Clock },
  { title: "Flexible payments", desc: "Accept cash, GCash, QR Ph, and bank transfer. Record references straight into your books.", icon: Wallet },
  { title: "Staff roles & PINs", desc: "Give each cashier a secure PIN and the right permissions. Owners stay fully in control.", icon: KeyRound },
  { title: "Payroll & timekeeping", desc: "Philippine-ready payroll with rates, leaves, and payslips — pay your team without spreadsheets.", icon: Banknote },
  { title: "Dashboard & reports", desc: "Daily sales, best-selling items, and average ticket at a glance — from any device.", icon: BarChart3 },
  { title: "Bluetooth printing", desc: "Pair a thermal printer for receipts and Z-readings, or pop the cash drawer — instantly.", icon: Printer },
  { title: "Modifiers & add-ons", desc: "Sizes, milk choices, espresso shots and more — priced automatically per item.", icon: SlidersHorizontal },
  { title: "Multiple branches", desc: "Run several locations from one account, each with its own staff, stock, and reports.", icon: Building2 },
];

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="hero-glow overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-4 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-surface-1/80 px-3.5 py-1.5 text-xs font-medium text-brand-deep shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Made for Philippine cafés &amp; retail
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-[40px] font-semibold leading-[1.05] tracking-tight text-ink md:text-[64px]">
            The point-of-sale your
            <br className="hidden md:block" /> café actually enjoys.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
            Prestige POS runs the whole counter on your iPad — selling, inventory,
            shifts, payroll, and BIR-compliant receipts — in one clean, fast app.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%20—%20Get%20started"
              className="rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep"
            >
              Get started
            </a>
            <a
              href="#features"
              className="rounded-full border border-hairline bg-surface-1 px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-surface-3"
            >
              See features
            </a>
          </div>
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-ink-subtle">
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-brand" /> iPad &amp; tablet ready</span>
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-brand" /> Cash, GCash &amp; QR Ph</span>
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-brand" /> No long contracts</span>
          </p>
        </div>

        {/* product mockup */}
        <div className="mx-auto mt-12 max-w-4xl px-5 pb-20">
          <PosMockup />
        </div>
      </section>

      {/* Compliance band */}
      <section id="philippines" className="border-y border-hairline bg-surface-1">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-12 sm:grid-cols-3">
          {[
            { k: "BIR-compliant", v: "Sales Invoice format, VAT, Z-readings & e-Journal — built in." },
            { k: "Senior / PWD", v: "Correct 20% discount with VAT exemption, logged automatically." },
            { k: "GCash & QR Ph", v: "Take the payments your customers already use, with references." },
          ].map((x) => (
            <div key={x.k} className="rounded-xl2 border border-hairline bg-surface-2 p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
                  <Check size={15} />
                </span>
                <p className="text-sm font-semibold text-brand-deep">{x.k}</p>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{x.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase — deep dives with real-looking UI */}
      <section id="showcase" className="mx-auto max-w-6xl space-y-20 px-5 py-20 md:space-y-28">
        {[
          {
            tag: "Make it yours",
            title: "Customize your Sell screen",
            body: "Arrange your menu exactly how your staff think. Drag to reorder, group items by type, and add or hide products in seconds — no developer, no waiting.",
            points: ["Drag-and-drop reorder", "Group by type & sub-type", "Add or hide items instantly"],
            mockup: <SellCustomizeMockup />,
          },
          {
            tag: "Always accurate",
            title: "Inventory that updates itself",
            body: "Stock auto-deducts on every sale. Spot low and out-of-stock items at a glance, set reorder thresholds, and always know your live stock value.",
            points: ["Auto-deducts on each sale", "Low / out-of-stock alerts", "Reorder thresholds & stock value"],
            mockup: <InventoryMockup />,
          },
          {
            tag: "No spreadsheets",
            title: "Run payroll in minutes",
            body: "Timesheets, rates, bonuses and deductions roll into a clean pay run. See net payable per employee — and for the whole team — then mark it paid.",
            points: ["Hourly, daily & salaried", "Bonuses & deductions", "Net payable, ready to pay"],
            mockup: <PayrollMockup />,
          },
          {
            tag: "Full control",
            title: "Manage your whole team",
            body: "Roles, PINs, schedules and pay in one place. Give each cashier exactly the access they need while owners stay firmly in control.",
            points: ["Secure per-cashier PINs", "Owner, Manager, Cashier roles", "Schedules & pay on file"],
            mockup: <EmployeesMockup />,
          },
          {
            tag: "Know your numbers",
            title: "Your day, at a glance",
            body: "Today's revenue, orders, average ticket and top sellers — live on your dashboard from any device, so you always know how the store is doing.",
            points: ["Live revenue & orders", "Average ticket", "Top sellers today"],
            mockup: <DashboardMockup />,
          },
        ].map((row, i) => (
          <div
            key={row.title}
            className={`flex flex-col items-center gap-10 md:gap-14 ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
          >
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-deep">{row.tag}</span>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{row.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{row.body}</p>
              <ul className="mt-5 space-y-2.5">
                {row.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2.5 text-sm text-ink">
                    <Check size={16} className="shrink-0 text-brand" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full flex-1">{row.mockup}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-[40px]">
            Everything the counter needs
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            One app for selling, stock, staff, and the books — so you focus on your
            customers, not your software.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="group rounded-xl2 border border-hairline bg-surface-1 p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-soft"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-tint text-brand-deep transition group-hover:bg-brand group-hover:text-white">
                <Icon size={21} strokeWidth={1.9} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-brand-deep px-8 py-16 text-center text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand/30 blur-2xl" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-[40px]">
            Ready to run your store on Prestige POS?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-brand-soft">
            Tell us about your business and we'll get you set up — most cafés are
            selling on day one.
          </p>
          <a
            href="mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%20—%20Get%20started"
            className="relative mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-deep transition hover:bg-brand-tint"
          >
            Get started
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
