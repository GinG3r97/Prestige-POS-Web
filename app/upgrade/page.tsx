"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Store,
  ArrowRight,
  Loader2,
  Check,
  Copy,
  ShieldCheck,
  Clock,
  Crown,
  Sparkles,
} from "lucide-react";
import { lookupStore, submitUpgrade, type StoreMatch } from "./actions";

// ⚠️ EDIT GCASH_NAME and drop your QR at public/gcash-qr.png.
const GCASH_NAME = "Prestige IT Solutions";
const GCASH_NUMBER = "0916 685 6160";

const PRICES = {
  basic: { monthly: 499, yearly: 4990 },
  pro: { monthly: 1499, yearly: 14990 },
} as const;

const PLAN_INFO = {
  basic: {
    name: "Basic",
    tag: "For growing stores",
    perks: ["100 orders / day", "5 staff & PINs", "100 products", "Dashboard & reports"],
  },
  pro: {
    name: "Pro",
    tag: "Everything, unlimited",
    perks: ["Unlimited orders & catalog", "Payroll & timekeeping", "Bookings & members", "Multiple branches"],
  },
} as const;

const peso = (n: number) => "₱" + n.toLocaleString("en-PH");
const planLabel = (p: string) => (p === "trial" ? "Free" : p[0].toUpperCase() + p.slice(1));

type Step = "lookup" | "plan" | "pay" | "done" | "status" | "maxed";

export default function UpgradePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-surface-2" />}>
      <UpgradeFlow />
    </Suspense>
  );
}

function UpgradeFlow() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("lookup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [store, setStore] = useState<StoreMatch | null>(null);

  const [plan, setPlan] = useState<"basic" | "pro">("pro");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [reference, setReference] = useState("");

  const price = PRICES[plan][cycle];

  async function runLookup(c: string, e: string) {
    setBusy(true);
    setError(null);
    const res = await lookupStore(c, e);
    setBusy(false);
    if (!res.ok || !res.store) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    const s = res.store;
    setStore(s);
    if (s.pending) setStep("status");
    else if (s.plan === "pro") setStep("maxed");
    else setStep("plan");
  }

  useEffect(() => {
    const c = params.get("code");
    const e = params.get("email");
    if (c && e) runLookup(c.toUpperCase(), e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await submitUpgrade({ code, email, plan, cycle, reference });
    setBusy(false);
    if (!res.ok) {
      if (res.error === "ALREADY_PENDING") {
        const r2 = await lookupStore(code, email);
        if (r2.ok && r2.store) {
          setStore(r2.store);
          setStep("status");
          return;
        }
      }
      setError(res.error ?? "Could not submit.");
      return;
    }
    setStep("done");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand-tint/40 to-surface-2 px-5 py-10">
      <div className="w-full max-w-md">
        <Header step={step} />

        <div className="overflow-hidden rounded-3xl border border-hairline bg-surface-1 shadow-card">
          {/* progress strip for the active flow */}
          {["lookup", "plan", "pay"].includes(step) && (
            <Steps current={step as "lookup" | "plan" | "pay"} />
          )}

          <div className="p-6">
            {step === "lookup" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runLookup(code, email);
                }}
                className="space-y-4"
              >
                <Field label="Store ID">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="PR-XXXXXX"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-hairline bg-surface-2 px-4 py-3.5 font-mono text-sm tracking-widest text-ink outline-none transition focus:border-brand"
                  />
                  <p className="mt-1.5 text-[11px] text-ink-subtle">
                    In the app: Settings → Subscription.
                  </p>
                </Field>
                <Field label="Owner email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@store.com"
                    required
                    className="w-full rounded-xl border border-hairline bg-surface-2 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand"
                  />
                </Field>
                {error && <ErrorLine text={error} />}
                <Submit busy={busy} label="Continue" />
              </form>
            )}

            {step === "plan" && store && (
              <div className="space-y-4">
                <StoreBanner name={store.business_name} plan={store.plan} />

                <div className="space-y-2.5">
                  {(["basic", "pro"] as const).map((p) => (
                    <PlanCard
                      key={p}
                      id={p}
                      selected={plan === p}
                      onSelect={() => setPlan(p)}
                    />
                  ))}
                </div>

                <div className="flex rounded-full border border-hairline bg-surface-2 p-1">
                  {(["monthly", "yearly"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCycle(c)}
                      className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold capitalize transition ${
                        cycle === c ? "bg-brand text-white shadow-card" : "text-ink-muted"
                      }`}
                    >
                      {c}
                      {c === "yearly" && (
                        <span className="ml-1 text-[10px] font-bold text-green-600">
                          {cycle === "yearly" ? "· 2 mo free" : "save 2 mo"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-end justify-between rounded-2xl bg-brand-tint/60 px-4 py-3.5">
                  <div>
                    <p className="text-[12px] text-ink-muted">{planLabel(plan)} · {cycle}</p>
                    <p className="text-[11px] text-ink-subtle">billed {cycle === "yearly" ? "yearly" : "monthly"}</p>
                  </div>
                  <span className="text-[28px] font-semibold leading-none tracking-tight text-ink">
                    {peso(price)}
                  </span>
                </div>

                <button
                  onClick={() => setStep("pay")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep"
                >
                  Continue to payment <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setStep("lookup")}
                  className="w-full text-center text-[13px] font-medium text-ink-muted hover:text-ink"
                >
                  Not your store? Change
                </button>
              </div>
            )}

            {step === "pay" && (
              <form onSubmit={doSubmit} className="space-y-4">
                <div className="rounded-2xl border border-hairline bg-surface-2 p-4 text-center">
                  <p className="text-[12px] text-ink-muted">Send exactly</p>
                  <p className="text-3xl font-semibold tracking-tight text-ink">{peso(price)}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">via GCash to</p>
                  <p className="text-[13px] font-semibold text-ink">{GCASH_NAME}</p>
                  <CopyRow value={GCASH_NUMBER} />
                </div>

                <div className="mx-auto w-52">
                  <GcashQr />
                </div>

                <Field label="GCash reference number">
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. 0023 456 789012"
                    required
                    className="w-full rounded-xl border border-hairline bg-surface-2 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand"
                  />
                  <p className="mt-1.5 text-[11px] text-ink-subtle">
                    From your GCash receipt — this is how we confirm your payment.
                  </p>
                </Field>
                {error && <ErrorLine text={error} />}
                <Submit busy={busy} label="I've paid — submit" />
                <button
                  type="button"
                  onClick={() => setStep("plan")}
                  className="w-full text-center text-[13px] font-medium text-ink-muted hover:text-ink"
                >
                  Back
                </button>
              </form>
            )}

            {step === "status" && store?.pending && (
              <div className="flex flex-col items-center py-2 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-600">
                  <Clock size={30} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">Payment under review</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  We received your payment for <b>{store.business_name}</b>. We&apos;re
                  verifying it — your plan activates within a few hours.
                </p>
                <div className="mt-5 w-full space-y-2 rounded-2xl border border-hairline bg-surface-2 p-4 text-left text-[13px]">
                  <Row k="Plan" v={`${planLabel(store.pending.requested_plan)} · ${store.pending.billing_cycle}`} />
                  <Row k="Amount" v={peso(store.pending.amount_cents / 100)} />
                  <Row k="Reference" v={store.pending.gcash_reference} mono />
                  <Row
                    k="Submitted"
                    v={new Date(store.pending.created_at).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  />
                </div>
                <p className="mt-4 text-[12px] text-ink-subtle">
                  Already paid? No need to send again — we&apos;ve got it.
                </p>
              </div>
            )}

            {step === "maxed" && store && (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-tint text-brand-deep">
                  <Crown size={30} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">You&apos;re on Pro 🎉</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  <b>{store.business_name}</b> already has the top plan — everything
                  unlocked, unlimited. Nothing to upgrade!
                </p>
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-700">
                  <Check size={32} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">Payment submitted</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  We&apos;ll verify your reference and activate{" "}
                  <span className="font-semibold capitalize">{plan}</span> for{" "}
                  <span className="font-semibold">{store?.business_name}</span> within a
                  few hours. You&apos;ll see it in the app automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-subtle">
          <ShieldCheck size={12} /> Prestige IT Solutions · Manual verification
        </p>
      </div>
    </main>
  );
}

function Header({ step }: { step: Step }) {
  const done = step === "done";
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-deep text-white shadow-card">
        {done ? <Sparkles size={26} /> : <Store size={26} />}
      </span>
      <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-ink">
        Upgrade your store
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Pay with GCash · activated within a few hours
      </p>
    </div>
  );
}

function Steps({ current }: { current: "lookup" | "plan" | "pay" }) {
  const order = ["lookup", "plan", "pay"] as const;
  const labels = { lookup: "Store", plan: "Plan", pay: "Pay" };
  const idx = order.indexOf(current);
  return (
    <div className="flex items-center gap-2 border-b border-hairline bg-surface-2/50 px-6 py-3">
      {order.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
              i <= idx ? "bg-brand text-white" : "bg-surface-3 text-ink-subtle"
            }`}
          >
            {i < idx ? <Check size={11} /> : i + 1}
          </span>
          <span className={`text-[11px] font-semibold ${i <= idx ? "text-ink" : "text-ink-subtle"}`}>
            {labels[s]}
          </span>
          {i < order.length - 1 && <span className="h-px flex-1 bg-hairline" />}
        </div>
      ))}
    </div>
  );
}

