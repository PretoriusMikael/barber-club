"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  featuredServices,
  priceFor,
  tierInfo,
  type Service,
  type Tier,
} from "@/content/services";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { AssetFrame } from "@/components/ui/AssetFrame";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { TierToggle, TierBlurb } from "@/components/sections/TierToggle";
import { priceLabel } from "@/lib/utils";
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
          <ButtonLink href="/services" variant="ghost" size="sm" className="hidden md:inline-flex">
            Full menu &amp; pricing
            <ArrowRight aria-hidden className="h-4 w-4" />
          </ButtonLink>
        </div>

        <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-center">
          <TierToggle value={tier} onChange={setTier} />
          <TierBlurb tier={tier} className="max-w-xl" />
        </div>

        <Reveal
          key={tier}
          staggerChildren
          stagger={60}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((service, i) => (
            <RevealItem key={service.slug}>
              <ServiceCard service={service} tier={tier} index={i + 1} />
            </RevealItem>
          ))}
        </Reveal>

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
          <ButtonLink href="/services" variant="outline" size="lg">
            See the full menu
            <ArrowRight aria-hidden className="h-4 w-4" />
          </ButtonLink>
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

function ServiceCard({
  service,
  tier,
  index,
}: {
  service: Service;
  tier: Tier;
  index: number;
}) {
  const price = priceFor(service, tier);
  const other = priceFor(service, tier === "classic" ? "premier" : "classic");

  return (
    <article className="group flex h-full flex-col border border-line bg-ink-raised transition-colors duration-300 hover:border-bone/25">
      <AssetFrame
        asset={service.image}
        ratio="4/5"
        index={index}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl tracking-wide">{service.name}</h3>
          <Price value={price} className="shrink-0 text-sm text-brass" />
        </div>

        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-bone-dim">{service.blurb}</p>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-bone-faint">
            {other === null
              ? "Premier only"
              : `${tier === "classic" ? "Premier" : "Classic"} ${priceLabel(other)}`}
          </span>
          <Link
            href={`/services#${service.slug}`}
            className="text-xs uppercase tracking-wider text-bone-dim transition-colors hover:text-brass"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
