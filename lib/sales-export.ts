import { PAYMENT_LABELS } from "@/lib/format";

/** Shape returned by the public.tenant_sales_report RPC. */
export type SalesReportData = {
  range: { from: string; to: string; method: string | null };
  kpis: {
    revenue_cents: number;
    orders: number;
    avg_ticket_cents: number;
    last_order_at: string | null;
  };
  split: {
    general_cents: number;
    separated_cents: number;
    general_qty: number;
    separated_qty: number;
  };
  payment_mix: { method: string; amount: number; count: number }[];
  by_category: { category: string; cents: number; qty: number; separated: boolean }[];
  top_sellers: { name: string; qty: number; revenue: number }[];
  daily: { d: string; rev: number; orders: number }[];
};

/** One receipt from the public.tenant_sales_transactions RPC. */
export type SaleTxn = {
  id: string;
  number: number;
  status: "paid" | "voided" | "refunded";
  created_at: string;
  paid_at: string | null;
  cashier: string | null;
  branch: string | null;
  customer: string | null;
  notes: string | null;
  subtotal_cents: number;
  discount_cents: number;
  vat_cents: number;
  total_cents: number;
  voided_at: string | null;
  void_reason: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  items: {
    name: string;
    category: string;
    qty: number;
    unit_cents: number;
    total_cents: number;
    modifiers: unknown;
    separated: boolean;
  }[];
  payments: { method: string; amount_cents: number; reference: string | null }[];
};
export type SalesTxns = { orders: SaleTxn[]; truncated: boolean };

export type SalesExportInput = {
  storeName: string;
  from: Date;
  /** Exclusive upper bound (start of the day after the last one shown). */
  to: Date;
  allTime: boolean;
  method: string | null;
  report: SalesReportData;
  /** Null when the receipt detail couldn't be loaded — export the summary only. */
  txns: SalesTxns | null;
};

// ── formatting ─────────────────────────────────────────────────────────────
//
// Mirrors the HR exports: `sep=,` + BOM so Excel opens it as columns in UTF-8,
// a titled header block, peso amounts as plain numbers so they can be summed,
// blank spacer rows between sections and TOTAL rows under their columns.

const TZ = "Asia/Manila";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const fmtDateTime = (iso: string) => `${fmtDate(iso)} ${fmtTime(iso)}`;
/** RPC calendar days ("2026-10-31") → "Oct 31, 2026" / "Sat". */
const fmtDay = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-PH", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
const weekday = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-PH", { timeZone: "UTC", weekday: "short" });

