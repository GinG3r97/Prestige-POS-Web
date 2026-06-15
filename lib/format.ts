/** ₱ from integer centavos. */
export const peso = (cents: number | null | undefined) =>
  "₱" +
  ((cents ?? 0) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Compact ₱ for tight cards: ₱28.7k, ₱1.2M. */
export const pesoCompact = (cents: number | null | undefined) => {
  const v = (cents ?? 0) / 100;
  if (v >= 1_000_000) return "₱" + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return "₱" + (v / 1_000).toFixed(1) + "k";
  return "₱" + v.toFixed(0);
};

export const num = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-PH");

/** "just now", "5m ago", "3h ago", "2d ago", or a date. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  qrph: "QR Ph",
  bank_transfer: "Bank transfer",
};
