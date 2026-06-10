import { Header, Footer } from "@/components/site";
import { PosMockup } from "@/components/mockup";
import { PlanFinder } from "@/components/plan-finder";
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
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

type Feature = { title: string; desc: string; icon: LucideIcon };

const features: Feature[] = [
  { title: "Lightning-fast checkout", desc: "Tap, customize, charge. Built for the rush.", icon: Zap },
  { title: "Clean, printed receipts", desc: "VAT breakdown and instant thermal printing.", icon: ReceiptText },
  { title: "Senior & PWD discounts", desc: "The 20% discount, applied right every time.", icon: BadgePercent },
  { title: "Inventory & stock", desc: "Always know what's on hand.", icon: Boxes },
  { title: "Shifts & cash counts", desc: "Clean, accountable cashier handovers.", icon: Clock },
  { title: "Flexible payments", desc: "Cash, GCash, QR Ph, and bank transfer.", icon: Wallet },
  { title: "Staff roles & PINs", desc: "The right access for every cashier.", icon: KeyRound },
  { title: "Payroll & timekeeping", desc: "Rates, leaves, and payslips. No spreadsheets.", icon: Banknote },
  { title: "Dashboard & reports", desc: "Sales, best sellers, and average ticket, live.", icon: BarChart3 },
  { title: "Bluetooth printing", desc: "Receipts, summaries, and the cash drawer.", icon: Printer },
  { title: "Modifiers & add-ons", desc: "Sizes, shots, and extras, priced automatically.", icon: SlidersHorizontal },
  { title: "Multiple branches", desc: "Every location in one account.", icon: Building2 },
];

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="hero-glow relative overflow-hidden">
        {/* soft depth blobs */}
        <div className="pointer-events-none absolute -left-20 top-24 h-56 w-56 rounded-full bg-brand/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-48 h-64 w-64 rounded-full bg-brand-soft/40 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 pb-4 pt-12 text-center md:pt-24">
          <span className="rise inline-flex items-center gap-2 rounded-full border border-brand-soft bg-surface-1/80 px-3.5 py-1.5 text-xs font-medium text-brand-deep shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            Made for Philippine cafés &amp; retail
          </span>
          <h1 className="rise rise-1 mx-auto mt-4 max-w-3xl text-[34px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[44px] md:mt-6 md:text-[68px] md:leading-[1.05]">
            Sell more. Stress less.
            <br />
            <span className="bg-gradient-to-r from-brand-deep via-brand to-brand-deep bg-clip-text text-transparent">
              Grow faster.
            </span>
          </h1>
          <p className="rise rise-2 mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted md:mt-5 md:text-lg">
            The POS that rings up sales in seconds, never lets you run out of
            stock, and pays your team on time. Available on iOS and Android.
          </p>
          <div className="rise rise-3 mt-5 flex flex-row flex-wrap items-center justify-center gap-2.5 md:mt-8 md:gap-3">
            <a
              href="#pricing"
              className="cta-pulse group inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-brand-deep md:px-7 md:py-3.5 md:text-sm"
            >
              Start free trial
              <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
            </a>
            <a
              href="#fit"
              className="rounded-full border border-hairline bg-surface-1 px-5 py-3 text-[13px] font-semibold text-ink transition hover:bg-surface-3 md:px-7 md:py-3.5 md:text-sm"
            >
              Which plan fits me?
            </a>
          </div>
          <p className="rise rise-3 mt-3 text-[11px] text-ink-subtle md:text-xs">
            Free for 14 days. No card needed. Cancel anytime.
          </p>
        </div>

        {/* product mockup with a warm glow. Phones get the FULL desktop
            two-pane layout rendered at 760px and scaled down whole, so the
            hero shows the real composition without the height cost. */}
        <div className="rise rise-4 relative mx-auto mt-8 max-w-4xl px-5 pb-12 md:mt-12 md:pb-20">
          <div className="pointer-events-none absolute inset-x-10 top-6 -z-0 h-3/4 rounded-full bg-brand/25 blur-3xl" />
          <div className="relative hidden sm:block">
            <PosMockup />
          </div>
          <div className="relative sm:hidden">
            <div className="h-[215px] overflow-hidden">
              <div className="w-[760px] origin-top-left scale-[0.46]">
                <PosMockup full />
              </div>
            </div>
          </div>
          <p className="relative mx-auto mt-4 max-w-[280px] text-center text-[11px] text-ink-subtle md:max-w-none md:text-xs">
            That&apos;s the real Sell screen, exactly what your cashier sees.{" "}
            <a href="#showcase" className="font-semibold text-brand-deep underline underline-offset-2">
              See it in action
            </a>
          </p>
        </div>
      </section>

      {/* Compliance band */}
      <section id="philippines" className="border-y border-hairline bg-surface-1">
        <div className="mx-auto grid max-w-6xl gap-2.5 px-5 py-8 sm:grid-cols-3 sm:gap-5 sm:py-12">
          {[
            { k: "Made for PH stores", v: "Peso-first pricing, VAT breakdown, and the way counters here actually run." },
            { k: "Senior / PWD", v: "Correct 20% discount with VAT exemption, logged automatically." },
            { k: "GCash & QR Ph", v: "Take the payments your customers already use, with references." },
          ].map((x) => (
            <div key={x.k} className="flex items-start gap-3 rounded-xl2 border border-hairline bg-surface-2 p-4 sm:p-6">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-white">
                <Check size={15} />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-deep">{x.k}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted sm:text-sm">{x.v}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase — deep dives with real-looking UI */}
      <section id="showcase" className="mx-auto max-w-6xl space-y-14 px-5 py-14 md:space-y-28 md:py-20">
        {[
          {
            tag: "Make it yours",
            title: "Customize your Sell screen",
            body: "Arrange your menu exactly how your staff think. Drag to reorder, group items by type, and add or hide products in seconds. No developer needed.",
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
            body: "Timesheets, rates, bonuses and deductions roll into a clean pay run. See what each employee takes home and the total for the team, then mark it paid.",
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
            body: "Today's revenue, orders, average ticket and top sellers, live on your dashboard from any device. You always know how the store is doing.",
            points: ["Live revenue & orders", "Average ticket", "Top sellers today"],
            mockup: <DashboardMockup />,
          },
        ].map((row, i) => (
          <div
            key={row.title}
            className={`flex flex-col items-center gap-8 md:gap-14 ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
          >
            <div className="flex-1">
              <span className="inline-flex rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-deep">
                {row.tag}
              </span>
              <h3 className="mt-2.5 text-[22px] font-semibold leading-snug tracking-tight text-ink md:text-3xl">{row.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted md:mt-3 md:text-[15px]">{row.body}</p>
              <ul className="mt-4 space-y-2 md:mt-5 md:space-y-2.5">
                {row.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2.5 text-[13px] text-ink md:text-sm">
                    <Check size={15} className="shrink-0 text-brand" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            {/* keep mobile short: only the first 2 deep-dives show their
                mockup on phones; the rest rely on the copy + checkmarks */}
            <div className={`w-full flex-1 ${i >= 2 ? "hidden md:block" : ""}`}>{row.mockup}</div>
          </div>
        ))}
        <p className="text-center text-[15px] text-ink-muted">
          And that&apos;s just the start.{" "}
          <a href="#features" className="font-semibold text-brand-deep underline underline-offset-2">
            See everything included
          </a>
        </p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-brand-tint px-3.5 py-1.5 text-xs font-semibold text-brand-deep">
            Built for modern Philippine businesses
          </span>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-ink md:text-[40px]">
            Everything your business needs.
            <br />
            <span className="bg-gradient-to-r from-brand-deep via-brand to-brand-deep bg-clip-text text-transparent">
              In one powerful POS.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted md:text-lg">
            Sales, inventory, staff, and analytics in one beautifully simple
            app. Run it from anywhere. See it in real time. Decide with
            confidence.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Sell faster", items: [0, 10, 5] },
            { label: "Every sale covered", items: [1, 2, 9] },
            { label: "Run the back office", items: [3, 4, 7] },
            { label: "Stay in control", items: [6, 8, 11] },
          ].map((group) => (
            <div
              key={group.label}
              className="rounded-xl2 border border-hairline bg-surface-1 p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-soft"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-brand-deep">{group.label}</p>
              <ul className="mt-5 space-y-3.5">
                {group.items.map((idx) => {
                  const { title, icon: Icon } = features[idx];
                  return (
                    <li key={title} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-deep">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <span className="text-sm font-medium leading-tight text-ink">{title}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-ink-muted">
          Everything included, no add-ons to buy.{" "}
          <span className="font-semibold text-brand-deep">
            Designed for Android and iPad. Built to help Philippine businesses
            grow.
          </span>
        </p>
      </section>

      {/* Plan finder — meet them where they are */}
      <section id="fit" className="border-t border-hairline bg-surface-1 px-5 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-[40px]">
              Which one is you?
            </h2>
            <p className="mt-4 text-lg text-ink-muted">
              99.6% of businesses in the Philippines are micro, small, or medium.
              Prestige was built for every single one. Tap your setup and see
              your fit.
            </p>
          </div>
          <div className="mt-10">
            <PlanFinder />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-hairline bg-surface-2 px-5 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-[40px]">
            Simple pricing that pays for itself
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Try everything free for 14 days, no card needed. Then pick the plan
            that fits your store. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
          {/* Basic */}
          <div className="flex flex-col rounded-[1.5rem] border border-hairline bg-surface-1 p-7 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Basic</p>
            <p className="mt-1 text-sm text-ink-muted">Good for starters and small businesses.</p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[44px] font-semibold leading-none tracking-tight text-ink">₱499</span>
              <span className="text-sm text-ink-muted">/month per branch</span>
            </div>
            <p className="mt-1.5 text-xs text-ink-subtle">about ₱17 a day</p>
            <span className="mt-2.5 inline-flex w-fit items-center rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              Yearly ₱4,990 · 2 months free
            </span>
            <ul className="mt-5 space-y-2.5 text-sm text-ink">
              {[
                "Up to 100 items sold per day",
                "Fast Sell screen for the cashier",
                "Sizes, add-ons & custom prices",
                "Search, void & refund orders",
                "Printed receipts (Bluetooth thermal)",
                "Cash, GCash & QR Ph payments",
                "Senior & PWD discounts",
                "1 branch · 2 staff PINs",
              ].map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                  {pt}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <a
                href="mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%3A%20Start%20Basic"
                className="block rounded-full border border-hairline bg-surface-1 px-6 py-3 text-center text-sm font-semibold text-ink transition hover:bg-surface-3"
              >
                Try Basic free
              </a>
              <p className="mt-2.5 text-center text-[11px] text-ink-subtle">
                14-day free trial · no card needed
              </p>
            </div>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-[1.5rem] border-2 border-brand bg-gradient-to-b from-brand-tint/70 via-surface-1 to-surface-1 p-7 shadow-[0_18px_50px_-18px_rgba(142,110,73,0.45)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-card">
              Most popular
            </span>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-deep">Pro</p>
            <p className="mt-1 text-sm text-ink-muted">For growing and busy businesses.</p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[44px] font-semibold leading-none tracking-tight text-ink">₱1,499</span>
              <span className="text-sm text-ink-muted">/month per branch</span>
            </div>
            <p className="mt-1.5 text-xs text-ink-subtle">
              about ₱49 a day. Less than one latte.
            </p>
            <span className="mt-2.5 inline-flex w-fit items-center rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              Yearly ₱14,990 · save ₱2,998
            </span>
            <p className="mt-2 text-[12px] font-medium text-brand-deep">
              Most stores earn this back before lunch.
            </p>
            <p className="mt-4 text-[13px] font-semibold text-ink">
              Everything in Basic, plus everything unlocked:
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink">
              {[
                "Unlimited daily sales",
                "Inventory that auto-deducts on every sale",
                "Recipes & ingredient tracking",
                "Low-stock alerts & stock value",
                "Shifts, cash counts & end-of-day reports",
                "Dashboard & sales reports",
                "Staff roles, PINs & schedules",
                "Payroll & timekeeping (PH-ready)",
                "Bookings & timed sessions",
                "Multiple branches, one account",
                "Unlimited staff · Priority support",
              ].map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                  {pt}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <a
                href="mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%3A%20Start%20Pro%20trial"
                className="block rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep"
              >
                Start 14-day free trial
              </a>
              <p className="mt-2.5 text-center text-[11px] text-ink-subtle">
                No card needed · Cancel anytime
              </p>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-sm font-medium text-ink-muted">
          Already powering real café counters across the Philippines.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed text-ink-subtle">
          Prices are per branch, VAT inclusive. Free updates and cloud backup on
          every plan. Upgrade, downgrade, or cancel anytime. Your data stays yours.
        </p>
      </section>

      {/* FAQ — answer the doubts right after they see the price */}
      <section id="faq" className="border-t border-hairline bg-surface-1 px-5 py-14 md:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-[40px]">
              Questions? We got you.
            </h2>
            <p className="mt-3 text-[15px] text-ink-muted md:text-lg">
              The things store owners ask us before they start.
            </p>
          </div>
          <div className="mt-10 space-y-3">
            {[
              {
                q: "What do I need to run Prestige POS?",
                a: "Any Android tablet or iPad and an internet connection. Add a Bluetooth thermal printer if you want printed receipts, we'll help you pair it.",
              },
              {
                q: "How does the free trial work?",
                a: "You get the full Pro experience for 14 days, no card needed. When the trial ends, pick Basic or Pro and keep selling. Nothing is charged automatically.",
              },
              {
                q: "How do I pay for my subscription?",
                a: "On our website, with GCash, card, or bank transfer. The app itself is login-only, so your staff never see billing.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Your service runs to the end of what you paid for, and your data stays yours. You can export it anytime.",
              },
              {
                q: "What if my internet is slow?",
                a: "Prestige is light on data, a phone hotspot is enough to keep the counter running.",
              },
              {
                q: "Do you help with setup?",
                a: "Yes. We help you load your menu, connect your printer, and train your cashier. Most stores are selling the same day.",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="group rounded-xl2 border border-hairline bg-surface-2 px-5 py-4 transition hover:border-brand-soft"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
                  {f.q}
                  <span className="shrink-0 text-lg font-medium text-brand-deep transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink-muted">
            Something else on your mind?{" "}
            <a
              href="mailto:hello@prestigeitsolutions.tech"
              className="font-semibold text-brand-deep underline underline-offset-2"
            >
              Email us
            </a>{" "}
            and a real person will reply.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-brand-deep px-6 py-12 text-center text-white md:px-8 md:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand/30 blur-2xl" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-[40px]">
            Set up tonight. Sell in the morning.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-brand-soft">
            Your menu loaded, your printer paired, your cashier ready. Most
            stores ring up their first sale on day one.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#pricing"
              className="inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-deep transition hover:bg-brand-tint"
            >
              Start free trial
            </a>
            <a
              href="mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%3A%20Question"
              className="inline-block rounded-full border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to us first
            </a>
          </div>
          <p className="relative mt-4 text-xs text-brand-soft">
            Free for 14 days. No card needed. Cancel anytime.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
