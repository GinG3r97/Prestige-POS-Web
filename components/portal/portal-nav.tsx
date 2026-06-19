"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Home, CalendarClock, Wallet, User, Loader2 } from "lucide-react";

/** Sticky bottom tab bar — the portal's primary navigation on phones.
 *  Taps navigate via a transition so we can show a top progress bar + a spinner
 *  on the tapped tab while the next page loads. */
export function PortalNav({
  active,
  store,
}: {
  active: "home" | "attendance" | "payslips" | "profile";
  store: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pending, setPending] = useState<string | null>(null);
  const q = store ? `?store=${encodeURIComponent(store)}` : "";
  const items = [
    { key: "home", label: "Home", icon: Home, href: `/portal${q}` },
    { key: "attendance", label: "Attendance", icon: CalendarClock, href: `/portal/attendance${q}` },
    { key: "payslips", label: "Payslips", icon: Wallet, href: `/portal/payslips${q}` },
    { key: "profile", label: "Profile", icon: User, href: `/portal/profile${q}` },
  ] as const;

  function go(href: string, key: string) {
    if (key === active || isPending) return;
    setPending(key);
    startTransition(() => router.push(href));
  }

  return (
    <>
      {/* Indeterminate top progress bar while a page loads */}
      {isPending && (
        <div className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden bg-brand/15">
          <div className="h-full w-1/3 rounded-full bg-brand" style={{ animation: "portalbar 0.9s ease-in-out infinite" }} />
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface-1/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-stretch pb-[env(safe-area-inset-bottom)]">
          {items.map((it) => {
            const on = it.key === active;
            const loading = isPending && pending === it.key;
            const Icon = loading ? Loader2 : it.icon;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => go(it.href, it.key)}
                aria-current={on ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition active:scale-95 ${
                  on ? "text-brand-deep" : "text-ink-subtle hover:text-ink-muted"
                }`}
              >
                <Icon size={22} strokeWidth={on ? 2.5 : 2} className={loading ? "animate-spin" : ""} />
                {it.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
