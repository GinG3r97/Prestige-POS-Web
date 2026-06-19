"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

/** Floating "back to top" button that fades in after scrolling down.
 *  On portal pages it sits ABOVE the bottom tab nav so it never overlaps it. */
export function ScrollTop() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  const onPortal = pathname?.startsWith("/portal") ?? false;

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={onPortal ? { bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)" } : undefined}
      className={`fixed right-5 z-50 grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-card transition-all hover:bg-brand-deep ${
        onPortal ? "" : "bottom-5"
      } ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <ArrowUp size={18} />
    </button>
  );
}
