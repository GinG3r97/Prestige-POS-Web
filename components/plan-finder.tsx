"use client";

import { useState } from "react";
import { Coffee, Store, UtensilsCrossed, Building2, Check, ArrowRight } from "lucide-react";

type Persona = {
  id: string;
  icon: typeof Coffee;
  title: string;
  desc: string;
  plan: "Basic" | "Pro";
  price: string;
  heart: string;
  points: string[];
};

const personas: Persona[] = [
  {
    id: "roadside",
    icon: Coffee,
    title: "Roadside coffee",
    desc: "A cart, a few chairs, and your brew",
    plan: "Basic",
    price: "₱499/mo · about ₱17 a day",
    heart:
      "Your kapehan sa kanto is a real business. With Prestige you ring up sales, take GCash, and hand out printed receipts like the big cafés do. Look pro from day one.",
    points: ["Sell from one tablet or phone", "GCash & QR Ph ready", "Receipts that build trust"],
  },
  {
    id: "stall",
    icon: Store,
    title: "Small shop or stall",
    desc: "A physical store, you plus a helper or two",
    plan: "Basic",
    price: "₱499/mo · about ₱17 a day",
    heart:
      "Basic runs your whole counter clean: selling, orders, discounts, receipts. Spend your energy on customers, not notebooks. Upgrade only when the lines get long.",
    points: ["Fast Sell screen", "Track & refund orders", "Senior & PWD discounts done right"],
  },
  {
    id: "cafe",
    icon: UtensilsCrossed,
    title: "Café or resto with a team",
    desc: "Staff on shifts, ingredients to track",
    plan: "Pro",
    price: "₱1,499/mo · about ₱49 a day",
    heart:
      "When you have a team and a kitchen, guesswork gets expensive. Pro deducts inventory on every sale, runs payroll in minutes, and shows you the numbers live.",
    points: ["Inventory auto-deducts", "Payroll & timekeeping", "Dashboard & reports"],
  },
  {
    id: "branches",
    icon: Building2,
    title: "Growing to branches",
    desc: "More than one location, or getting there",
    plan: "Pro",
    price: "₱1,499/mo per branch",
    heart:
      "You worked hard to grow. Pro keeps every branch in one account, with its own staff, stock, and reports, so you stay in control wherever you are.",
    points: ["All branches, one account", "Per-branch staff & stock", "Reports from anywhere"],
  },
];

export function PlanFinder() {
  const [sel, setSel] = useState<Persona | null>(null);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {personas.map((p) => {
          const Icon = p.icon;
          const on = sel?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSel(p)}
              className={`rounded-xl2 border p-5 text-left transition hover:-translate-y-0.5 ${
                on
                  ? "border-brand bg-brand-tint/60 shadow-card"
                  : "border-hairline bg-surface-1 shadow-card hover:border-brand-soft"
              }`}
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                  on ? "bg-brand text-white" : "bg-brand-tint text-brand-deep"
                }`}
              >
                <Icon size={21} strokeWidth={1.9} />
              </div>
              <p className="mt-3 text-[15px] font-semibold text-ink">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {sel && (
        <div className="mt-6 rounded-xl2 border-2 border-brand bg-surface-1 p-6 shadow-card md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                {sel.plan} fits you
              </span>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{sel.heart}</p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {sel.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-1.5 text-sm text-ink">
                    <Check size={15} className="text-brand" /> {pt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 text-center md:text-right">
              <p className="text-sm font-semibold text-brand-deep">{sel.price}</p>
              <a
                href="#pricing"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep"
              >
                Start free, no card <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
