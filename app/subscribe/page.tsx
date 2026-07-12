"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestOtp } from "../login/actions";
import {
  lookupSubscription,
  createCheckout,
  createBranchCheckout,
  setCancel,
  type Store,
} from "./actions";

type PlanKey = "trial" | "basic" | "pro";
type PaidPlan = "basic" | "pro";
type Cycle = "monthly" | "yearly";
// identify → (code, only when not already signed in as that email) → plan
type Step = "identify" | "code" | "plan";

const RANK: Record<string, number> = { trial: 0, basic: 1, pro: 2 };

const PLANS: Record<
  PlanKey,
  {
    name: string;
    monthly: number;
    yearly: number;
    tagline: string;
    intro?: string;
    features: string[];
  }
> = {
  trial: {
    name: "Trial",
    monthly: 0,
    yearly: 0,
    tagline: "Free to explore Prestige POS.",
    features: [
      "Up to 20 items sold per day",
      "Sell screen, receipts & discounts",
      "Cash, GCash & QR Ph payments",
      "1 branch · 2 staff PINs",
      "Upgrade anytime",
    ],
  },
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
      "1 branch included, add more anytime",
      "Unlimited staff · Priority support",
    ],
  },
};

const peso = (n: number) => "₱" + n.toLocaleString("en-PH");
const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

