"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { priceLabel } from "@/lib/utils";
import { Price } from "@/components/ui/Price";
import { TiltCard } from "@/components/ui/TiltCard";

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
          <RevealItem>
            <FullMenuCard count={services.length - visible.length} />
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

  return (
    <TiltCard
      className="group rounded border border-line bg-ink-raised hover:border-bone/25"
      contentClassName="p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl leading-none tracking-wide">{service.name}</h3>
        <Price value={price} className="tnum shrink-0 font-display text-2xl leading-none text-bone" />
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-bone-dim">{service.blurb}</p>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="text-xs text-bone-faint">
          {other === null
            ? "Premier only"
            : `${tier === "classic" ? "Premier" : "Classic"} ${priceLabel(other)}`}
        </span>
        <Link
          href={`/services#${service.slug}`}
          className="rounded-sm text-xs uppercase tracking-wider text-bone-dim transition-colors hover:text-brass"
        >
          Details
        </Link>
      </div>
    </TiltCard>
  );
}

/** The last cell of the grid: the rest of the menu, as a card. */
function FullMenuCard({ count }: { count: number }) {
  return (
    <TiltCard
      className="group rounded border border-brass-rule bg-brass/[0.04] hover:border-brass/60"
      contentClassName="justify-between p-6"
    >
      <Link href="/services" className="flex h-full flex-col justify-between">
        <div>
          <h3 className="font-display text-2xl leading-none tracking-wide">
            {count} more services
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-bone-dim">
            Beard work, schoolboy and pensioner cuts, wash and style, nose and ear wax —
            every price published, both tiers side by side.
          </p>
        </div>
        <span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-brass">
          See the full menu
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
          />
        </span>
      </Link>
    </TiltCard>
  );
}
