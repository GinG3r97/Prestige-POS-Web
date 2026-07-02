import Link from "next/link";

export const metadata = { title: "Payment received — Prestige POS" };

export default function SubscribeSuccess() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface-2 px-5">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-1 p-8 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-tint text-2xl text-brand-deep">
          ✓
        </div>
        <h1 className="mt-5 text-xl font-semibold text-ink">Payment received</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          Thank you! We're activating your plan now. It usually takes just a few
          seconds, and your store will reflect the new plan automatically.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-brand-deep"
        >
          Go to your dashboard
        </Link>
        <p className="mt-3 text-[12px] text-ink-subtle">
          A receipt has been emailed to you by PayMongo.
        </p>
      </div>
    </div>
  );
}
