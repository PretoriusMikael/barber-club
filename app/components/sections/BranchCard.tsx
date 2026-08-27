"use client";

import Link from "next/link";
import { MapPin, Phone, Navigation, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { mapsUrlFor } from "@/lib/booking";
import { compactHoursRows } from "@/lib/hours";
import { OpenNow } from "@/components/layout/OpenNow";
import type { Branch } from "@/content/branches";

/**
 * One branch, everywhere it appears.
 *
 * Carries the four things that decide whether someone actually turns up:
 * address, whether it is open right now, a tap-to-call, and directions. A
 * directions click is high intent — it usually precedes a walk-in, which for a
 * walk-in-friendly chain is a conversion, not a vanity metric.
 */
export function BranchCard({ branch, className }: { branch: Branch; className?: string }) {
  const hours = compactHoursRows(branch.hours);

  return (
    <article
      className={cn(
        // `card-lift` rather than `transition-colors`: this card carries a
        // phone number and a directions link, so it responds to the pointer
        // like the service cards do. Eleven of them in a grid is exactly where
        // an inconsistent hover would show.
        "surface card-lift flex h-full flex-col rounded border border-line bg-ink-raised p-5 hover:border-bone/25",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brass-dim">{branch.town}</p>
          <h3 className="mt-1.5 font-display text-2xl leading-tight tracking-wide">
            {branch.name.split("—")[1]?.trim() ?? branch.name}
          </h3>
        </div>
        {/* No badge while the tier is unconfirmed. The Classic/Premier split is
            not published anywhere on the current site (see content/branches.ts
            and PITCH-NOTES.md) — and a customer-facing "Tier TBC" chip answers
            a question the customer never asked with a note meant for us. The
            badge returns, per branch, the moment the mapping is supplied. */}
        {branch.tier !== "unconfirmed" ? (
          <span className="shrink-0 rounded-sm border border-brass/40 px-2 py-1 text-[10px] uppercase tracking-wider text-brass">
            {branch.tier}
          </span>
        ) : null}
      </div>

      <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-bone-dim">
        <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brass-dim" />
        {branch.shortAddress}
      </p>

      <div className="mt-4">
        <OpenNow hours={branch.hours} />
      </div>

      <dl className="mt-4 space-y-1 border-t border-line pt-4 text-xs">
        {hours.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-bone-faint">{row.label}</dt>
            <dd className={row.value === "Closed" ? "text-bone-faint" : "text-bone-dim"}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-1 items-end gap-2">
        <a
          href={`tel:${branch.phone.e164}`}
          onClick={() => track("phone_click", { location: "branches", branch: branch.slug })}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-bone/20 text-xs uppercase tracking-wide hover:border-bone/50"
        >
          <Phone aria-hidden className="h-3.5 w-3.5" />
          Call
        </a>
        <a
          href={mapsUrlFor(branch)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("directions_click", { location: "branches", branch: branch.slug })}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-bone/20 text-xs uppercase tracking-wide hover:border-bone/50"
        >
          <Navigation aria-hidden className="h-3.5 w-3.5" />
          Directions
        </a>
        <Link
          href={`/branches/${branch.slug}`}
          onClick={() => track("branch_select", { branch: branch.slug })}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-bone/20 hover:border-bone/50"
          aria-label={`More about ${branch.name}`}
        >
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
