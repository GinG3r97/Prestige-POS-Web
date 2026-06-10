"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#philippines", label: "Built for PH" },
  { href: "/privacy", label: "Privacy" },
  { href: "mailto:hello@prestigeitsolutions.tech", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-hairline bg-surface-1 text-ink"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-hairline bg-surface-1/95 px-5 pb-5 pt-2 shadow-card backdrop-blur">
          <nav className="flex flex-col">
            {links.map((l) =>
              l.href.startsWith("/") && !l.href.includes("#") ? (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-hairline/60 py-3.5 text-[15px] font-medium text-ink"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-hairline/60 py-3.5 text-[15px] font-medium text-ink"
                >
                  {l.label}
                </a>
              )
            )}
            <a
              href="/#pricing"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white shadow-card"
            >
              Get started
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
