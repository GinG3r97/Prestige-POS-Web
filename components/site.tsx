import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import { MobileNav } from "./mobile-nav";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/app_icon.png"
        alt="Prestige POS"
        width={36}
        height={36}
        priority
        className="h-9 w-9 rounded-xl shadow-card ring-1 ring-black/5"
      />
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
          <a href="/#pricing" className="hover:text-ink">Pricing</a>
          <a href="/#philippines" className="hover:text-ink">Built for PH</a>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <a href="mailto:hello@prestigeitsolutions.tech" className="hover:text-ink">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/#pricing"
            className="hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-deep md:inline-block"
          >
            Get started
          </a>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface-1">
      <div className="mx-auto max-w-6xl px-5 py-12">
        {/* Mobile footer — CTA, two link columns, and a contact card */}
        <div className="md:hidden">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            A fast, modern point-of-sale for Philippine cafés, restaurants, and
            shops, built by Prestige IT Solutions.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-deep">Product</p>
              <ul className="mt-3 space-y-2.5 text-ink-muted">
                <li><a href="/#features" className="hover:text-ink">Features</a></li>
                <li><a href="/#pricing" className="hover:text-ink">Pricing</a></li>
                <li><a href="/#faq" className="hover:text-ink">FAQ</a></li>
                <li><a href="/#philippines" className="hover:text-ink">Built for PH</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-deep">Legal</p>
              <ul className="mt-3 space-y-2.5 text-ink-muted">
                <li><Link href="/terms" className="hover:text-ink">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-ink">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-hairline bg-surface-2 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-deep">Contact</p>
            <a
              href="mailto:hello@prestigeitsolutions.tech"
              className="mt-3 flex items-center gap-2.5 text-sm text-ink"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-deep">
                <Mail size={15} />
              </span>
              hello@prestigeitsolutions.tech
            </a>
            <p className="mt-2.5 flex items-center gap-2.5 text-sm text-ink-muted">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-deep">
                <MapPin size={15} />
              </span>
              General Santos City, Philippines
            </p>
          </div>
        </div>

        {/* Desktop footer */}
        <div className="hidden justify-between gap-8 md:flex md:flex-row">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              A fast, modern point-of-sale for Philippine cafés, restaurants,
              and shops, built by Prestige IT Solutions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-ink">Product</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li><a href="/#features" className="hover:text-ink">Features</a></li>
                <li><a href="/#pricing" className="hover:text-ink">Pricing</a></li>
                <li><a href="/#faq" className="hover:text-ink">FAQ</a></li>
                <li><a href="/#philippines" className="hover:text-ink">Built for PH</a></li>
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
        <div className="mt-8 border-t border-hairline pt-6 text-center text-xs text-ink-subtle md:mt-10 md:text-left">
          © {new Date().getFullYear()} Prestige IT Solutions. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
