"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  featuredServices,
  priceFor,
  services,
  tierInfo,
  type Service,
  type Tier,
} from "@/content/services";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { TierToggle, TierBlurb } from "@/components/sections/TierToggle";
import { cn, priceLabel } from "@/lib/utils";
import { Price } from "@/components/ui/Price";

/**
 * SECTION 03 — SERVICES, price-anchored and tier-aware.
 *
 * Publishing prices is a conversion lever, not a risk — and Barber Club already
 * publishes them, so the rebuild loses nothing by keeping them and gains the
 * side-by-side tier comparison the current site cannot do.
 *
 * Premier-only services (The Godfather Cut) simply disappear in Classic rather
 * than showing a disabled state — a menu should never advertise something you
 * cannot order.
 */
export function Services() {
  const [tier, setTier] = useState<Tier>("classic");
  const visible = featuredServices.filter((s) => priceFor(s, tier) !== null);

  /* The menu tile is always the last cell, so whether it lands mid-row or
     alone on a new one depends entirely on how many services the current tier
     offers — and the two tiers do not offer the same number. Classic shows
     five and the tile completes a tidy two-by-three; Premier shows six, which
     pushes the tile onto a third row where it sat by itself with two thirds of
     the row empty beside it. Nobody would design that on purpose, which is
     exactly how it read.
     Rather than hard-code around today's counts, ask the arithmetic: if the
     cells do not divide by the column count, the last one is alone, and a cell
     that is alone on its row spans the row. */
  const cellCount = visible.length + 1;
  const wideAtSm = cellCount % 2 === 1;
  const wideAtLg = cellCount % 3 === 1;

  return (
    <Section id="services">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          {/* Was also "Two ways to sit down." — the exact same sentence the
              TierScroll section three screens below uses as ITS headline. Two
              identical h2s on one page is not a motif, it is a page that has
              lost track of what each section is for. This one owns the menu and
              the prices; that one owns the choice between the tiers. */}
          <SectionHeading
            title="Every cut, and what it costs."
            intro="Classic is walk-in and sharply priced. Premier is by appointment, with the time and the finish to match. Same barbers, same standard."
          />
        </div>

        <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-center">
          <TierToggle value={tier} onChange={setTier} />
          <TierBlurb tier={tier} className="max-w-xl" />
        </div>

        {/* Six featured services in Classic, five in Premier-only terms — The
            Godfather Cut simply does not exist at a Classic branch, so the grid
            is sometimes odd-numbered and a three-column row would end on a
            hole. The last cell is therefore always the menu tile: it fills the
            gap when there is one, and when there is not it becomes a sixth
            card that happens to be a call to action. Better than a gap, and
            better than padding the row with a service nobody searches for. */}
        <Reveal
          key={tier}
          staggerChildren
          stagger={60}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((service) => (
            <RevealItem key={service.slug}>
              <ServiceCard service={service} tier={tier} />
            </RevealItem>
          ))}
          <RevealItem className={cn(wideAtSm && "sm:col-span-2", wideAtLg && "lg:col-span-3")}>
            <FullMenuCard
              count={services.length - visible.length}
              wideAtSm={wideAtSm}
              wideAtLg={wideAtLg}
            />
          </RevealItem>
        </Reveal>

        {/* One ask, not three. This section used to offer "Full menu & pricing"
            beside the heading, "See the full menu" down here, AND a menu card in
            the grid — three routes to one page, competing with the actual
            conversion CTA. The card keeps the job, and what is left below is the
            single thing we want the visitor to do next. */}
        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          {tier === "premier" ? (
            <BookButton location="services" size="lg">
              Book Premier
            </BookButton>
          ) : (
            <ButtonLink href="/branches" variant="primary" size="lg">
              Find your nearest branch
            </ButtonLink>
          )}
        </div>

        <p className="mt-5 text-xs text-bone-faint">
          {tier === "classic"
            ? `${tierInfo.classic.label}: no appointment needed — just walk in.`
            : `${tierInfo.premier.label}: appointment only.`}
        </p>
      </Container>
    </Section>
  );
}

/**
 * One service, priced.
 *
 * There is no photograph on this card and that is a decision, not a gap. The
 * service photography does not exist yet (the briefs live in
 * content/services.ts and the shot list is in PITCH-NOTES.md), and the honest
 * options were a dashed production placeholder taking half the card, a stock
 * photo, or no picture at all. A menu card's job is name → price → what you
 * get, and it does that job better as type than as a small crop of somebody's
 * hairline. The price moves up to display size to take the weight the image
 * used to carry.
 *
 * When the shoot lands, an <AssetFrame> at the top of this card is a two-line
 * change and the layout below it is unaffected.
 */
