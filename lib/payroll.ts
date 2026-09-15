/**
 * Payslip math — a line-for-line port of the POS app's
 * `lib/models/payroll.dart`. Both platforms read the same `payslips` rows, so
 * the arithmetic has to agree to the centavo or the web would show a different
 * net pay than the receipt the staff member was handed.
 *
 * Every step runs in integer centavos for the same reason the Dart does:
 * summing many slips in floating-point pesos drifts.
 */

export type CompensationType = "hourly" | "daily" | "salaried" | "fixed";
export type PayPeriodKind = "weekly" | "biweekly" | "semi_monthly" | "monthly";
export type PayrollStatus = "draft" | "finalized" | "paid";

/** Raw `payslips` row as stored. Field names mirror the columns. */
export type Payslip = {
  id: string;
  employee_id: string | null;
  employee_name: string;
  employee_role: string;
  compensation_type: CompensationType;
  hours_worked: number;
  hourly_rate: number;
  daily_rate: number;
  monthly_salary: number;
  bonus: number;
  deductions: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  ot_hours: number;
  undertime_hours: number;
  late_minutes: number;
  ot_multiplier: number;
  deduct_undertime: boolean;
  restday_hours: number;
  restday_mult: number;
  nightdiff_hours: number;
  nightdiff_mult: number;
  absent_days: number;
  holiday_premium_hours: number;
};

export type PayrollRun = {
  id: string;
  period_start: string;
  period_end: string;
  kind: PayPeriodKind;
  status: PayrollStatus;
  paid_at: string | null;
  created_at: string;
  slips: Payslip[];
};

/**
 * Dart's `double.round()` rounds half AWAY FROM ZERO; JS `Math.round` rounds
 * half toward +Infinity. They differ only on negative halves (a negative
 * "other deduction"), but matching exactly is free.
 */
const toCentavos = (pesos: number): number =>
  pesos < 0 ? -Math.round(-pesos * 100) : Math.round(pesos * 100);

/** How many of this period fit in a month — pro-rates salary and statutory. */
export function periodsPerMonth(period: PayPeriodKind): number {
  switch (period) {
    case "weekly":
      return 4.333;
    case "biweekly":
      return 2.167;
    case "semi_monthly":
      return 2.0;
    case "monthly":
      return 1.0;
  }
}

/** Standard hours in a working day, falling back to 8 on a blank setting. */
const perDayOf = (regularHoursPerDay: number) =>
  regularHoursPerDay > 0 ? regularHoursPerDay : 8.0;

/**
 * Per-hour rate for OT pay and undertime deductions. Hourly staff use their
 * rate directly; daily and salaried derive an equivalent (monthly assumes 26
 * working days, matching the Dart).
 */
export function hourlyEquivalent(s: Payslip, regularHoursPerDay: number): number {
  const perDay = perDayOf(regularHoursPerDay);
  switch (s.compensation_type) {
    case "hourly":
      return s.hourly_rate;
    case "daily":
      return s.daily_rate / perDay;
    case "salaried":
    case "fixed":
      return s.monthly_salary / 26.0 / perDay;
  }
}

export function otPayCentavos(s: Payslip, rhpd: number): number {
  return toCentavos(s.ot_hours * hourlyEquivalent(s, rhpd) * s.ot_multiplier);
}

/** Extra pay for rest-day work — the portion ABOVE base, base is in regular. */
export function restdayPremiumCentavos(s: Payslip, rhpd: number): number {
  return s.restday_mult <= 1
    ? 0
    : toCentavos(s.restday_hours * hourlyEquivalent(s, rhpd) * (s.restday_mult - 1));
}

export function nightdiffPremiumCentavos(s: Payslip, rhpd: number): number {
  return s.nightdiff_mult <= 1
    ? 0
    : toCentavos(s.nightdiff_hours * hourlyEquivalent(s, rhpd) * (s.nightdiff_mult - 1));
}

