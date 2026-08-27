"use client";

import { useState } from "react";
import { ExternalLink, Map, Navigation, Phone } from "lucide-react";
import { track } from "@/lib/analytics";
import { mapEmbedFor, mapsUrlFor } from "@/lib/booking";
import { hoursRows } from "@/lib/hours";
import { OpenNow } from "@/components/layout/OpenNow";
import type { Branch } from "@/content/branches";

/**
 * Client-side pieces of the branch page, split out so the page itself stays a
 * server component (and therefore ships no JS for its copy, headings or schema).
 */

export function BranchActions({ branch }: { branch: Branch }) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <a
        href={mapsUrlFor(branch)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("directions_click", { location: "branch_page", branch: branch.slug })}
        className="inline-flex h-10 items-center gap-2 rounded border border-bone/25 px-5 text-xs uppercase tracking-wide hover:border-bone/60"
      >
        <Navigation aria-hidden className="h-4 w-4" />
        Directions
      </a>
      <a
        href={`tel:${branch.phone.e164}`}
        onClick={() => track("phone_click", { location: "branch_page", branch: branch.slug })}
        className="inline-flex h-10 items-center gap-2 rounded border border-bone/25 px-5 text-xs uppercase tracking-wide hover:border-bone/60"
      >
        <Phone aria-hidden className="h-4 w-4" />
        Call this branch
      </a>
    </div>
  );
}

export function BranchHours({ branch }: { branch: Branch }) {
  const ph = branch.publicHolidays;

  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-brass-dim">
          Opening hours
        </h2>
        <OpenNow hours={branch.hours} />
      </div>

      <dl className="space-y-2 text-sm">
        {hoursRows(branch.hours).map((row) => (
          <div key={row.key} className="flex justify-between border-b border-line/60 pb-2">
            <dt className="text-bone-dim">{row.label}</dt>
            <dd className={row.value === "Closed" ? "text-bone-faint" : "text-bone"}>
              {row.value}
            </dd>
          </div>
        ))}
        <div className="flex justify-between pt-1">
          <dt className="text-bone-dim">Public holidays</dt>
          <dd className="text-bone">
            {ph.open && ph.close ? `${ph.open} – ${ph.close}` : "Closed"}
          </dd>
        </div>
      </dl>

    </div>
  );
}

/**
 * The map, loaded only when someone asks for it.
 *
 * A Google Maps iframe on every branch page is three problems in one: it pulls
 * a large third-party bundle into the critical path of eleven pages, it sets
 * Google's cookies before anyone has consented to anything (which is exactly
 * what the POPIA notice promises does not happen), and when it is blocked — a
 * corporate network, a strict tracking blocker, a laptop demoing the site
 * offline — the page renders a broken-document icon in a 440px hole.
 *
 * Click-to-load fixes all three. The panel below carries the address and the
 * two things people actually come to a branch page for (directions, phone), so
 * it is useful before anyone clicks; the iframe replaces it on request, in
 * place, at the same height so nothing shifts.
 *
 * No coordinates are published for any branch, so the embed falls back to an
 * address search. Supply `geo` per branch (PITCH-NOTES.md) and this drops a pin
 * on the door instead of on the street.
 */
export function BranchMap({ branch }: { branch: Branch }) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative h-[320px] overflow-hidden rounded-lg border border-line bg-ink-sunken md:h-[440px]">
      {shown ? (
        <iframe
          title={`Map showing Barber Club ${branch.name}`}
          src={mapEmbedFor(branch)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0 grayscale-[0.6] contrast-[1.1] invert-[0.92] hue-rotate-180"
          allowFullScreen
        />
      ) : (
        <div className="flex h-full flex-col items-start justify-end gap-4 p-6 md:p-8">
          {/* A faint grid, so the panel reads as "a map goes here" rather than
              as an empty box. Pure CSS — no image request, no third party. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #f4f1ea 1px, transparent 1px), linear-gradient(to bottom, #f4f1ea 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="relative">
            <Map aria-hidden className="h-6 w-6 text-brass" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-bone-dim">
              {branch.shortAddress}, {branch.town}
            </p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShown(true)}
              className="inline-flex h-10 items-center gap-2 rounded border border-bone/25 px-5 text-xs uppercase tracking-wide hover:border-bone/60"
            >
              Show map
            </button>
            <a
              href={mapsUrlFor(branch)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("directions_click", { location: "branch_page", branch: branch.slug })
              }
              className="inline-flex h-10 items-center gap-2 rounded border border-bone/25 px-5 text-xs uppercase tracking-wide hover:border-bone/60"
            >
              Open in Google Maps
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
