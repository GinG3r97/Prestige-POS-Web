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
} from "lucide-react";
import { lookupStore, submitUpgrade, type StoreMatch } from "./actions";

// ⚠️ EDIT THESE with your real GCash details (and drop your QR image at
// public/gcash-qr.png). These are shown to the store owner to pay.
const GCASH_NAME = "Prestige IT Solutions";
const GCASH_NUMBER = "0916 685 6160";

const PRICES = {
  basic: { monthly: 499, yearly: 4990 },
  pro: { monthly: 1499, yearly: 14990 },
} as const;

const peso = (n: number) => "₱" + n.toLocaleString("en-PH");

type Step = "lookup" | "plan" | "pay" | "done";

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
    setStore(res.store);
    setStep("plan");
  }

  // If the app linked here with ?code=&email=, skip the typing step.
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
      setError(res.error ?? "Could not submit.");
      return;
    }
    setStep("done");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-2 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-card">
            <Store size={24} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
            Upgrade your store
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Pay with GCash. We activate within a few hours.
          </p>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface-1 p-6 shadow-card">
          {/* STEP 1 — identify store */}
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
                  className="w-full rounded-xl border border-hairline bg-surface-2 px-3 py-3 font-mono text-sm tracking-wider text-ink outline-none focus:border-brand"
                />
                <p className="mt-1.5 text-[11px] text-ink-subtle">
                  Find it in the app: Settings → Subscription.
                </p>
              </Field>
              <Field label="Owner email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@store.com"
                  required
                  className="w-full rounded-xl border border-hairline bg-surface-2 px-3 py-3 text-sm text-ink outline-none focus:border-brand"
                />
              </Field>
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <Submit busy={busy} label="Continue" />
            </form>
          )}

          {/* STEP 2 — pick plan */}
          {step === "plan" && store && (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-tint px-3 py-2.5 text-[13px] text-brand-deep">
                <span className="font-semibold">{store.business_name}</span> ·
                currently {store.plan === "trial" ? "Free" : store.plan}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["basic", "pro"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={`rounded-xl border p-3 text-left transition ${
                      plan === p
                        ? "border-brand bg-brand-tint/50"
                        : "border-hairline bg-surface-1 hover:border-brand-soft"
                    }`}
                  >
                    <p className="text-sm font-bold capitalize text-ink">{p}</p>
                    <p className="text-[11px] text-ink-muted">
                      {p === "basic" ? "Growing stores" : "Everything, unlimited"}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex rounded-full border border-hairline bg-surface-2 p-1">
                {(["monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`flex-1 rounded-full py-2 text-[13px] font-semibold capitalize transition ${
                      cycle === c ? "bg-brand text-white" : "text-ink-muted"
                    }`}
                  >
                    {c}
                    {c === "yearly" && (
                      <span className="ml-1 text-[10px] opacity-80">2 mo free</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-baseline justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-sm text-ink-muted">You&apos;ll pay</span>
                <span className="text-2xl font-semibold text-ink">{peso(price)}</span>
              </div>

              <button
                onClick={() => setStep("pay")}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep"
              >
                Continue to payment <ArrowRight size={15} />
              </button>
              <button
                onClick={() => setStep("lookup")}
                className="w-full text-center text-[13px] font-medium text-ink-muted"
              >
                Not your store? Change
              </button>
            </div>
          )}

          {/* STEP 3 — pay + reference */}
          {step === "pay" && (
            <form onSubmit={doSubmit} className="space-y-4">
              <div className="rounded-xl bg-surface-2 px-4 py-3 text-center">
                <p className="text-[12px] text-ink-muted">Send exactly</p>
                <p className="text-2xl font-semibold text-ink">{peso(price)}</p>
                <p className="text-[12px] text-ink-muted">to GCash · {GCASH_NAME}</p>
                <CopyRow value={GCASH_NUMBER} />
              </div>

              <div className="mx-auto w-48">
                <GcashQr />
              </div>

              <Field label="GCash reference number">
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. 0023 456 789012"
                  required
                  className="w-full rounded-xl border border-hairline bg-surface-2 px-3 py-3 text-sm text-ink outline-none focus:border-brand"
                />
                <p className="mt-1.5 text-[11px] text-ink-subtle">
                  From your GCash receipt — this is how we confirm your payment.
                </p>
              </Field>
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <Submit busy={busy} label="I've paid — submit" />
              <button
                type="button"
                onClick={() => setStep("plan")}
                className="w-full text-center text-[13px] font-medium text-ink-muted"
              >
                Back
              </button>
            </form>
          )}

          {/* STEP 4 — done */}
          {step === "done" && (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
                <Check size={28} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">Payment submitted</h2>
              <p className="mt-2 text-sm text-ink-muted">
                We&apos;ll verify your GCash reference and activate{" "}
                <span className="font-semibold capitalize">{plan}</span> for{" "}
                <span className="font-semibold">{store?.business_name}</span> within a
                few hours. You&apos;ll see it in the app automatically.
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-subtle">
          <ShieldCheck size={12} /> Prestige IT Solutions · Manual verification
        </p>
      </div>
    </main>
  );
}

function GcashQr() {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-2 p-4 text-center text-[11px] text-ink-subtle">
        Add your GCash QR at
        <br />
        public/gcash-qr.png
      </div>
    );
  }
  return (
    <Image
      src="/gcash-qr.png"
      alt="GCash QR"
      width={192}
      height={192}
      onError={() => setBroken(true)}
      className="rounded-xl border border-hairline"
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
      className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-deep"
    >
      {value} {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
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
