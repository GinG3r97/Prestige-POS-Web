"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setBusy(false);
      setError("Wrong email or password.");
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-deep text-white shadow-card">
            <ShieldCheck size={24} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Admin sign-in</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Provider access to all client stores.</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-hairline bg-surface-1 p-6 shadow-card"
        >
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Email</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-hairline bg-surface-2 px-3 focus-within:border-brand">
              <Mail size={16} className="text-ink-subtle" />
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@prestigeitsolutions.tech"
                className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Password</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-hairline bg-surface-2 px-3 focus-within:border-brand">
              <Lock size={16} className="text-ink-subtle" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </div>
          </label>

          {error && <p className="text-[13px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-ink-subtle">
          Store owner?{" "}
          <a href="/login" className="font-semibold text-brand-deep underline underline-offset-2">
            Sign in here
          </a>
        </p>
      </div>
    </main>
  );
}