/** Holiday premium — the extra above base, already factored server-side. */
export function holidayPremiumCentavos(s: Payslip, rhpd: number): number {
  return toCentavos(s.holiday_premium_hours * hourlyEquivalent(s, rhpd));
}

/** Gross in centavos: base by comp type, plus every premium, plus bonus. */
export function grossCentavos(s: Payslip, period: PayPeriodKind, rhpd: number): number {
  let base: number;
  switch (s.compensation_type) {
    case "hourly":
      base = toCentavos(s.hours_worked * s.hourly_rate);
      break;
    case "daily":
      base = toCentavos((s.hours_worked / perDayOf(rhpd)) * s.daily_rate);
      break;
    case "salaried":
    case "fixed":
      base = toCentavos(s.monthly_salary / periodsPerMonth(period));
      break;
  }
  return (
    base +
    otPayCentavos(s, rhpd) +
    restdayPremiumCentavos(s, rhpd) +
    nightdiffPremiumCentavos(s, rhpd) +
    holidayPremiumCentavos(s, rhpd) +
    toCentavos(s.bonus)
  );
}

/** Each statutory item is rounded separately, exactly as the Dart does. */
export function sssCentavos(s: Payslip, p: PayPeriodKind) {
  return toCentavos(s.sss / periodsPerMonth(p));
}
export function philhealthCentavos(s: Payslip, p: PayPeriodKind) {
  return toCentavos(s.philhealth / periodsPerMonth(p));
}
export function pagibigCentavos(s: Payslip, p: PayPeriodKind) {
  return toCentavos(s.pagibig / periodsPerMonth(p));
}
export function statutoryCentavos(s: Payslip, p: PayPeriodKind): number {
  return sssCentavos(s, p) + philhealthCentavos(s, p) + pagibigCentavos(s, p);
}

/** 0 when the tenant switched undertime deduction off, and always 0 for FIXED. */
export function undertimeCentavos(s: Payslip, rhpd: number): number {
  return s.compensation_type === "fixed" || !s.deduct_undertime
    ? 0
    : toCentavos(s.undertime_hours * hourlyEquivalent(s, rhpd));
}

/**
 * Unexcused absences dock SALARIED pay only (monthly ÷ 26 per day) — hourly
 * and daily already lose the hours, and FIXED pay is guaranteed.
 */
export function absenceDeductionCentavos(s: Payslip): number {
  return s.compensation_type === "salaried" && s.absent_days > 0
    ? toCentavos((s.absent_days * s.monthly_salary) / 26.0)
    : 0;
}

/** Net in centavos, floored at 0 — a payslip never goes negative. */
export function netCentavos(s: Payslip, period: PayPeriodKind, rhpd: number): number {
  const n =
    grossCentavos(s, period, rhpd) -
    statutoryCentavos(s, period) -
    undertimeCentavos(s, rhpd) -
    absenceDeductionCentavos(s) -
    toCentavos(s.deductions);
  return n < 0 ? 0 : n;
}

export type RunTotals = {
  gross: number;
  net: number;
  deductions: number;
  statutory: number;
  headcount: number;
};

/** Run totals summed in centavos, converted once — no per-slip drift. */
export function runTotals(run: PayrollRun, rhpd: number): RunTotals {
  let gross = 0;
  let net = 0;
  let statutory = 0;
  for (const s of run.slips) {
    gross += grossCentavos(s, run.kind, rhpd);
    net += netCentavos(s, run.kind, rhpd);
    statutory += statutoryCentavos(s, run.kind);
  }
  return {
    gross,
    net,
    deductions: gross - net,
    statutory,
    headcount: run.slips.length,
  };
}

export const PERIOD_LABELS: Record<PayPeriodKind, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  semi_monthly: "Semi-monthly",
  monthly: "Monthly",
};

export const COMP_LABELS: Record<CompensationType, string> = {
  hourly: "Hourly",
  daily: "Daily",
  salaried: "Salaried",
  fixed: "Fixed rate",
};
