"use client";

import { DoorOpen, MapPin, Coffee, Wifi, Baby } from "lucide-react";
import { InfiniteSlider } from "@/components/motion-primitives/infinite-slider";
import { branches } from "@/content/branches";
import { services, priceFor } from "@/content/services";
import { formatZar } from "@/lib/utils";

/**
 * SECTION 02 — TRUST BAR.
 *
 * Kills five objections in one viewport height — the highest return-per-pixel
 * element on the page. Every item is a reason someone would otherwise close the tab.
 *
 * All five facts come from the brand's own published copy: "WALK-IN FRIENDLY
 * BUSINESS", the eleven branches, and "great coffee, music, Wi-Fi". Nothing is
 * asserted that the business has not already asserted itself.
 *
 * Rendered as a motion-primitives InfiniteSlider. On desktop the five items sit
 * comfortably in a row, but on mobile they used to wrap into a ragged two-column
 * block — a marquee keeps them on one line at any width and reads as a ticker
 * rather than a broken grid. It pauses on hover so the text stays readable.
 */
export function TrustBar() {
  const schoolboy = services.find((s) => s.slug === "schoolboy-cut");
  const schoolboyPrice = schoolboy ? priceFor(schoolboy, "classic") : null;

  const items = [
    { Icon: DoorOpen, text: "Walk-in friendly" },
    { Icon: MapPin, text: `${branches.length} Winelands branches` },
    { Icon: Coffee, text: "Great coffee" },
    { Icon: Wifi, text: "Free Wi-Fi" },
    {
      Icon: Baby,
      text: schoolboyPrice
        ? `Schoolboy cuts from ${formatZar(schoolboyPrice)}`
        : "Schoolboy cuts",
    },
  ];

  return (
    <div className="border-y border-line bg-ink-raised py-5">
      {/* Full-bleed: a marquee constrained to the container would visibly
          restart at the edges instead of running off-screen. */}
      <InfiniteSlider gap={48} speed={26} speedOnHover={6}>
        {items.map(({ Icon, text }) => (
          <div
            key={text}
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-xs text-bone-dim md:text-sm"
          >
            <Icon aria-hidden className="h-4 w-4 shrink-0 text-brass-dim" />
            <span>{text}</span>
            <span aria-hidden className="ml-12 text-brass-dim/40">/</span>
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
