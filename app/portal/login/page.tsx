"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { requestPortalOtp } from "./actions";

export default function PortalLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await requestPortalOtp(email);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setBusy(false);
      setError("That code didn't match. Try again.");
      setCode("");
      return;
    }
    // Carry the store scope (from the QR) through the login round-trip.
    const store = new URLSearchParams(window.location.search).get("store");
    router.replace(store ? `/portal?store=${encodeURIComponent(store)}` : "/portal");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-deep px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/app_icon.png" alt="" width={52} height={52} priority className="h-[52px] w-[52px] rounded-2xl shadow-card ring-1 ring-white/10" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Staff Portal</h1>
          <p className="mt-1 text-sm text-brand-soft">
            {step === "email" ? "Sign in with your work email." : "Enter the 6-digit code we emailed you."}
          </p>
        </div>

        <div className="rounded-3xl bg-surface-1 p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]">
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Work email</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border-2 border-hairline bg-surface-2 px-3 focus-within:border-brand">
                  <Mail size={16} className="text-ink-subtle" />
                  <input type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
                    className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-subtle" />
                </div>
              </label>
              {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
              <button type="submit" disabled={busy}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <>Send code <ArrowRight size={15} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <input inputMode="numeric" autoFocus required maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••"
                className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] text-ink outline-none focus:border-brand" />
              <p className="text-[12px] text-ink-subtle">Sent to {email}</p>
              {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
              <button type="submit" disabled={busy || code.length < 6}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Verify & continue"}
              </button>
              <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }}
                className="w-full text-center text-[13px] font-medium text-ink-muted">Use a different email</button>
            </form>
          )}
        </div>
        <p className="mt-5 text-center text-[11px] text-brand-soft/70">Prestige POS · Staff Portal</p>
      </div>
    </main>
  );
}
