import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-card">
        {/* simple storefront glyph */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 9.5 5.2 5h13.6L20 9.5M4 9.5h16M4 9.5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9M9 19.5v-5h6v5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-ink">
        Prestige POS
      </span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-surface-1/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
          <a href="/#features" className="hover:text-ink">Features</a>
          <a href="/#philippines" className="hover:text-ink">BIR-ready</a>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <a href="mailto:hello@prestigeitsolutions.tech" className="hover:text-ink">Contact</a>
        </nav>
        <a
          href="mailto:hello@prestigeitsolutions.tech?subject=Prestige%20POS%20—%20Get%20started"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep"
        >
          Get started
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface-1">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              A fast, BIR-ready point-of-sale for Philippine cafés, restaurants,
              and shops — built by Prestige IT Solutions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-ink">Product</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li><a href="/#features" className="hover:text-ink">Features</a></li>
                <li><a href="/#philippines" className="hover:text-ink">BIR compliance</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink">Legal</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li><Link href="/terms" className="hover:text-ink">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-ink">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink">Contact</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li>
                  <a href="mailto:hello@prestigeitsolutions.tech" className="hover:text-ink">
                    hello@prestigeitsolutions.tech
                  </a>
                </li>
                <li>General Santos City, Philippines</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-hairline pt-6 text-xs text-ink-subtle">
          © {new Date().getFullYear()} Prestige IT Solutions. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