function StoreBanner({ name, plan }: { name: string; plan: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3.5 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
        <Store size={17} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
        <p className="text-[11px] text-ink-muted">Currently on {planLabel(plan)}</p>
      </div>
    </div>
  );
}

function PlanCard({
  id,
  selected,
  onSelect,
}: {
  id: "basic" | "pro";
  selected: boolean;
  onSelect: () => void;
}) {
  const info = PLAN_INFO[id];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-brand bg-brand-tint/40 ring-2 ring-brand/30"
          : "border-hairline bg-surface-1 hover:border-brand-soft"
      }`}
    >
      {id === "pro" && (
        <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
            selected ? "border-brand bg-brand text-white" : "border-hairline"
          }`}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </span>
        <div>
          <p className="text-[15px] font-bold text-ink">{info.name}</p>
          <p className="text-[11px] text-ink-muted">{info.tag}</p>
        </div>
      </div>
      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 pl-7">
        {info.perks.map((p) => (
          <li key={p} className="flex items-center gap-1 text-[11px] text-ink-muted">
            <Check size={11} className="shrink-0 text-brand" /> {p}
          </li>
        ))}
      </ul>
    </button>
  );
}

function GcashQr() {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-hairline bg-surface-2 p-4 text-center text-[11px] text-ink-subtle">
        Scan-to-pay QR
        <br />
        (add public/gcash-qr.png)
      </div>
    );
  }
  return (
    <Image
      src="/gcash-qr.png"
      alt="GCash QR"
      width={208}
      height={208}
      onError={() => setBroken(true)}
      className="rounded-2xl border border-hairline"
    />
  );
}

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-surface-1 px-3 py-1 text-[14px] font-bold tracking-wide text-brand-deep shadow-sm"
    >
      {value} {copied ? <Check size={14} /> : <Copy size={13} />}
    </button>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-muted">{k}</span>
      <span className={`font-semibold text-ink ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
      {text}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Submit({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : label}
    </button>
  );
}