export default function SubscribePage() {
  const supa = createClient();
  const [step, setStep] = useState<Step>("identify");
  const [storeCode, setStoreCode] = useState("");
  const [email, setEmail] = useState("");
  // Email of the browser's existing session (skips the OTP when it matches).
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [highlight, setHighlight] = useState<PaidPlan>("basic");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const [branchQty, setBranchQty] = useState(1);

  useEffect(() => {
    // Read the deep-link params, then CLEAN the URL — the address bar shows
    // a plain /subscribe from here on.
    const q = new URLSearchParams(window.location.search);
    const p = q.get("plan");
    if (p === "basic" || p === "pro") setHighlight(p);
    if (q.get("cancelled")) setCancelled(true);
    if (window.location.search) {
      window.history.replaceState({}, "", "/subscribe");
    }
    // Prefill the email from an existing portal session (no auto-jump — the
    // store code + email check always comes first).
    (async () => {
      const {
        data: { user },
      } = await supa.auth.getUser();
      if (user?.email) {
        setSessionEmail(user.email.toLowerCase());
        setEmail(user.email);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCheck = storeCode.trim().length >= 4 && email.includes("@");

  /** Step 1 — check the store code + email and show the current subscription. */
  async function check() {
    setErr(null);
    setStore(null);
    setBusy(true);
    const found = await lookupSubscription(storeCode, email);
    setBusy(false);
    if (!found) {
      setErr(
        "That store code and email don't match. Use the Store ID from the app " +
          "(Settings → Subscription) and the email you sign in with.",
      );
      return;
    }
    setStore(found);
  }

  /** Step 2 — manage: skip the OTP when the session already matches. */
  async function manage() {
    if (!store) return;
    setErr(null);
    if (sessionEmail && sessionEmail === email.trim().toLowerCase()) {
      setStep("plan");
      return;
    }
    setBusy(true);
    const res = await requestOtp(email.trim());
    setBusy(false);
    if (!res.ok) return setErr(res.error ?? "Could not send the code.");
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
    setBusy(false);
    if (error) {
      return setErr("That code didn't work. Please check and try again.");
    }
    setSessionEmail(email.trim().toLowerCase());
    setStep("plan");
  }

  /** Re-pull the summary after a plan action (cancel / keep). */
  async function refresh() {
    const found = await lookupSubscription(storeCode, email);
    if (found) setStore(found);
  }

  function changeStore() {
    setStore(null);
    setErr(null);
    setStep("identify");
  }

  async function pay(target: PaidPlan) {
    if (!store) return;
    setErr(null);
    setBusy(true);
    const res = await createCheckout({
      tenantId: store.tenant_id,
      plan: target,
      cycle,
    });
    if (res.url) {
      window.location.href = res.url;
      return;
    }
    setBusy(false);
    setErr(res.error ?? "Could not start checkout.");
  }

  async function payBranches() {
    if (!store) return;
    setErr(null);
    setBusy(true);
    const res = await createBranchCheckout({
      tenantId: store.tenant_id,
      qty: branchQty,
      cycle,
    });
    if (res.url) {
      window.location.href = res.url;
      return;
    }
    setBusy(false);
    setErr(res.error ?? "Could not start checkout.");
  }

  async function downgrade() {
    if (!store) return;
    setErr(null);
    setBusy(true);
    const res = await setCancel(store.tenant_id, true);
    if (!res.error) await refresh();
    setBusy(false);
    if (res.error) setErr(res.error);
  }

  async function keepPlan() {
    if (!store) return;
    setErr(null);
    setBusy(true);
    const res = await setCancel(store.tenant_id, false);
    if (!res.error) await refresh();
    setBusy(false);
    if (res.error) setErr(res.error);
  }

  const currentPlan: PlanKey = ((store?.plan as PlanKey) in RANK
    ? (store?.plan as PlanKey)
    : "trial") as PlanKey;
  const currentRank = RANK[currentPlan] ?? 0;
  const periodEnd = fmtDate(store?.current_period_end ?? null);
  const scheduledTrial = !!store?.cancel_at_period_end;

  const statusLine = !store
    ? ""
    : currentPlan === "trial"
      ? "Free plan. Upgrade anytime."
      : scheduledTrial
        ? `Reverts to Trial on ${periodEnd}. You keep ${PLANS[currentPlan].name} until then.`
        : periodEnd
          ? `Active until ${periodEnd}.`
          : "Active.";

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
        <header className="mb-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-deep">
            Prestige POS
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {step === "plan" ? "Your plan" : "Manage your subscription"}
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            {step === "plan"
              ? "Pick a plan and pay securely. Your store updates automatically."
              : "Enter your Store ID and email to check your current plan."}
          </p>
        </header>

        {cancelled && (
          <div className="mx-auto mb-5 max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Payment was cancelled. You can try again whenever you're ready.
          </div>
        )}

        {/* Step 1 — identify: store code + email, then the summary */}
        {step === "identify" && (
          <Card>
            <Label>Store ID</Label>
            <p className="mb-2 text-[13px] text-ink-muted">
              Find it in the app under <strong className="text-ink">Settings → Subscription</strong>.
            </p>
            <input
              autoFocus
              value={storeCode}
              onChange={(e) => {
                setStoreCode(e.target.value.toUpperCase());
                setStore(null);
              }}
              placeholder="PR-XXXXXX"
              className="field font-mono tracking-wider"
            />
            <div className="mt-4">
              <Label>Email</Label>
              <p className="mb-2 text-[13px] text-ink-muted">
                The email you sign in with on the Prestige POS app.
              </p>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStore(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && canCheck && check()}
                placeholder="you@example.com"
                className="field"
              />
            </div>
            {err && <ErrorText>{err}</ErrorText>}

            {!store && (
              <Button onClick={check} disabled={busy || !canCheck}>
                {busy ? "Checking…" : "Check subscription"}
              </Button>
            )}

            {/* Found — current subscription summary */}
            {store && (
              <div className="mt-5 rounded-xl border border-brand-soft bg-brand-tint/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-ink">
                      {store.business_name}
                    </p>
                    <p className="text-[12px] text-ink-subtle">
                      Store {store.store_code}
                    </p>
                  </div>
                  <PlanBadge plan={currentPlan} />
                </div>
                <p className="mt-2 text-[12.5px] text-ink-muted">
                  {PLANS[currentPlan].name} plan · {statusLine}
                </p>
                <button
                  onClick={manage}
                  disabled={busy}
                  className="mt-3 w-full rounded-full bg-brand py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-brand-deep disabled:opacity-40"
                >
                  {busy
                    ? "…"
                    : sessionEmail === email.trim().toLowerCase()
                      ? "Manage plan"
                      : "Continue — we'll email you a code"}
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Step 2 — code (only when the browser isn't signed in as that email) */}
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
                setStep("identify");
              }}
              className="mt-3 w-full text-center text-[13px] text-ink-muted hover:text-ink"
            >
              Back
            </button>
          </Card>
        )}

        {/* Step 3 — manage plan */}
        {step === "plan" && store && (
          <>
            {/* current plan banner */}
            <div className="mb-5 rounded-2xl border border-hairline bg-surface-1 p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-ink-muted">
                    {store.business_name}
                    <span className="ml-1.5 text-ink-subtle">
                      · Store {store.store_code}
                    </span>
                    <button
                      onClick={changeStore}
                      className="ml-2 text-brand-deep underline"
                    >
                      change
                    </button>
                  </p>
                  <p className="text-[15px] font-bold text-ink">
                    {PLANS[currentPlan].name} plan
                  </p>
                </div>
                <PlanBadge plan={currentPlan} />
              </div>
              <p className="mt-2 text-[12.5px] text-ink-muted">{statusLine}</p>
              {scheduledTrial && (
                <button
                  onClick={keepPlan}
                  disabled={busy}
                  className="mt-3 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-deep disabled:opacity-40"
                >
                  {busy ? "…" : `Keep my ${PLANS[currentPlan].name} plan`}
                </button>
              )}
            </div>

            {/* cycle toggle */}
            <div className="mb-5 flex items-center justify-center gap-2">
              <Toggle on={cycle === "monthly"} onClick={() => setCycle("monthly")}>
                Monthly
              </Toggle>
              <Toggle on={cycle === "yearly"} onClick={() => setCycle("yearly")}>
                Yearly · 2 months free
              </Toggle>
            </div>

            {err && <ErrorText>{err}</ErrorText>}

            {/* 3 tier cards */}
            <div className="grid gap-4 lg:grid-cols-3">
              {(["trial", "basic", "pro"] as PlanKey[]).map((key) => {
                const p = PLANS[key];
                const r = RANK[key];
                const isCurrent = key === currentPlan;
                const price = key === "trial" ? 0 : cycle === "monthly" ? p.monthly : p.yearly;
                const recommended = key === highlight && r > currentRank;

                // Decide the action for this card
                let cta: React.ReactNode = null;
                if (isCurrent) {
                  cta = <Ghost disabled>Current plan</Ghost>;
                } else if (key === "trial") {
                  // downgrade target (current is paid)
                  cta = scheduledTrial ? (
                    <Ghost disabled>Scheduled</Ghost>
                  ) : (
                    <Ghost onClick={downgrade} disabled={busy}>
                      Downgrade to Trial
                    </Ghost>
                  );
                } else if (r > currentRank) {
                  cta = (
                    <Primary onClick={() => pay(key as PaidPlan)} disabled={busy}>
                      {busy ? "…" : currentPlan === "trial" ? `Get ${p.name}` : `Upgrade to ${p.name}`}
                    </Primary>
                  );
                } else {
                  // lower paid tier than current (e.g. Pro → Basic)
                  cta = <Ghost disabled>Included in {PLANS[currentPlan].name}</Ghost>;
                }

                return (
                  <div
                    key={key}
                    className={`flex flex-col rounded-2xl border p-5 ${
                      isCurrent
                        ? "border-brand bg-brand-tint/30"
                        : recommended
                          ? "border-brand-soft bg-surface-1 ring-1 ring-brand/20"
                          : "border-hairline bg-surface-1"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-ink">{p.name}</h3>
                      {isCurrent && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-2">
                      <span className="text-2xl font-bold text-ink">
                        {key === "trial" ? "Free" : peso(price)}
                      </span>
                      {key !== "trial" && (
                        <span className="text-[12px] text-ink-subtle">
                          {" "}/ {cycle === "monthly" ? "month" : "year"}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-muted">{p.tagline}</p>
                    {p.intro && (
                      <p className="mt-3 text-[12px] font-semibold text-brand-deep">
                        {p.intro}
                      </p>
                    )}
                    <ul className="mt-2 flex-1 space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2 text-[12.5px] text-ink-muted">
                          <span className="text-brand">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5">{cta}</div>
                  </div>
                );
              })}
            </div>

            {currentPlan === "pro" && (
              <div className="mt-6 rounded-2xl border border-hairline bg-surface-1 p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-ink">
                      Additional branches
                    </h3>
                    <p className="mt-1 text-[12.5px] text-ink-muted">
                      Pro includes 1 branch. Add more locations, each billed{" "}
                      {cycle === "monthly" ? "monthly" : "yearly"}.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-deep">
                    Pro
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center rounded-full border border-hairline">
                    <button
                      onClick={() => setBranchQty((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-1.5 text-[16px] text-ink-muted hover:text-ink"
                      aria-label="Fewer branches"
                    >
                      −
                    </button>
                    <span className="min-w-[2ch] text-center text-[14px] font-semibold text-ink">
                      {branchQty}
                    </span>
                    <button
                      onClick={() => setBranchQty((q) => Math.min(20, q + 1))}
                      className="px-3.5 py-1.5 text-[16px] text-ink-muted hover:text-ink"
                      aria-label="More branches"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[13px] text-ink-muted">
                    <span className="font-semibold text-ink">
                      {peso((cycle === "monthly" ? 499 : 4990) * branchQty)}
                    </span>{" "}
                    / {cycle === "monthly" ? "month" : "year"}
                  </div>
                  <button
                    onClick={payBranches}
                    disabled={busy}
                    className="ml-auto rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-brand-deep disabled:opacity-40"
                  >
                    {busy
                      ? "…"
                      : `Add ${branchQty} branch${branchQty > 1 ? "es" : ""}`}
                  </button>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-[11px] text-ink-subtle">
              Secure checkout by PayMongo · cards, GCash, Maya. Upgrades apply now;
              downgrades take effect at the end of your paid period. No refunds.
            </p>
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

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    pro: "bg-brand text-white",
    basic: "bg-brand-tint text-brand-deep",
    trial: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        styles[plan] ?? "bg-surface-3 text-ink-muted"
      }`}
    >
      {plan}
    </span>
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
  return <p className="mb-3 mt-3 text-[13px] text-red-600">{children}</p>;
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
function Primary({
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
      className="w-full rounded-full bg-brand py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-brand-deep disabled:opacity-40"
    >
      {children}
    </button>
  );
}
function Ghost({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full border border-hairline bg-surface-1 py-2.5 text-[13.5px] font-semibold text-ink-muted transition enabled:hover:border-brand enabled:hover:text-ink disabled:opacity-60"
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
