"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Star, MapPin } from "lucide-react";
import { site } from "@/content/site";
import { branches } from "@/content/branches";
import { heroVideo } from "@/content/gallery";
import { heroPhoto } from "@/content/photography";
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
 * Performance contract: the LCP element is the STILL IMAGE, never the video.
 * The video is decorative, muted, has no audio track, and is allowed to fail.
 * Explicitly NOT here: a booking iframe — it would wreck LCP and INP.
 *
 * The on-page "hero video needed" placeholder panel is gone: there is a real
 * photograph here now, and a production note printed over it would be worse
 * than the gap it was flagging. The 8-second loop is still outstanding and its
 * brief still lives in content/gallery.ts — when the file lands, set
 * `heroVideo.src` and the <video> branch below takes over with this photograph
 * as its poster.
 */
export function Hero() {
  const hasVideo = Boolean(heroVideo.src);
  const section = useRef<HTMLElement>(null);

  /* --- Scroll handoff -----------------------------------------------------
   * Three layers leaving the screen at three rates: the backdrop drifts down
   * (slowest, so it reads as furthest away), the copy lifts and fades, and the
   * scissor — handled in HeroScissor — lifts fastest. The hero stops being a
   * flat card being pushed upward and starts behaving like a scene the page is
   * travelling out of.
   *
   * Everything here is transform and opacity, so it composites off the main
   * thread. `useScroll` reads layout once per frame rather than per event.
   * -------------------------------------------------------------------- */
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end start"],
  });
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -64]);

  // Gone before the section boundary, so the copy never crosses the seam into
  // the trust bar underneath it.
  const copyOpacity = useTransform(scrollYProgress, [0, 0.62], [1, 0]);

  return (
    <section
      ref={section}
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink-sunken pb-16 pt-28 md:pb-24"
    >
      <motion.div
        className="absolute inset-0"
        style={{ y: backdropY, scale: backdropScale }}
      >
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
        ) : (
          /* The LCP element. `priority` emits a preload so it starts fetching
             in the document head rather than waiting for React, and `sizes` is
             100vw because it is a full-bleed backdrop at every width.

             `unoptimized` is deliberate and worth the sentence: the source is
             already AVIF at aggressive compression (1904×822 in 28 KB). Putting
             that through the image optimiser means decoding and re-encoding
             lossy-to-lossy, which on a file this compressed shows up as blocking
             in the window behind the barber — and AVIF encoding is among the
             slowest things a build can do, for a saving measured against 28 KB.
             Delete this prop the moment a raw shoot master replaces the file. */
          <Image
            src={heroPhoto.src}
            alt=""
            aria-hidden
            // The loading screen waits on this image's decode() before it
            // opens, so the hero is painted rather than filling in afterwards.
            data-hero=""
            fill
            priority
            unoptimized
            sizes="100vw"
            style={{ objectPosition: heroPhoto.focus }}
            className="object-cover"
          />
        )}

        {/* Legibility gradient. Dark barber aesthetics fail contrast checks
            constantly — this is what keeps the headline at AA. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        {/* Second, horizontal pass. The copy column is on the left and the 3D
            object is on the right; without this the headline's left edge sits
            on whatever the video happens to be doing there. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/25 to-transparent" />
        <div className="grain absolute inset-0 overflow-hidden" aria-hidden />
      </motion.div>

      {/* Haikei-family layered waves, softening the seam into the trust bar. */}
      <LayeredWaves className="absolute inset-x-0 bottom-0 z-[6] h-24 md:h-32" />

      {/* Sits above the backdrop, below the copy. Anchored to the hero, so it
          scrolls away with it rather than following the page. */}
      <HeroScissor />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8"
        style={{ y: copyY, opacity: copyOpacity }}
      >
        {/* Not a kicker: this is the three facts that answer "who is this and
            should I care" before the headline gets a chance to be poetic.
            Wrapping is explicit so it breaks after "Winelands" on a phone
            rather than orphaning "since" on its own line. */}
        {/* Tracking is dialled back below `sm`. At 0.28em this line is wider than
            a 390px viewport and broke into three, stranding a separator dot at
            the end of each — three ragged lines of metadata above the headline,
            which is the first thing in the first viewport. */}
        <p className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.16em] text-brass sm:tracking-[0.28em]">
          <span aria-hidden className="h-px w-8 shrink-0 bg-brass" />
          <span className="whitespace-nowrap after:ml-3 after:text-brass/40 after:content-['·']">
            {branches.length} branches
          </span>
          <span className="whitespace-nowrap after:ml-3 after:text-brass/40 after:content-['·']">
            Cape Winelands
          </span>
          <span className="whitespace-nowrap">since {site.established}</span>
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

          {/* "Our story" used to sit here as a third link. The first viewport was
              offering five destinations at once — Book, Find your branch, Our
              story, the price anchor, and Book Now in the header — and the one
              with the least commercial intent was competing with the two that
              have the most. The story is three sections down the same scroll and
              in the nav; nobody arrives at a barber's website to read it first. */}
          <span className="text-bone-dim">
            Cuts from <strong className="text-bone">{formatZar(lowestPrice)}</strong>
          </span>
        </div>
      </motion.div>
    </section>
  );
}
