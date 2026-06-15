"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Generic mobile-only swipeable slideshow. The viewport height tracks the
 * active slide, so short slides don't leave dead space before the dots.
 */
export function MobileCarousel({
  slides,
  counterNoun = "Slide",
  hint = "Swipe to explore",
}: {
  slides: ReactNode[];
  counterNoun?: string;
  hint?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [h, setH] = useState<number | undefined>(undefined);
  const total = slides.length;

  const syncHeight = (i: number) => {
    const el = slideRefs.current[i];
    if (el) setH(el.offsetHeight);
  };
  useEffect(() => {
    syncHeight(0);
    // re-measure once after fonts/mockups settle
    const t = setTimeout(() => syncHeight(0), 200);
    return () => clearTimeout(t);
  }, []);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) {
      setIdx(i);
      syncHeight(i);
    }
  };
  const go = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      {/* Progress header — numbered counter + step arrows */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-deep">
          {counterNoun} <span className="text-ink">{pad(idx + 1)}</span>
          <span className="text-ink-subtle"> / {pad(total)}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(idx - 1)}
            disabled={idx === 0}
            className="grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface-1 text-ink shadow-sm transition disabled:opacity-35"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(idx + 1)}
            disabled={idx === total - 1}
            className="grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface-1 text-ink shadow-sm transition disabled:opacity-35"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{ height: h }}
        className="-mx-5 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden transition-[height] duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((node, i) => (
          <div
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="w-full shrink-0 snap-center self-start px-5"
          >
            {node}
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="mt-5 flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-5 bg-brand" : "w-1.5 bg-brand-soft"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-ink-subtle">
        <ChevronLeft size={11} className="text-brand-soft" />
        {hint}
        <ChevronRight size={11} className="text-brand-soft" />
      </p>
    </div>
  );
}
