"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, Receipt } from "lucide-react";
import type { PortalPayslip } from "@/app/portal/actions";
import { PortalNav } from "./portal-nav";

// ── Pay math — mirrors the Flutter Payslip model exactly (integer centavos so
// the net shown here matches the app to the centavo) ─────────────────────────
const c = (pesos: number) => Math.round(pesos * 100);

function periodsPerMonth(kind: PortalPayslip["kind"]): number {
  switch (kind) {
    case "weekly": return 4.333;
    case "biweekly": return 2.167;
    case "semi_monthly": return 2.0;
    default: return 1.0;
  }
}

function hourlyEquiv(p: PortalPayslip): number {
  const perDay = p.regular_hours_per_day > 0 ? p.regular_hours_per_day : 8;
  switch (p.compensation_type) {
    case "hourly": return p.hourly_rate;
    case "daily": return p.daily_rate / perDay;
    case "salaried": return p.monthly_salary / 26 / perDay;
  }
}

function compute(p: PortalPayslip) {
  const pm = periodsPerMonth(p.kind);
  const perDay = p.regular_hours_per_day > 0 ? p.regular_hours_per_day : 8;
  const he = hourlyEquiv(p);
  let baseC: number;
  if (p.compensation_type === "hourly") baseC = c(p.hours_worked * p.hourly_rate);
  else if (p.compensation_type === "daily") baseC = c((p.hours_worked / perDay) * p.daily_rate);
  else baseC = c(p.monthly_salary / pm);
  const otC = c(p.ot_hours * he * p.ot_multiplier);
  const restdayC = p.restday_mult > 1 ? c(p.restday_hours * he * (p.restday_mult - 1)) : 0;
  const nightC = p.nightdiff_mult > 1 ? c(p.nightdiff_hours * he * (p.nightdiff_mult - 1)) : 0;
  const holidayC = c(p.holiday_premium_hours * he);
  const bonusC = c(p.bonus);
  const grossC = baseC + otC + restdayC + nightC + holidayC + bonusC;
  const sssC = c(p.sss / pm);
  const phC = c(p.philhealth / pm);
  const piC = c(p.pagibig / pm);
  const utC = p.deduct_undertime ? c(p.undertime_hours * he) : 0;
  const absenceC = p.compensation_type === "salaried" && p.absent_days > 0
    ? c((p.absent_days * p.monthly_salary) / 26) : 0;
  const otherC = c(p.deductions);
  const netC = grossC - sssC - phC - piC - utC - absenceC - otherC;
  return { baseC, otC, restdayC, nightC, holidayC, bonusC, grossC, sssC, phC, piC, utC, absenceC, otherC, netC, perDay };
}

const peso = (cents: number) =>
  "₱" + (cents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const left = `${MONTHS[s.getMonth()]} ${s.getDate()}`;
  const right = sameMonth ? `${e.getDate()}` : `${MONTHS[e.getMonth()]} ${e.getDate()}`;
  return `${left} – ${right}, ${e.getFullYear()}`;
}

export function PayslipHistory({
  first,
  payslips,
  store,
}: {
  first: string;
  payslips: PortalPayslip[];
  store: string | null;
}) {
  const dash = store ? `/portal?store=${encodeURIComponent(store)}` : "/portal";
  return (
    <main className="min-h-dvh bg-surface-2 pb-28">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 text-white">
          <Link
            href={dash}
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/20"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="leading-tight">
            <p className="text-[14px] font-bold">Payslips</p>
            <p className="text-[11px] text-white/55">{first}&apos;s pay history</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-5">
        {payslips.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-surface-1 p-8 text-center shadow-card">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-3 text-ink-muted">
              <Receipt size={22} />
            </div>
            <h2 className="mt-4 text-[15px] font-bold text-ink">No payslips yet</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
              Your payslips appear here once your employer finalizes a pay run for a period you worked.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {payslips.map((p) => (
              <PayslipCard key={p.run_id} p={p} />
            ))}
          </ul>
        )}
      </div>
      <PortalNav active="payslips" store={store} />
    </main>
  );
}

function PayslipCard({ p }: { p: PortalPayslip }) {
  const [open, setOpen] = useState(false);
  const m = compute(p);
  const paid = p.status === "paid";
  return (
    <li className="overflow-hidden rounded-3xl bg-surface-1 shadow-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-bold text-ink">{fmtRange(p.period_start, p.period_end)}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {paid ? "Paid" : "Finalized"}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-ink-muted">Net pay</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-[18px] font-extrabold tabular-nums text-brand-deep">{peso(m.netC)}</p>
          <ChevronDown size={18} className={`text-ink-subtle transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-hairline px-5 py-4">
          <Section title="Earnings">
            <Line label={baseLabel(p)} value={m.baseC} sign="+" />
            {m.otC > 0 && (
              <Line label={`Overtime  ${p.ot_hours.toFixed(1)}h × ${p.ot_multiplier.toFixed(2)}×`} value={m.otC} sign="+" />
            )}
            {m.restdayC > 0 && (
              <Line label={`Rest-day premium  ${p.restday_hours.toFixed(1)}h × ${p.restday_mult.toFixed(2)}×`} value={m.restdayC} sign="+" />
            )}
            {m.nightC > 0 && (
              <Line label={`Night differential  ${p.nightdiff_hours.toFixed(1)}h`} value={m.nightC} sign="+" />
            )}
            {m.holidayC > 0 && <Line label="Holiday premium" value={m.holidayC} sign="+" />}
            {m.bonusC > 0 && <Line label="Bonus" value={m.bonusC} sign="+" />}
          </Section>

          {(m.utC > 0 || m.absenceC > 0 || m.sssC > 0 || m.phC > 0 || m.piC > 0 || m.otherC > 0) && (
            <Section title="Deductions">
              {m.utC > 0 && <Line label={`Undertime  ${p.undertime_hours.toFixed(1)}h`} value={m.utC} sign="−" deduct />}
              {m.absenceC > 0 && <Line label={`Absences  ${p.absent_days} day(s)`} value={m.absenceC} sign="−" deduct />}
              {m.sssC > 0 && <Line label="SSS" value={m.sssC} sign="−" deduct />}
              {m.phC > 0 && <Line label="PhilHealth" value={m.phC} sign="−" deduct />}
              {m.piC > 0 && <Line label="Pag-IBIG" value={m.piC} sign="−" deduct />}
              {m.otherC > 0 && <Line label="Other deductions" value={m.otherC} sign="−" deduct />}
            </Section>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Net pay</p>
              <p className="text-[11px] text-ink-subtle">Gross {peso(m.grossC)}</p>
            </div>
            <p className="text-[20px] font-extrabold tabular-nums text-brand-deep">{peso(m.netC)}</p>
          </div>
        </div>
      )}
    </li>
  );
}

function baseLabel(p: PortalPayslip): string {
  if (p.compensation_type === "hourly") return `Regular  ${p.hours_worked.toFixed(1)}h × ₱${p.hourly_rate.toFixed(0)}`;
  if (p.compensation_type === "daily") {
    const perDay = p.regular_hours_per_day > 0 ? p.regular_hours_per_day : 8;
    return `Regular  ${(p.hours_worked / perDay).toFixed(2)}d × ₱${p.daily_rate.toFixed(0)}`;
  }
  return "Salary  (this pay run)";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-subtle">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Line({ label, value, sign, deduct }: { label: string; value: number; sign: string; deduct?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className={`text-[12.5px] font-semibold tabular-nums ${deduct ? "text-red-600" : "text-green-600"}`}>
        {sign} {peso(value)}
      </span>
    </div>
  );
}
