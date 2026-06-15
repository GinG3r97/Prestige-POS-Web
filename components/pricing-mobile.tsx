"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Plan = {
  id: "basic" | "pro";
  name: string;
  popular?: boolean;
  tagline: string;
  price: string;
  per: string;
  daily: string;
  yearly: string;
  payback?: string;
  featuresIntro?: string;
  features: string[];
  cta: string;
  href: string;
  note: string;
};

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Good for starters and small businesses.",
    price: "₱499",
    per: "/month per branch",
    daily: "about ₱17 a day",
    yearly: "Yearly ₱4,990 · 2 months free",
    features: [
      "Up to 100 items sold per day",
      "Fast Sell screen for the cashier",
      "Sizes, add-ons & custom prices",
      "Search, void & refund orders",
      "Printed receipts (Bluetooth thermal)",
      "Cash, GCash & QR Ph payments",
      "Senior & PWD discounts",
      "1 branch · 2 staff PINs",
    ],
    cta: "Try Basic free",
    href: "mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%3A%20Start%20Basic",
    note: "14-day free trial · no card needed",
  },
  {
    id: "pro",
    name: "Pro",
    popular: true,
    tagline: "For growing and busy businesses.",
    price: "₱1,499",
    per: "/month per branch",
    daily: "about ₱49 a day. Less than one latte.",
    yearly: "Yearly ₱14,990 · save ₱2,998",
    payback: "Most stores earn this back before lunch.",
    featuresIntro: "Everything in Basic, plus everything unlocked:",
    features: [
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
    ],
    cta: "Start 14-day free trial",
    href: "mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%3A%20Start%20Pro%20trial",
    note: "No card needed · Cancel anytime",
  },
];

/** Mobile-only pricing: one plan at a time behind a segmented toggle. */
export function PricingMobile() {
  const [active, setActive] = useState<"basic" | "pro">("basic");
  const plan = plans.find((p) => p.id === active)!;
  const isPro = plan.id === "pro";

  return (
    <div>
      {/* Segmented toggle */}
      <div className="mx-auto flex max-w-xs rounded-full border border-hairline bg-surface-1 p-1 shadow-sm">
        {plans.map((p) => {
          const on = p.id === active;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={`relative flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
                on ? "bg-brand text-white shadow-card" : "text-ink-muted"
              }`}
            >
              {p.name}
              {p.popular && !on && (
                <span className="ml-1.5 align-middle text-[9px] font-bold uppercase tracking-wide text-brand-deep">
                  popular
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active plan card */}
      <div
        className={`mt-5 rounded-[1.5rem] border bg-surface-1 p-6 shadow-card ${
          isPro ? "border-2 border-brand bg-gradient-to-b from-brand-tint/60 to-surface-1" : "border-hairline"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold uppercase tracking-wide ${isPro ? "text-brand-deep" : "text-ink-muted"}`}>
            {plan.name}
          </p>
          {plan.popular && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold text-white">
              Most popular
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{plan.tagline}</p>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-[40px] font-semibold leading-none tracking-tight text-ink">{plan.price}</span>
          <span className="text-sm text-ink-muted">{plan.per}</span>
        </div>
        <p className="mt-1.5 text-xs text-ink-subtle">{plan.daily}</p>
        <span className="mt-2.5 inline-flex w-fit items-center rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
          {plan.yearly}
        </span>
        {plan.payback && <p className="mt-2 text-[12px] font-medium text-brand-deep">{plan.payback}</p>}

        {plan.featuresIntro && (
          <p className="mt-4 text-[13px] font-semibold text-ink">{plan.featuresIntro}</p>
        )}
        <ul className="mt-3 space-y-2.5 text-sm text-ink">
          {plan.features.map((pt) => (
            <li key={pt} className="flex items-start gap-2.5">
              <Check size={16} className="mt-0.5 shrink-0 text-brand" />
              {pt}
            </li>
          ))}
        </ul>

        <a
          href={plan.href}
          className={`mt-6 block rounded-full px-6 py-3.5 text-center text-sm font-semibold transition ${
            isPro
              ? "bg-brand text-white shadow-card hover:bg-brand-deep"
              : "border border-hairline bg-surface-1 text-ink hover:bg-surface-3"
          }`}
        >
          {plan.cta}
        </a>
        <p className="mt-2.5 text-center text-[11px] text-ink-subtle">{plan.note}</p>
      </div>
    </div>
  );
}
