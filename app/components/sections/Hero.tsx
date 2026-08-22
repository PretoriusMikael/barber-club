"use client";

import Link from "next/link";
import { ArrowDown, Star, MapPin } from "lucide-react";
import { site } from "@/content/site";
import { branches } from "@/content/branches";
import { heroVideo } from "@/content/gallery";
import { lowestPrice } from "@/content/services";
import { formatZar } from "@/lib/utils";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { HeroScissor } from "@/components/three/HeroScissor";
import { HeroHeadline } from "@/components/sections/HeroHeadline";
import { LayeredWaves } from "@/components/backgrounds/Haikei";

/**
 * SECTION 01 — HERO.
 *
 * Job: in under six seconds, confirm who this is, that there are eleven of them
 * across the Winelands, and that booking is one tap away.
 *
 * The headline is the brand's own line, kept verbatim — "MORE THAN A CUT.
 * WELCOME TO THE CLUB." is already good, already in market, and already carries
 * recognition. Replacing working brand copy for the sake of a rewrite is vandalism.
 *
 * Performance contract: the LCP element is the POSTER IMAGE, never the video.
 * The video is decorative, muted, has no audio track, and is allowed to fail.
 * Explicitly NOT here: a booking iframe — it would wreck LCP and INP.
 */
export function Hero() {
  const hasVideo = Boolean(heroVideo.src);
  const hasPoster = Boolean(heroVideo.poster);

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink-sunken pb-16 pt-28 md:pb-24">
      <div className="absolute inset-0">
        {hasVideo ? (
          <video
            className="h-full w-full object-cover"
            poster={heroVideo.poster || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          >
            <source src={heroVideo.src} type="video/mp4" />
          </video>
        ) : hasPoster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroVideo.poster}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <HeroPlaceholder />
        )}

        {/* Legibility gradient. Dark barber aesthetics fail contrast checks
            constantly — this is what keeps the headline at AA. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="grain absolute inset-0 overflow-hidden" aria-hidden />
      </div>

      {/* Haikei-family layered waves, softening the seam into the trust bar. */}
      <LayeredWaves className="absolute inset-x-0 bottom-0 z-[6] h-24 md:h-32" />

      {/* Sits above the backdrop, below the copy. Anchored to the hero, so it
          scrolls away with it rather than following the page. */}
      <HeroScissor />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-brass">
          <span aria-hidden className="h-px w-8 bg-brass" />
          {branches.length} branches · Cape Winelands · since {site.established}
        </p>

        <HeroHeadline />

        <p className="mt-6 max-w-xl text-base leading-relaxed text-bone-dim md:text-lg">
          Great coffee, music, Wi-Fi and a legendary team of barbers across Paarl,
          Stellenbosch, Wellington, Malmesbury, Durbanville and Franschhoek. Walk in for
          Classic — or book the Premier experience.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <BookButton location="hero" size="lg">
            Book your chair
          </BookButton>
          <ButtonLink href="/branches" variant="outline" size="lg">
            <MapPin aria-hidden className="h-4 w-4" />
            Find your branch
          </ButtonLink>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {site.rating.verified && site.rating.count > 0 ? (
            <span className="flex items-center gap-2 text-bone-dim">
              <span className="flex" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-brass text-brass" />
                ))}
              </span>
              <strong className="font-semibold text-bone">{site.rating.value}</strong>
              from {site.rating.count} Google reviews
            </span>
          ) : null}

          <span className="text-bone-dim">
            Cuts from <strong className="text-bone">{formatZar(lowestPrice)}</strong>
          </span>

          <Link
            href="/#story"
            className="flex items-center gap-1.5 text-bone-faint transition-colors hover:text-bone"
          >
            Our story
            <ArrowDown aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Shown until the hero shoot lands. Carries the brief so it cannot be forgotten. */
function HeroPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_120%,#1d1d22_0%,#060607_70%)]">
      <p className="max-w-md px-8 text-center text-xs leading-relaxed text-bone-faint">
        <span className="mb-2 block uppercase tracking-[0.25em] text-brass-dim">
          Hero video + poster needed
        </span>
        {heroVideo.brief}
      </p>
    </div>
  );
}
