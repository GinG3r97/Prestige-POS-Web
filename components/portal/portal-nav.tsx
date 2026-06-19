"use client";

import Link from "next/link";
import { Home, Wallet, User } from "lucide-react";

/** Sticky bottom tab bar — the portal's primary navigation on phones. */
export function PortalNav({
  active,
  store,
}: {
  active: "home" | "payslips" | "profile";
  store: string | null;
}) {
  const q = store ? `?store=${encodeURIComponent(store)}` : "";
  const items = [
    { key: "home", label: "Home", icon: Home, href: `/portal${q}` },
    { key: "payslips", label: "Payslips", icon: Wallet, href: `/portal/payslips${q}` },
    { key: "profile", label: "Profile", icon: User, href: `/portal/profile${q}` },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface-1/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch pb-[env(safe-area-inset-bottom)]">
        {items.map((it) => {
          const on = it.key === active;
          const Icon = it.icon;
          return (
            <Link
              key={it.key}
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition active:scale-95 ${
                on ? "text-brand-deep" : "text-ink-subtle hover:text-ink-muted"
              }`}
            >
              <Icon size={22} strokeWidth={on ? 2.5 : 2} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
