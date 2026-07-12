import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, Mail, Infinity as InfinityIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Plans — Prestige POS",
  description:
    "Compare what's included in each Prestige POS plan: Trial, Basic, and Pro.",
  robots: { index: false }, // informational cul-de-sac, not a landing page
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: this page is opened from inside the iOS app ("Learn more" on the
// Subscription screen). App Store guideline 3.1.1 forbids steering users to an
// external purchase, so this page must stay a cul-de-sac:
//   • NO prices, NO currency symbols, NO free-trial/checkout/subscribe links
//   • NO header/footer nav that leads to /#pricing or /subscribe
//   • CTA is contact-only (mailto)
// Keep it that way when editing.
// ─────────────────────────────────────────────────────────────────────────────

// Caps mirror the live `plan_limits` table.
const tiers = [
  {
    name: "Trial",
    tag: "Try everything",
    desc: "A full-featured look at Prestige POS for a new store.",
    caps: {
      orders: "20 / day",
      staff: "2",
      products: "25",
      categories: "6",
      inventory: "15 items",
      branches: "1",
    },
    highlight: false,
  },
  {
    name: "Basic",
    tag: "For single stores",
    desc: "Everything a busy single-branch café or shop needs day to day.",
    caps: {
      orders: "100 / day",
      staff: "5",
      products: "100",
      categories: "15",
      inventory: "60 items",
      branches: "1",
    },
    highlight: false,
  },
  {
    name: "Pro",
    tag: "For growing businesses",
    desc: "No limits, multiple branches, and priority support.",
    caps: {
      orders: "Unlimited",
      staff: "Unlimited",
      products: "Unlimited",
      categories: "Unlimited",
      inventory: "Unlimited",
      branches: "Multiple",
    },
    highlight: true,
  },
];

const capLabels: { key: keyof (typeof tiers)[0]["caps"]; label: string }[] = [
  { key: "orders", label: "Orders" },
  { key: "staff", label: "Staff accounts" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "inventory", label: "Inventory tracking" },
  { key: "branches", label: "Branches" },
];

const included = [
  "Fast checkout with sizes, add-ons & custom prices",
  "VAT receipts, Senior & PWD discounts",
  "Cash, GCash, QR Ph & bank transfer",
  "Cashier shifts with cash counts",
  "Inventory that auto-deducts on each sale",
  "Employees, roles & secure PINs",
  "Attendance, timesheets & payroll",
  "Dashboard, sales reports & top sellers",
  "Bluetooth receipt printing & cash drawer",
];

export default function Plans() {
  return (
    <>
      {/* Standalone top bar — deliberately NOT the site Header (no pricing nav). */}
      <div className="border-b border-hairline/70 bg-surface-1">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-5">
          <span className="flex items-center gap-2.5">
            <Image
              src="/app_icon.png"
              alt="Prestige POS"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-xl shadow-card ring-1 ring-black/5"
            />
            <span className="text-[17px] font-semibold tracking-tight text-ink">
              Prestige POS
            </span>
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">
            Plans
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-[40px] md:leading-tight">
            What&apos;s included in each plan
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            Every plan runs the same full point-of-sale — the difference is how
            much your store can grow inside it.
          </p>
        </div>

        {/* Tier cards */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border bg-surface-1 p-6 shadow-card ${
                t.highlight ? "border-brand ring-1 ring-brand/30" : "border-hairline"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">{t.name}</h2>
                {t.highlight && (
                  <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-deep">
                    Most capable
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-medium text-brand-deep">{t.tag}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{t.desc}</p>
              <dl className="mt-5 space-y-2.5 border-t border-hairline pt-4">
                {capLabels.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between text-[13px]">
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="flex items-center gap-1 font-semibold text-ink">
                      {t.caps[key].startsWith("Unlimited") && (
                        <InfinityIcon size={13} className="text-brand" />
                      )}
                      {t.caps[key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Included everywhere */}
        <div className="mt-12 rounded-2xl border border-hairline bg-surface-1 p-7 shadow-card">
          <h2 className="text-base font-semibold text-ink">Included in every plan</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px] leading-snug text-ink">
                <Check size={15} className="mt-0.5 shrink-0 text-brand" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact-only CTA — no purchase path by design */}
        <div className="mt-12 rounded-2xl bg-brand-deep px-7 py-10 text-center text-white">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Questions about your plan?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-soft">
            Plan changes are handled by your Prestige IT Solutions account
            manager — reach out and we&apos;ll take care of it.
          </p>
          <a
            href="mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%20plan"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-deep transition hover:bg-brand-tint"
          >
            <Mail size={15} />
            hello@prestigeitsolutions.tech
          </a>
        </div>
      </main>

      <footer className="border-t border-hairline bg-surface-1">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-ink-subtle sm:flex-row">
          <span>© {new Date().getFullYear()} Prestige IT Solutions</span>
          <span className="flex gap-4">
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
