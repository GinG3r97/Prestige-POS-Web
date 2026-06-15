"use client";

import { type ReactNode } from "react";
import { Check } from "lucide-react";
import { MobileCarousel } from "./mobile-carousel";

export type ShowSlide = {
  tag: string;
  title: string;
  body: string;
  points: string[];
  mockup: ReactNode;
};

/** Mobile-only swipeable slideshow of the five feature deep-dives. */
export function ShowcaseCarousel({ slides }: { slides: ShowSlide[] }) {
  return (
    <MobileCarousel
      counterNoun="Feature"
      hint="Swipe to explore"
      slides={slides.map((s) => (
        <div
          key={s.title}
          className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-card"
        >
          <div className="bg-gradient-to-br from-brand-tint/50 to-surface-1 p-5">
            <span className="inline-flex rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              {s.tag}
            </span>
            <h3 className="mt-3 text-[22px] font-semibold leading-snug tracking-tight text-ink">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
            <ul className="mt-3 grid gap-1.5">
              {s.points.map((pt) => (
                <li key={pt} className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-hairline bg-surface-2/40 p-4">{s.mockup}</div>
        </div>
      ))}
    />
  );
}
