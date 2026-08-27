"use client";

import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { tierInfo, type Tier } from "@/content/services";

/**
 * Classic ↔ Premier switch.
 *
 * The two tiers are the single most important thing about Barber Club's offer
 * and the current site buries them on two separate, unlinked pages — you cannot
 * compare a Club Cut at R290 against R390 without opening two tabs. Putting them
 * side by side on one control is the biggest UX win available on the menu.
 *
 * Tier choice is also a booking-path fork: Classic is walk-in, Premier is
 * appointment-only. The toggle therefore changes the CTA, not just the prices.
 */
export function TierToggle({
  value,
  onChange,
  className,
}: {
  value: Tier;
  onChange: (tier: Tier) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex rounded border border-line bg-ink p-1", className)}
      role="tablist"
      aria-label="Service tier"
    >
      {(["classic", "premier"] as const).map((tier) => {
        const active = value === tier;
        return (
          <button
            key={tier}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onChange(tier);
              track("tier_toggle", { tier });
            }}
            className={cn(
              "rounded-sm px-5 py-2.5 text-xs uppercase tracking-[0.15em] transition-colors sm:px-7 sm:text-sm",
              active ? "bg-brass text-ink" : "text-bone-dim hover:text-bone"
            )}
          >
            {tierInfo[tier].label}
          </button>
        );
      })}
    </div>
  );
}

/** The one-line explanation of whichever tier is selected. */
export function TierBlurb({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <p className={cn("text-sm leading-relaxed text-bone-dim", className)}>
      <strong className="text-bone">{tierInfo[tier].tagline}</strong>{" "}
      {tierInfo[tier].description}
    </p>
  );
}
