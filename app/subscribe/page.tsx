"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestOtp } from "../login/actions";
import { getMyStores, createCheckout, type Store } from "./actions";

type Plan = "basic" | "pro";
type Cycle = "monthly" | "yearly";
type Step = "loading" | "email" | "code" | "store" | "plan";

const PLANS: Record<
  Plan,
  {
    name: string;
    monthly: number;
    yearly: number;
    tagline: string;
    intro?: string;
    features: string[];
  }
> = {
  basic: {
    name: "Basic",
    monthly: 499,
    yearly: 4990,
    tagline: "For growing cafés and shops.",
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
  },
  pro: {
    name: "Pro",
    monthly: 1499,
    yearly: 14990,
    tagline: "Everything unlocked, unlimited.",
    intro: "Everything in Basic, plus:",
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
  },
};

const peso = (n: number) => "₱" + n.toLocaleString("en-PH");

export default function SubscribePage() {
  const supa = createClient();
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("basic");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  // Read ?plan / ?cancelled, and skip auth if already signed in.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get("plan");
    if (p === "basic" || p === "pro") setPlan(p);
    if (q.get("cancelled")) setCancelled(true);
    (async () => {
      const mine = await getMyStores();
      if (mine.length > 0) {
        setStores(mine);
        if (mine.length === 1) {
          setTenantId(mine[0].tenant_id);
          setStep("plan");
        } else {
          setStep("store");
        }
      } else {
        setStep("email");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode() {
    setErr(null);
    setBusy(true);
    const res = await requestOtp(email.trim());
    setBusy(false);
    if (!res.ok) {
      setErr(res.error ?? "Could not send the code.");
      return;
    }
    setStep("code");
  }

  async function verify() {
    setErr(null);
    setBusy(true);
    const { error } = await supa.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setBusy(false);
      setErr("That code didn't work. Please check and try again.");
      return;
    }
    const mine = await getMyStores();
    setBusy(false);
    setStores(mine);
    if (mine.length === 0) {
      setErr("This email isn't linked to a store yet. Use the email from your POS app.");
      setStep("email");
      return;
    }
    if (mine.length === 1) {
      setTenantId(mine[0].tenant_id);
      setStep("plan");
    } else {
      setStep("store");
    }
  }

  async function pay() {
    if (!tenantId) return;
    setErr(null);
    setBusy(true);
    const res = await createCheckout({ tenantId, plan, cycle });
    if (res.url) {
      window.location.href = res.url;
      return;
    }
    setBusy(false);
    setErr(res.error ?? "Could not start checkout.");
  }

  const store = stores.find((s) => s.tenant_id === tenantId) ?? null;

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <header className="mb-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-deep">
            Prestige POS
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Subscribe
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Pick a plan and pay securely. Your store upgrades automatically.
          </p>
        </header>

        {cancelled && step !== "loading" && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Payment was cancelled. You can try again whenever you're ready.
          </div>
        )}

        {step === "loading" && (
          <Card>
            <p className="py-10 text-center text-[14px] text-ink-muted">Loading…</p>
          </Card>
        )}

        {/* Step 1 — email */}
        {step === "email" && (
          <Card>
            <Label>Your email</Label>
            <p className="mb-3 text-[13px] text-ink-muted">
              Use the email you sign in with on the Prestige POS app. We'll send
              a 6-digit code.
            </p>
            <input
              type="email"
              inputMode="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email && sendCode()}
              placeholder="you@example.com"
              className="field"
            />
            {err && <ErrorText>{err}</ErrorText>}
            <Button onClick={sendCode} disabled={busy || !email.trim()}>
              {busy ? "Sending…" : "Send code"}
            </Button>
          </Card>
        )}

        {/* Step 2 — code */}
        {step === "code" && (
          <Card>
            <Label>Enter the code</Label>
            <p className="mb-3 text-[13px] text-ink-muted">
              We sent a 6-digit code to <strong className="text-ink">{email}</strong>.
            </p>
            <input
              inputMode="numeric"
              autoFocus
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
              placeholder="123456"
              className="field text-center text-lg tracking-[0.4em]"
            />
            {err && <ErrorText>{err}</ErrorText>}
            <Button onClick={verify} disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : "Verify"}
            </Button>
            <button
              onClick={() => {
                setCode("");
                setErr(null);
                setStep("email");
              }}
              className="mt-3 w-full text-center text-[13px] text-ink-muted hover:text-ink"
            >
              Use a different email
            </button>
          </Card>
        )}

        {/* Step 3 — choose store */}
        {step === "store" && (
          <Card>
            <Label>Choose the store to upgrade</Label>
            <div className="mt-3 space-y-2">
              {stores.map((s) => (
                <button
                  key={s.tenant_id}
                  onClick={() => {
                    setTenantId(s.tenant_id);
                    setStep("plan");
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface-1 px-4 py-3 text-left transition hover:border-brand"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-ink">
                      {s.business_name}
                    </p>
                    <p className="text-[12px] text-ink-subtle">
                      {s.store_code ? `Store ${s.store_code}` : "Store"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                    {s.plan}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 4 — plans + pay */}
        {step === "plan" && (
          <>
            {store && (
              <p className="mb-4 text-center text-[13px] text-ink-muted">
                Upgrading{" "}
                <strong className="text-ink">{store.business_name}</strong>
                {stores.length > 1 && (
                  <button
                    onClick={() => setStep("store")}
                    className="ml-2 text-brand-deep underline"
                  >
                    change
                  </button>
                )}
              </p>
            )}

            {/* cycle toggle */}
            <div className="mb-5 flex items-center justify-center gap-2">
              <Toggle on={cycle === "monthly"} onClick={() => setCycle("monthly")}>
                Monthly
              </Toggle>
              <Toggle on={cycle === "yearly"} onClick={() => setCycle("yearly")}>
                Yearly · 2 months free
              </Toggle>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(["basic", "pro"] as Plan[]).map((key) => {
                const p = PLANS[key];
                const price = cycle === "monthly" ? p.monthly : p.yearly;
                const on = plan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPlan(key)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      on
                        ? "border-brand bg-brand-tint/40 ring-1 ring-brand/30"
                        : "border-hairline bg-surface-1 hover:border-brand-soft"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-ink">{p.name}</h3>
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border ${
                          on ? "border-brand bg-brand text-white" : "border-hairline"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                    </div>
                    <p className="mt-2">
                      <span className="text-2xl font-bold text-ink">
                        {peso(price)}
                      </span>
                      <span className="text-[12px] text-ink-subtle">
                        {" "}
                        / {cycle === "monthly" ? "month" : "year"}
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] text-ink-muted">{p.tagline}</p>
                    {p.intro && (
                      <p className="mt-3 text-[12px] font-semibold text-brand-deep">
                        {p.intro}
                      </p>
                    )}
                    <ul className="mt-2 space-y-1.5">
                      {p.features.map((f) => (
                        <li
                          key={f}
                          className="flex gap-2 text-[12.5px] text-ink-muted"
                        >
                          <span className="text-brand">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {err && <ErrorText>{err}</ErrorText>}

            <div className="mt-6 rounded-2xl border border-hairline bg-surface-1 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-ink-muted">
                  {PLANS[plan].name} · {cycle === "monthly" ? "Monthly" : "Yearly"}
                </span>
                <span className="text-lg font-bold text-ink">
                  {peso(cycle === "monthly" ? PLANS[plan].monthly : PLANS[plan].yearly)}
                </span>
              </div>
              <Button onClick={pay} disabled={busy || !tenantId}>
                {busy ? "Starting checkout…" : `Pay with PayMongo`}
              </Button>
              <p className="mt-3 text-center text-[11px] text-ink-subtle">
                Secure checkout by PayMongo · cards, GCash, Maya. Cancel anytime.
              </p>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .field {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #fff;
          padding: 12px 14px;
          font-size: 15px;
          color: #151515;
          outline: none;
        }
        .field:focus {
          border-color: #b7976e;
          box-shadow: 0 0 0 3px rgba(183, 151, 110, 0.15);
        }
      `}</style>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-hairline bg-surface-1 p-6 shadow-card">
      {children}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-wide text-ink">
      {children}
    </p>
  );
}
function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[13px] text-red-600">{children}</p>;
}
function Button({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-4 w-full rounded-full bg-brand py-3 text-[14px] font-semibold text-white transition hover:bg-brand-deep disabled:opacity-40"
    >
      {children}
    </button>
  );
}
function Toggle({
  children,
  on,
  onClick,
}: {
  children: React.ReactNode;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold transition ${
        on
          ? "border-brand bg-brand text-white"
          : "border-hairline bg-surface-1 text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
