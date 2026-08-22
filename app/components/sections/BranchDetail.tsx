"use client";

import { Navigation, Phone } from "lucide-react";
import { track } from "@/lib/analytics";
import { mapsUrlFor } from "@/lib/booking";
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
        className="inline-flex h-10 items-center gap-2 border border-bone/25 px-5 text-xs uppercase tracking-wide hover:border-bone/60"
      >
        <Navigation aria-hidden className="h-4 w-4" />
        Directions
      </a>
      <a
        href={`tel:${branch.phone.e164}`}
        onClick={() => track("phone_click", { location: "branch_page", branch: branch.slug })}
        className="inline-flex h-10 items-center gap-2 border border-bone/25 px-5 text-xs uppercase tracking-wide hover:border-bone/60"
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

      <p className="mt-3 text-xs text-bone-faint">
        The live badge above does not know which dates are public holidays — add a dated
        override list or pull hours from this branch&rsquo;s Google Business Profile, which
        already carries them.
      </p>
    </div>
  );
}