function ServiceCard({ service, tier }: { service: Service; tier: Tier }) {
  const price = priceFor(service, tier);
  const other = priceFor(service, tier === "classic" ? "premier" : "classic");
  const otherTier = tier === "classic" ? "Premier" : "Classic";

  return (
    /* `relative` is load-bearing: the Details link stretches to the card's
       bounds with `after:inset-0`, so the whole card is one target. It used to
       be a 60px word in the bottom corner of a 430×250 panel that visibly
       responded to the pointer across its whole area — a card that lights up
       under the cursor is promising a click, and this one only kept the
       promise in one corner. */
    <article className="surface card-lift group relative flex h-full flex-col rounded border border-line bg-ink-raised p-6 hover:border-bone/25 sm:p-7">
      {/* NAME · · · · · · PRICE — one line, not two objects in two corners.
          `items-end` rather than `items-baseline` because both sides are
          `leading-none` display caps with no descenders to speak of, and a
          name that wraps to two lines then hangs its LAST line off the price
          rather than its first, which is how a menu row behaves. */}
      <div className="flex items-end gap-3">
        <h3 className="font-display text-2xl leading-none tracking-wide">{service.name}</h3>
        <span aria-hidden className="menu-leader" />
        <Price value={price} className="tnum shrink-0 font-display text-2xl leading-none text-bone" />
      </div>

      {/* `text-pretty` because these are two- and three-line paragraphs in a
          narrow measure, which is exactly where a last line of one orphaned
          word happens — and six cards side by side make one bad rag obvious. */}
      <p className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-bone-dim">
        {service.blurb}
      </p>

      {/* The cross-tier price is the upsell, and it used to be the quietest
          thing on the card — "Premier R 390" as one undifferentiated grey
          string, lighter than the blurb above it. Splitting it into a labelled
          value gives it the structure it always had: which tier, then what it
          costs there. */}
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
        {other === null ? (
          <span className="text-[10px] uppercase tracking-[0.18em] text-brass-dim">
            Premier only
          </span>
        ) : (
          <span className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-brass-dim">
              {otherTier}
            </span>
            <span className="tnum text-sm text-bone-dim">{priceLabel(other)}</span>
          </span>
        )}
        <Link
          href={`/services#${service.slug}`}
          className="stretch-link inline-flex items-center gap-1.5 rounded-sm text-xs uppercase tracking-wider text-bone-dim transition-colors after:absolute after:inset-0 after:rounded group-hover:text-brass"
        >
          Details
          <ArrowUpRight
            aria-hidden
            className="h-3.5 w-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  );
}

/**
 * The last cell of the grid: the rest of the menu, as a card.
 *
 * It has to read as "one of these, but the one that goes somewhere" — and it
 * was overshooting that by a mile. A full `brass-rule` border around a
 * brass-washed fill made the sixth cell the loudest object in a six-card grid,
 * so the eye landed on the overflow link before it had read a single price.
 *
 * The signal is now carried by the parts that are already brass for a reason —
 * the CTA line and the arrow — with the border a dimmed version of the same
 * hairline the other five wear. It still reads as different at a glance. It no
 * longer reads as more important than the menu it is a footnote to.
 */
function FullMenuCard({
  count,
  wideAtSm,
  wideAtLg,
}: {
  count: number;
  /** Alone on its row at this breakpoint, so it spans the row. */
  wideAtSm: boolean;
  wideAtLg: boolean;
}) {
  return (
    <article
      className={cn(
        "surface card-lift group relative flex h-full flex-col justify-between rounded border border-brass-rule/60 bg-brass/[0.02] p-6 hover:border-brass/45 sm:p-7",
        // Spanning the row is only half the fix. A card built for a 430px
        // column, stretched to 1360px, is a heading and two lines of type
        // huddled at one end of an empty band — so when it goes wide it also
        // goes horizontal, and the call to action moves to the far end where
        // the eye finishes the line.
        wideAtSm && "sm:flex-row sm:items-center sm:gap-10",
        wideAtLg && "lg:flex-row lg:items-center lg:gap-10"
      )}
    >
      <div className={cn(wideAtSm && "sm:flex-1", wideAtLg && "lg:flex-1")}>
        <h3 className="font-display text-2xl leading-none tracking-wide">
          {count} more services
        </h3>
        <p className="mt-4 max-w-prose text-pretty text-sm leading-relaxed text-bone-dim">
          Beard work, schoolboy and pensioner cuts, wash and style, nose and ear wax —
          every price published, both tiers side by side.
        </p>
      </div>

      {/* The same footer band the other five wear, in the warm tone. Without it
          this cell was the one card in the grid whose call to action floated in
          open space, which read as an unfinished card rather than as a
          different one — most obvious on mobile, where all six stack and the
          missing rule is the last thing you see.
          The band is a horizontal rule under a column of content, so it comes
          off in the row layout, where there is no column for it to close. */}
      <div
        className={cn(
          "mt-6 border-t border-brass-rule/50 pt-4",
          wideAtSm && "sm:mt-0 sm:shrink-0 sm:border-t-0 sm:pt-0",
          wideAtLg && "lg:mt-0 lg:shrink-0 lg:border-t-0 lg:pt-0"
        )}
      >
        <Link
          href="/services"
          className="stretch-link inline-flex items-center gap-2 rounded-sm text-xs uppercase tracking-wider text-brass after:absolute after:inset-0 after:rounded"
        >
          See the full menu
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}