const nowStamp = () =>
  new Date().toLocaleString("en-PH", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" });

/** Local yyyy-mm-dd, for filenames. */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Centavos → "1234.50" — numeric for the spreadsheet. */
const money = (c: number) => ((c ?? 0) / 100).toFixed(2);
/** Centavos → "1,234.50" — for the PDF. */
const amt = (c: number) =>
  ((c ?? 0) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "0.0%");
const count = (n: number) => (n ?? 0).toLocaleString("en-PH");

const payLabel = (m: string) => PAYMENT_LABELS[m] ?? m;

function lastDay(to: Date): Date {
  const d = new Date(to);
  d.setDate(d.getDate() - 1);
  return d;
}

function periodLabel(i: SalesExportInput): string {
  if (i.allTime) return "All time";
  const opts = { month: "short", day: "numeric", year: "numeric" } as const;
  const a = i.from.toLocaleDateString("en-PH", opts);
  const b = lastDay(i.to).toLocaleDateString("en-PH", opts);
  return a === b ? a : `${a} to ${b}`;
}

function fileBase(i: SalesExportInput): string {
  const slug = i.storeName.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "store";
  const span = i.allTime ? "all-time" : (() => {
    const a = ymd(i.from);
    const b = ymd(lastDay(i.to));
    return a === b ? a : `${a}_to_${b}`;
  })();
  return `sales_${slug}_${span}${i.method ? `_${i.method}` : ""}`;
}

/** Modifier snapshot ({"Size":"Large"} or a list) → "Size: Large; Sugar: Less". */
function modifiersText(m: unknown): string {
  if (m == null) return "";
  if (Array.isArray(m))
    return m
      .map((x) => (x && typeof x === "object" ? Object.values(x as object).join(" ") : String(x)))
      .filter(Boolean)
      .join(", ");
  if (typeof m === "object")
    return Object.entries(m as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("/") : typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("; ");
  return String(m);
}

/** "Cash" or, for a split tender, "Cash 200.00 + GCash 300.00". */
function paymentText(o: SaleTxn, fmt: (c: number) => string): string {
  if (o.payments.length === 0) return "—";
  if (o.payments.length === 1) return payLabel(o.payments[0].method);
  return o.payments.map((p) => `${payLabel(p.method)} ${fmt(p.amount_cents)}`).join(" + ");
}
const referenceText = (o: SaleTxn) =>
  o.payments.map((p) => p.reference).filter(Boolean).join(" / ");

const itemsSummary = (o: SaleTxn) =>
  o.items.map((it) => `${it.qty} × ${it.name}`).join(", ");

// ── shared figures ─────────────────────────────────────────────────────────

type ItemRow = { name: string; category: string; separated: boolean; qty: number; cents: number };

function figures(i: SalesExportInput) {
  const orders = i.txns?.orders ?? [];
  const paid = orders.filter((o) => o.status === "paid");
  const voided = orders.filter((o) => o.status === "voided");
  const refunded = orders.filter((o) => o.status === "refunded");
  const sum = (xs: SaleTxn[], f: (o: SaleTxn) => number) => xs.reduce((a, o) => a + (f(o) ?? 0), 0);

  // Every item sold (not just the RPC's top 12), from the paid receipts.
  const byItem = new Map<string, ItemRow>();
  for (const o of paid)
    for (const it of o.items) {
      const key = `${it.name}\u0000${it.category}\u0000${it.separated}`;
      const row = byItem.get(key) ?? { name: it.name, category: it.category, separated: it.separated, qty: 0, cents: 0 };
      row.qty += it.qty;
      row.cents += it.total_cents;
      byItem.set(key, row);
    }
  const items = Array.from(byItem.values()).sort((a, b) => b.cents - a.cents || b.qty - a.qty);

  const r = i.report;
  const hasSeparated = r.split.separated_cents > 0 || r.by_category.some((c) => c.separated);
  const branches = new Set(orders.map((o) => o.branch).filter(Boolean));

  return {
    paid, voided, refunded, items, hasSeparated,
    multiBranch: branches.size > 1,
    paidTotal: sum(paid, (o) => o.total_cents),
    subtotal: sum(paid, (o) => o.subtotal_cents),
    discount: sum(paid, (o) => o.discount_cents),
    vat: sum(paid, (o) => o.vat_cents),
    itemsQty: items.reduce((a, x) => a + x.qty, 0),
    voidedTotal: sum(voided, (o) => o.total_cents),
    refundedTotal: sum(refunded, (o) => o.total_cents),
    payTotal: r.payment_mix.reduce((a, p) => a + p.amount, 0),
    catTotal: r.by_category.reduce((a, c) => a + c.cents, 0),
    itemTotal: items.reduce((a, x) => a + x.cents, 0),
  };
}

function notes(i: SalesExportInput): string[] {
  const out: string[] = [];
  if (!i.txns) out.push("Receipt detail couldn't be loaded, so this export has the summary only.");
  else if (i.txns.truncated)
    out.push(`Only the first ${count(i.txns.orders.length)} receipts are listed. Pick a shorter period for the full list.`);
  if (i.method)
    out.push(`Only receipts paid fully by ${payLabel(i.method)} are counted. "How customers paid" still shows every payment type.`);
  return out;
}

// ── CSV ────────────────────────────────────────────────────────────────────

const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rows2csv = (rows: unknown[][]): string =>
  "sep=,\r\n" + rows.map((r) => r.map(esc).join(",")).join("\r\n");

export function buildSalesCsv(i: SalesExportInput): { filename: string; csv: string } {
  const r = i.report;
  const f = figures(i);
  const rows: unknown[][] = [];
  const blank = () => rows.push([]);

  rows.push(
    ["SALES REPORT"],
    ["Store", i.storeName],
    ["Period", periodLabel(i)],
    ["Payment type", i.method ? `${payLabel(i.method)} only` : "All payment types"],
    ["Generated", nowStamp()],
    ["Note", "Peso amounts are plain numbers so they can be summed. Times are Philippine time."],
    ...notes(i).map((n) => ["Note", n]),
  );
  blank();

  rows.push(["SUMMARY"]);
  rows.push(["Total sales", money(r.kpis.revenue_cents)]);
  rows.push(["Paid receipts", r.kpis.orders]);
  rows.push(["Average sale", money(r.kpis.avg_ticket_cents)]);
  if (i.txns) {
    rows.push(["Items sold", f.itemsQty]);
    rows.push(["Gross sales (before discounts)", money(f.subtotal)]);
    rows.push(["Discounts given", money(f.discount)]);
    rows.push(["VAT included", money(f.vat)]);
  }
  if (f.hasSeparated) {
    rows.push(["Regular sales", money(r.split.general_cents)]);
    rows.push(["Separated sales", money(r.split.separated_cents)]);
  }
  if (i.txns) {
    rows.push(["Voided receipts", f.voided.length]);
    rows.push(["Voided amount", money(f.voidedTotal)]);
    rows.push(["Refunded receipts", f.refunded.length]);
    rows.push(["Refunded amount", money(f.refundedTotal)]);
  }
  rows.push(["Last sale", r.kpis.last_order_at ? fmtDateTime(r.kpis.last_order_at) : "—"]);
  blank();

  rows.push(["HOW CUSTOMERS PAID"]);
  rows.push(["Payment type", "Payments", "Amount", "Share"]);
  for (const p of r.payment_mix)
    rows.push([payLabel(p.method), p.count, money(p.amount), pct(p.amount, f.payTotal)]);
  rows.push(["TOTAL", r.payment_mix.reduce((a, p) => a + p.count, 0), money(f.payTotal), ""]);
  blank();

  if (r.by_category.length) {
    rows.push(["SALES BY CATEGORY"]);
    rows.push(f.hasSeparated
      ? ["Category", "Type", "Qty sold", "Amount", "Share"]
      : ["Category", "Qty sold", "Amount", "Share"]);
    for (const c of r.by_category)
      rows.push(f.hasSeparated
        ? [c.category, c.separated ? "Separated" : "Regular", c.qty, money(c.cents), pct(c.cents, f.catTotal)]
        : [c.category, c.qty, money(c.cents), pct(c.cents, f.catTotal)]);
    const qty = r.by_category.reduce((a, c) => a + c.qty, 0);
    rows.push(f.hasSeparated ? ["TOTAL", "", qty, money(f.catTotal), ""] : ["TOTAL", qty, money(f.catTotal), ""]);
    blank();
  }

  if (f.items.length) {
    rows.push(["ITEMS SOLD"]);
    rows.push(["Rank", "Item", "Category", "Qty sold", "Average price", "Amount", "Share"]);
    f.items.forEach((x, n) =>
      rows.push([n + 1, x.name, x.category, x.qty, money(Math.round(x.cents / x.qty)), money(x.cents), pct(x.cents, f.itemTotal)]));
    rows.push(["TOTAL", "", "", f.itemsQty, "", money(f.itemTotal), ""]);
    blank();
  } else if (r.top_sellers.length) {
    rows.push(["BEST SELLERS"]);
    rows.push(["Rank", "Item", "Qty sold", "Amount"]);
    r.top_sellers.forEach((s, n) => rows.push([n + 1, s.name, s.qty, money(s.revenue)]));
    blank();
  }

  if (r.daily.length) {
    rows.push(["DAILY SALES"]);
    rows.push(["Date", "Day", "Receipts", "Sales", "Average sale"]);
    for (const d of r.daily)
      rows.push([fmtDay(d.d), weekday(d.d), d.orders, money(d.rev), money(d.orders ? Math.round(d.rev / d.orders) : 0)]);
    rows.push(["TOTAL", "", r.daily.reduce((a, d) => a + d.orders, 0), money(r.daily.reduce((a, d) => a + d.rev, 0)), ""]);
    blank();
  }

  if (i.txns) {
    rows.push(["RECEIPTS"]);
    rows.push([
      "Date", "Time", "Receipt #", "Cashier", ...(f.multiBranch ? ["Branch"] : []), "Customer",
      "Items", "Qty", "Gross", "Discount", "VAT", "Total", "Payment", "Reference",
    ]);
    for (const o of f.paid)
      rows.push([
        fmtDate(o.created_at), fmtTime(o.created_at), o.number, o.cashier ?? "",
        ...(f.multiBranch ? [o.branch ?? ""] : []), o.customer ?? "",
        itemsSummary(o), o.items.reduce((a, it) => a + it.qty, 0),
        money(o.subtotal_cents), money(o.discount_cents), money(o.vat_cents), money(o.total_cents),
        paymentText(o, money), referenceText(o),
      ]);
    rows.push([
      "TOTAL", "", f.paid.length, "", ...(f.multiBranch ? [""] : []), "", "", f.itemsQty,
      money(f.subtotal), money(f.discount), money(f.vat), money(f.paidTotal), "", "",
    ]);
    blank();

    rows.push(["ITEMIZED SALES"]);
    rows.push(["Date", "Time", "Receipt #", "Item", "Options", "Category", ...(f.hasSeparated ? ["Type"] : []), "Qty", "Unit price", "Line total"]);
    for (const o of f.paid)
      for (const it of o.items)
        rows.push([
          fmtDate(o.created_at), fmtTime(o.created_at), o.number, it.name, modifiersText(it.modifiers), it.category,
          ...(f.hasSeparated ? [it.separated ? "Separated" : "Regular"] : []),
          it.qty, money(it.unit_cents), money(it.total_cents),
        ]);
    rows.push(["TOTAL", "", "", "", "", "", ...(f.hasSeparated ? [""] : []), f.itemsQty, "", money(f.itemTotal)]);
    blank();

    const cancelled = [...f.voided, ...f.refunded].sort((a, b) => a.created_at.localeCompare(b.created_at));
    rows.push(["VOIDED & REFUNDED"]);
    if (cancelled.length === 0) rows.push(["None in this period"]);
    else {
      rows.push(["Date", "Time", "Receipt #", "Status", "Cashier", "Items", "Amount", "Reason", "Voided / refunded at"]);
      for (const o of cancelled) {
        const at = o.status === "voided" ? o.voided_at : o.refunded_at;
        rows.push([
          fmtDate(o.created_at), fmtTime(o.created_at), o.number, o.status === "voided" ? "Voided" : "Refunded",
          o.cashier ?? "", itemsSummary(o), money(o.total_cents),
          (o.status === "voided" ? o.void_reason : o.refund_reason) ?? "", at ? fmtDateTime(at) : "",
        ]);
      }
      rows.push(["TOTAL", "", cancelled.length, "", "", "", money(f.voidedTotal + f.refundedTotal), "", ""]);
    }
  }

  return { filename: `${fileBase(i)}.csv`, csv: rows2csv(rows) };
}

export function downloadSalesCsv(i: SalesExportInput) {
  const { filename, csv } = buildSalesCsv(i);
  // BOM so Excel reads UTF-8 (ñ, ×) instead of mangling it.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF ────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];
const BRAND_DEEP: RGB = [142, 110, 73];
const BRAND_TINT: RGB = [247, 239, 228];
const INK: RGB = [21, 21, 21];
const MUTED: RGB = [107, 107, 107];
const HAIRLINE: RGB = [229, 229, 229];
const ZEBRA: RGB = [250, 250, 250];
const FOOT: RGB = [244, 244, 244];

/**
 * The built-in PDF fonts only cover Latin-1 (WinAnsi): "₱" becomes "PHP" and
 * anything else outside it (emoji, CJK in a product name) is dropped rather
 * than printed as garbage.
 */
const pdfSafe = (s: string) =>
  s
    .replace(/₱/g, "PHP ")
    .replace(/[^\u0000-ÿ–—‘’“”•…€™]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export async function downloadSalesPdf(i: SalesExportInput) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const r = i.report;
  const f = figures(i);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const inner = W - M * 2;
  let y = M;

  // ── header
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...BRAND_DEEP);
  doc.text("SALES REPORT", M, y + 4, { charSpace: 1.2 });
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
  doc.text(`Generated ${nowStamp()}`, W - M, y + 4, { align: "right" });
  y += 26;
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...INK);
  doc.text(pdfSafe(i.storeName), M, y);
  y += 17;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
  doc.text(`${periodLabel(i)}  •  ${i.method ? `${payLabel(i.method)} only` : "All payment types"}`, M, y);
  y += 12;
  doc.setDrawColor(...HAIRLINE).setLineWidth(0.75).line(M, y, W - M, y);
  y += 16;

  // ── KPI cards
  const cards: [string, string][] = [
    ["Total sales", `PHP ${amt(r.kpis.revenue_cents)}`],
    ["Paid receipts", count(r.kpis.orders)],
    ["Average sale", `PHP ${amt(r.kpis.avg_ticket_cents)}`],
    i.txns ? ["Items sold", count(f.itemsQty)] : ["Last sale", r.kpis.last_order_at ? fmtDate(r.kpis.last_order_at) : "—"],
  ];
  if (i.txns)
    cards.push(
      ["Discounts given", `PHP ${amt(f.discount)}`],
      ["VAT included", `PHP ${amt(f.vat)}`],
      ["Voided", `${count(f.voided.length)}  •  PHP ${amt(f.voidedTotal)}`],
      ["Refunded", `${count(f.refunded.length)}  •  PHP ${amt(f.refundedTotal)}`],
    );
  if (f.hasSeparated)
    cards.push(["Regular sales", `PHP ${amt(r.split.general_cents)}`], ["Separated sales", `PHP ${amt(r.split.separated_cents)}`]);
  const gap = 8;
  const cw = (inner - gap * 3) / 4;
  const ch = 44;
  cards.forEach(([label, value], n) => {
    const cx = M + (n % 4) * (cw + gap);
    const cy = y + Math.floor(n / 4) * (ch + gap);
    const hero = n === 0;
    doc.setFillColor(...(hero ? BRAND_TINT : ZEBRA)).setDrawColor(...(hero ? BRAND_DEEP : HAIRLINE));
    doc.roundedRect(cx, cy, cw, ch, 5, 5, "FD");
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...(hero ? BRAND_DEEP : MUTED));
    doc.text(label.toUpperCase(), cx + 9, cy + 15, { charSpace: 0.5 });
    doc.setFont("helvetica", "bold").setFontSize(value.length > 18 ? 10 : 12.5).setTextColor(...INK);
    doc.text(value, cx + 9, cy + 33);
  });
  y += Math.ceil(cards.length / 4) * (ch + gap) + 4;

  for (const n of notes(i)) {
    doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(...MUTED);
    const lines = doc.splitTextToSize(pdfSafe(n), inner);
    doc.text(lines, M, y + 8);
    y += lines.length * 10;
  }
  y += 10;

  // ── tables
  const table = (
    title: string,
    head: string[],
    body: (string | number)[][],
    opts: { foot?: (string | number)[]; right?: number[]; widths?: Record<number, number>; small?: boolean } = {},
  ) => {
    if (y > H - 110) {
      doc.addPage();
      y = M;
    }
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
    doc.text(title, M, y + 4);
    y += 12;
    const columnStyles: Record<number, { halign?: "right"; cellWidth?: number }> = {};
    for (const c of opts.right ?? []) columnStyles[c] = { ...columnStyles[c], halign: "right" };
    for (const [c, w] of Object.entries(opts.widths ?? {})) columnStyles[+c] = { ...columnStyles[+c], cellWidth: w };
    const clean = (row: (string | number)[]) => row.map((v) => (typeof v === "string" ? pdfSafe(v) : v));
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, top: M, bottom: 44 },
      head: [head],
      body: body.map(clean),
      foot: opts.foot ? [clean(opts.foot)] : undefined,
      showFoot: "lastPage",
      rowPageBreak: "avoid",
      theme: "plain",
      styles: {
        font: "helvetica", fontSize: opts.small ? 7.5 : 8.5, textColor: INK,
        cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
        lineColor: HAIRLINE, overflow: "linebreak", valign: "top",
      },
      headStyles: { fillColor: BRAND_TINT, textColor: BRAND_DEEP, fontStyle: "bold", fontSize: 7.5 },
      footStyles: { fillColor: FOOT, fontStyle: "bold" },
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles,
      didParseCell: (d) => {
        if (d.section !== "body") d.cell.styles.halign = columnStyles[d.column.index]?.halign ?? "left";
        d.cell.styles.lineWidth = { bottom: 0.5, top: 0, left: 0, right: 0 };
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  };

  table(
    "How customers paid",
    ["Payment type", "Payments", "Amount (PHP)", "Share"],
    r.payment_mix.map((p) => [payLabel(p.method), count(p.count), amt(p.amount), pct(p.amount, f.payTotal)]),
    { foot: ["Total", count(r.payment_mix.reduce((a, p) => a + p.count, 0)), amt(f.payTotal), ""], right: [1, 2, 3] },
  );

  if (r.by_category.length) {
    const qty = r.by_category.reduce((a, c) => a + c.qty, 0);
    table(
      "Sales by category",
      f.hasSeparated ? ["Category", "Type", "Qty sold", "Amount (PHP)", "Share"] : ["Category", "Qty sold", "Amount (PHP)", "Share"],
      r.by_category.map((c) =>
        f.hasSeparated
          ? [c.category, c.separated ? "Separated" : "Regular", count(c.qty), amt(c.cents), pct(c.cents, f.catTotal)]
          : [c.category, count(c.qty), amt(c.cents), pct(c.cents, f.catTotal)]),
      f.hasSeparated
        ? { foot: ["Total", "", count(qty), amt(f.catTotal), ""], right: [2, 3, 4] }
        : { foot: ["Total", count(qty), amt(f.catTotal), ""], right: [1, 2, 3] },
    );
  }

  if (f.items.length)
    table(
      "Items sold",
      ["#", "Item", "Category", "Qty", "Avg price", "Amount (PHP)", "Share"],
      f.items.map((x, n) => [n + 1, x.name, x.category, count(x.qty), amt(Math.round(x.cents / x.qty)), amt(x.cents), pct(x.cents, f.itemTotal)]),
      { foot: ["", "Total", "", count(f.itemsQty), "", amt(f.itemTotal), ""], right: [0, 3, 4, 5, 6], widths: { 0: 24 } },
    );
  else if (r.top_sellers.length)
    table(
      "Best sellers",
      ["#", "Item", "Qty sold", "Amount (PHP)"],
      r.top_sellers.map((s, n) => [n + 1, s.name, count(s.qty), amt(s.revenue)]),
      { right: [0, 2, 3], widths: { 0: 24 } },
    );

  if (r.daily.length)
    table(
      "Daily sales",
      ["Date", "Day", "Receipts", "Sales (PHP)", "Average sale"],
      r.daily.map((d) => [fmtDay(d.d), weekday(d.d), count(d.orders), amt(d.rev), amt(d.orders ? Math.round(d.rev / d.orders) : 0)]),
      {
        foot: ["Total", "", count(r.daily.reduce((a, d) => a + d.orders, 0)), amt(r.daily.reduce((a, d) => a + d.rev, 0)), ""],
        right: [2, 3, 4],
      },
    );

  if (i.txns) {
    table(
      "Receipts",
      ["Date & time", "Receipt", "Cashier", "Items", "Payment", "Discount", "Total"],
      f.paid.map((o) => [
        `${fmtDate(o.created_at)}\n${fmtTime(o.created_at)}`,
        `#${o.number}`,
        [o.cashier ?? "", f.multiBranch ? o.branch ?? "" : "", o.customer ? `Cust: ${o.customer}` : ""].filter(Boolean).join("\n"),
        itemsSummary(o),
        [paymentText(o, amt), referenceText(o) ? `Ref ${referenceText(o)}` : ""].filter(Boolean).join("\n"),
        o.discount_cents ? amt(o.discount_cents) : "—",
        amt(o.total_cents),
      ]),
      {
        foot: ["Total", count(f.paid.length), "", `${count(f.itemsQty)} items`, "", amt(f.discount), amt(f.paidTotal)],
        right: [5, 6],
        widths: { 0: 62, 1: 42, 2: 66, 4: 78, 5: 48, 6: 56 },
        small: true,
      },
    );

    const cancelled = [...f.voided, ...f.refunded].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (cancelled.length)
      table(
        "Voided & refunded",
        ["Date & time", "Receipt", "Status", "Cashier", "Reason", "Amount (PHP)"],
        cancelled.map((o) => [
          `${fmtDate(o.created_at)}\n${fmtTime(o.created_at)}`,
          `#${o.number}`,
          o.status === "voided" ? "Voided" : "Refunded",
          o.cashier ?? "",
          (o.status === "voided" ? o.void_reason : o.refund_reason) ?? "—",
          amt(o.total_cents),
        ]),
        {
          foot: ["Total", count(cancelled.length), "", "", "", amt(f.voidedTotal + f.refundedTotal)],
          right: [5],
          widths: { 0: 62, 1: 42, 2: 52, 3: 70, 5: 64 },
          small: true,
        },
      );
  }

  // ── footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...HAIRLINE).setLineWidth(0.5).line(M, H - 30, W - M, H - 30);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED);
    doc.text(pdfSafe(`${i.storeName}  •  Sales report  •  ${periodLabel(i)}`), M, H - 18);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 18, { align: "right" });
  }

  doc.save(`${fileBase(i)}.pdf`);
}
