import Link from "next/link";
import Image from "next/image";
import { LogOut, ChevronLeft } from "lucide-react";
import { signOut } from "@/app/portal-actions";
import { PlanBadge } from "./bits";

/** Sticky top bar for the admin + client portals. */
export function PortalHeader({
  title,
  subtitle,
  plan,
  back,
}: {
  title: string;
  subtitle?: string;
  plan?: string | null;
  back?: { href: string; label: string };
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface-1/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {back ? (
            <Link
              href={back.href}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-hairline bg-surface-1 text-ink"
              aria-label={back.label}
            >
              <ChevronLeft size={16} />
            </Link>
          ) : (
            <Image src="/app_icon.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-black/5" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{title}</p>
            {plan ? (
              <div className="mt-0.5">
                <PlanBadge plan={plan} />
              </div>
            ) : (
              subtitle && <p className="truncate text-[11px] text-ink-subtle">{subtitle}</p>
            )}
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-3 py-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
          >
            <LogOut size={14} /> Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
