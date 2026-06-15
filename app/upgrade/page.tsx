"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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
    <Suspense fallback={<main className="min-h-dvh bg-brand-deep" />}>
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
    <main className="flex min-h-dvh items-center justify-center bg-brand-deep px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/app_icon.png"
            alt="Prestige POS"
            width={56}
            height={56}
            priority
            className="h-14 w-14 rounded-2xl shadow-lg ring-1 ring-white/15"
          />
          <h1 className="mt-4 text-[28px] font-bold tracking-tight text-white">
            Upgrade your store
          </h1>
          <p className="mt-1.5 text-sm text-brand-soft">
            Pay with GCash · activated within a few hours
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-surface-1 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]">
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
                    className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-4 py-3.5 font-mono text-sm font-semibold tracking-widest text-ink outline-none transition focus:border-brand"
                  />
                  <p className="mt-1.5 text-[12px] text-ink-muted">
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
                    className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand"
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
                    <PlanCard key={p} id={p} selected={plan === p} onSelect={() => setPlan(p)} />
                  ))}
                </div>

                <div className="flex rounded-full bg-surface-3 p-1">
                  {(["monthly", "yearly"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCycle(c)}
                      className={`flex-1 rounded-full py-2.5 text-[13px] font-bold capitalize transition ${
                        cycle === c ? "bg-brand text-white shadow-card" : "text-ink-muted"
                      }`}
                    >
                      {c}
                      {c === "yearly" && (
                        <span className="ml-1 text-[10px] font-bold text-green-600">save 2 mo</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-end justify-between rounded-2xl bg-brand-deep px-5 py-4 text-white">
                  <div>
                    <p className="text-[12px] font-semibold text-brand-soft">{planLabel(plan)} · {cycle}</p>
                    <p className="text-[11px] text-brand-soft/80">billed {cycle === "yearly" ? "yearly" : "monthly"}</p>
                  </div>
                  <span className="text-[30px] font-bold leading-none tracking-tight">{peso(price)}</span>
                </div>

                <Submit busy={false} label="Continue to payment" onClick={() => setStep("pay")} />
                <TextLink onClick={() => setStep("lookup")}>Not your store? Change</TextLink>
              </div>
            )}

            {step === "pay" && (
              <form onSubmit={doSubmit} className="space-y-4">
                <div className="rounded-2xl bg-brand-deep p-5 text-center text-white">
                  <p className="text-[12px] font-semibold text-brand-soft">Send exactly</p>
                  <p className="text-[34px] font-bold leading-tight tracking-tight">{peso(price)}</p>
                  <p className="mt-0.5 text-[12px] text-brand-soft">via GCash to {GCASH_NAME}</p>
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
                    className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand"
                  />
                  <p className="mt-1.5 text-[12px] text-ink-muted">
                    From your GCash receipt — this is how we confirm your payment.
                  </p>
                </Field>
                {error && <ErrorLine text={error} />}
                <Submit busy={busy} label="I've paid — submit" />
                <TextLink onClick={() => setStep("plan")}>Back</TextLink>
              </form>
            )}

            {step === "status" && store?.pending && (
              <div className="text-center">
                <Pill className="bg-amber-100 text-amber-700">Under review</Pill>
                <h2 className="mt-3 text-xl font-bold text-ink">Payment received</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  We&apos;re verifying your payment for <b className="text-ink">{store.business_name}</b>.
                  Your plan activates within a few hours.
                </p>
                <div className="mt-5 space-y-2.5 rounded-2xl bg-surface-2 p-4 text-left text-[13px]">
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
              <div className="text-center">
                <Pill className="bg-brand text-white">Pro</Pill>
                <h2 className="mt-3 text-xl font-bold text-ink">You&apos;re on the top plan</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  <b className="text-ink">{store.business_name}</b> already has everything
                  unlocked, unlimited. Nothing to upgrade!
                </p>
              </div>
            )}

            {step === "done" && (
              <div className="text-center">
                <Pill className="bg-green-100 text-green-700">Submitted</Pill>
                <h2 className="mt-3 text-xl font-bold text-ink">All set</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  We&apos;ll verify your reference and activate{" "}
                  <span className="font-semibold capitalize text-ink">{plan}</span> for{" "}
                  <b className="text-ink">{store?.business_name}</b> within a few hours.
                  You&apos;ll see it in the app automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-brand-soft/70">
          Prestige IT Solutions · Manual verification
        </p>
      </div>
    </main>
  );
}

function Steps({ current }: { current: "lookup" | "plan" | "pay" }) {
  const order = ["lookup", "plan", "pay"] as const;
  const labels = { lookup: "Store", plan: "Plan", pay: "Pay" };
  const idx = order.indexOf(current);
  return (
    <div className="flex items-center gap-2 bg-surface-3 px-6 py-3">
      {order.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
              i <= idx ? "bg-brand text-white" : "bg-surface-1 text-ink-subtle"
            }`}
          >
            {i + 1}
          </span>
          <span className={`text-[11px] font-bold ${i <= idx ? "text-ink" : "text-ink-subtle"}`}>
            {labels[s]}
          </span>
          {i < order.length - 1 && <span className="h-0.5 flex-1 rounded bg-hairline" />}
        </div>
      ))}
    </div>
  );
}

function StoreBanner({ name, plan }: { name: string; plan: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-3">
      <p className="truncate text-[15px] font-bold text-ink">{name}</p>
      <p className="text-[12px] font-medium text-ink-muted">Currently on {planLabel(plan)}</p>
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
      className={`relative w-full rounded-2xl border-2 p-4 text-left transition ${
        selected ? "border-brand bg-brand-tint/50" : "border-hairline bg-surface-1 hover:border-brand-soft"
      }`}
    >
      {id === "pro" && (
        <span className="absolute right-3 top-3.5 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span
          className={`h-5 w-5 shrink-0 rounded-full border-2 ${
            selected ? "border-[6px] border-brand bg-surface-1" : "border-hairline"
          }`}
        />
        <div>
          <p className="text-[16px] font-bold text-ink">{info.name}</p>
          <p className="text-[11px] font-medium text-ink-muted">{info.tag}</p>
        </div>
      </div>
      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 pl-7">
        {info.perks.map((p) => (
          <li key={p} className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
            <span className="h-1 w-1 shrink-0 rounded-full bg-brand" /> {p}
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
      <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-hairline bg-surface-2 p-4 text-center text-[11px] font-medium text-ink-subtle">
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
      className="rounded-2xl border-2 border-hairline"
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
      className="mt-2 inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-[15px] font-bold tracking-wide text-white"
    >
      {copied ? "Copied ✓" : value}
    </button>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-ink-muted">{k}</span>
      <span className={`font-bold text-ink ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{text}</p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function TextLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full text-center text-[13px] font-semibold text-ink-muted hover:text-ink">
      {children}
    </button>
  );
}

function Submit({
  busy,
  label,
  onClick,
}: {
  busy: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : label}
    </button>
  );
}
