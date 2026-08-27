"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Coffee, Wifi, Music, DoorOpen, Instagram, MapPin, ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";
import { branches } from "@/content/branches";
import { Section, Container } from "@/components/ui/Section";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { LowPolyGrid } from "@/components/backgrounds/Haikei";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * SECTION 04 — OUR STORY, as a bento grid.
 *
 * This replaces a two-column text block sitting next to a decorative barber
 * pole, which was the weakest-looking section on the page: a wall of prose on
 * the left and dead space on the right.
 *
 * The brand already had the content to fill a bento properly — trading since
 * December 2017, eleven branches, and its own copy selling coffee, music and
 * Wi-Fi as part of the experience. A bento turns those from a paragraph
 * somebody skims into six facts they actually read.
 *
 * Every tile is a real fact from barberclub.co.za. None of them is filler, and
 * three of them are links, so the grid also does navigational work rather than
 * being purely decorative.
 *
 * Layout maths (lg, 6 columns):
 *   row 1  story(4) + branches(2)
 *   row 2  story cont. + founded(2)
 *   row 3  amenities(2) + walk-in(2) + instagram(2)
 */

/** Shared tile chrome. `rounded` is the house 12px (globals.css) — a bento grid
 *  is the one layout where the radius does structural work rather than
 *  decoration: it is what separates nine adjacent panels into nine objects
 *  instead of one gridded surface with lines drawn on it. */
const TILE =
  "surface relative flex flex-col overflow-hidden rounded border border-line bg-ink-raised p-6 transition-colors duration-300 hover:border-bone/25";

export function StoryBento() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reported = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reported.current) {
          reported.current = true;
          track("craft_section_view");
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section id="story" tone="sunken" className="overflow-hidden">
      <Container>
        <div ref={sectionRef}>
          <Reveal
            staggerChildren
            stagger={70}
            className="mt-8 grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6"
          >
            {/* --- The story itself ------------------------------------- */}
            <RevealItem className="col-span-2 md:col-span-4 lg:col-span-4 lg:row-span-2">
              <article className={cn(TILE, "h-full justify-between")}>
                <LowPolyGrid className="opacity-25" />
                <div className="relative">
                  <h2 className="max-w-lg font-display text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-wide">
                    It is the place
                    <br />
                    <span className="text-brass">where you belong.</span>
                  </h2>
                  <p className="mt-6 max-w-lg text-sm leading-relaxed text-bone-dim">
                    {site.story.origin}
                  </p>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-bone-dim">
                    {site.story.growth}
                  </p>
                </div>
                <p className="relative mt-8 max-w-md text-sm text-bone">
                  {site.story.promise}
                </p>
              </article>
            </RevealItem>

            {/* --- Branch count ----------------------------------------- */}
            <RevealItem className="col-span-1 md:col-span-2 lg:col-span-2">
              <Link
                href="/branches"
                onClick={() => track("branch_select", { location: "branches" })}
                className={cn(TILE, "group h-full justify-between")}
              >
                <span className="flex items-start justify-between">
                  <MapPin aria-hidden className="h-5 w-5 text-brass-dim" />
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 text-bone-faint transition-colors group-hover:text-brass"
                  />
                </span>
                <span>
                  <span className="block font-display text-[clamp(3rem,7vw,5rem)] leading-none text-brass">
                    <CountUp value={branches.length} />
                  </span>
                  <span className="mt-2 block text-sm leading-snug text-bone-dim">
                    branches across the Cape Winelands
                  </span>
                </span>
              </Link>
            </RevealItem>

            {/* --- Founded ---------------------------------------------- */}
            <RevealItem className="col-span-1 md:col-span-2 lg:col-span-2">
              <article className={cn(TILE, "h-full justify-between")}>
                <span className="text-xs uppercase tracking-[0.2em] text-brass-dim">
                  First doors opened
                </span>
                <span>
                  <span className="block font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-none">
                    December
                    <br />
                    2017
                  </span>
                  <span className="mt-3 block text-xs text-bone-faint">
                    Independent ever since.
                  </span>
                </span>
              </article>
            </RevealItem>

            {/* --- Amenities -------------------------------------------- */}
            <RevealItem className="col-span-2 md:col-span-2 lg:col-span-2">
              <article className={cn(TILE, "h-full justify-between")}>
                <span className="flex gap-4 text-brass-dim">
                  <Coffee aria-hidden className="h-5 w-5" />
                  <Music aria-hidden className="h-5 w-5" />
                  <Wifi aria-hidden className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-2xl tracking-wide">
                    Coffee, music, Wi-Fi.
                  </span>
                  <span className="mt-2 block text-sm leading-snug text-bone-dim">
                    And a legendary team of experienced barbers.
                  </span>
                </span>
              </article>
            </RevealItem>

            {/* --- Walk-in ---------------------------------------------- */}
            <RevealItem className="col-span-1 md:col-span-2 lg:col-span-2">
              <article className={cn(TILE, "h-full justify-between")}>
                <DoorOpen aria-hidden className="h-5 w-5 text-brass-dim" />
                <span>
                  <span className="block font-display text-2xl tracking-wide">
                    Walk-in friendly.
                  </span>
                  <span className="mt-2 block text-sm leading-snug text-bone-dim">
                    Classic needs no appointment. Just turn up.
                  </span>
                </span>
              </article>
            </RevealItem>

            {/* --- Instagram -------------------------------------------- */}
            <RevealItem className="col-span-1 md:col-span-4 lg:col-span-2">
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(TILE, "group h-full justify-between")}
              >
                <span className="flex items-start justify-between">
                  <Instagram aria-hidden className="h-5 w-5 text-brass-dim" />
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 text-bone-faint transition-colors group-hover:text-brass"
                  />
                </span>
                <span>
                  <span className="block font-display text-2xl tracking-wide">
                    See the daily work
                  </span>
                  <span className="mt-2 block text-sm text-bone-dim">
                    {site.instagramHandle}
                  </span>
                </span>
              </a>
            </RevealItem>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
