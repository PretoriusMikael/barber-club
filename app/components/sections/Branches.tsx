"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { branches, towns } from "@/content/branches";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { BranchCard } from "@/components/sections/BranchCard";
import { ButtonLink } from "@/components/ui/Button";
import { track } from "@/lib/analytics";

/**
 * SECTION 08 — BRANCHES. Pure friction elimination.
 *
 * "Which one is nearest me?" is the second most common question on a
 * multi-branch site after "can I book", and the current site answers it with a
 * flat list of eleven names. Filtering by town cuts that to two or three cards
 * in one tap.
 *
 * Deliberately NOT geolocation-first: asking for location permission before
 * showing anything useful is a reliable way to lose people. Town filter first,
 * and geolocation can be layered on later as an enhancement.
 */
export function Branches({ limit }: { limit?: number }) {
  const [town, setTown] = useState<string>("all");

  const filtered = town === "all" ? branches : branches.filter((b) => b.town === town);
  const visible = limit ? filtered.slice(0, limit) : filtered;

  return (
    <Section id="branches" tone="raised">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            as={limit ? "h2" : "h1"}
            title="Eleven chairs' worth of Winelands."
            intro="Paarl, Stellenbosch, Wellington, Malmesbury, Durbanville and Franschhoek. Find the one on your way home."
          />
          {limit ? (
            <ButtonLink href="/branches" variant="ghost" size="sm" className="hidden md:inline-flex">
              All {branches.length} branches
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filter by town">
          {(["all", ...towns] as const).map((t) => {
            const count = t === "all" ? branches.length : branches.filter((b) => b.town === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTown(t);
                  track("branch_view", { town: t });
                }}
                aria-pressed={town === t}
                className={cn(
                  "h-9 rounded border px-4 text-xs uppercase tracking-wider transition-colors",
                  town === t
                    ? "border-brass bg-brass text-ink"
                    : "border-line text-bone-dim hover:border-bone/40 hover:text-bone"
                )}
              >
                {t === "all" ? "All" : t}
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((branch) => (
            <BranchCard key={branch.slug} branch={branch} />
          ))}
        </div>

        {limit && filtered.length > visible.length ? (
          <div className="mt-10">
            <ButtonLink href="/branches" variant="outline" size="lg">
              See all {branches.length} branches
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
