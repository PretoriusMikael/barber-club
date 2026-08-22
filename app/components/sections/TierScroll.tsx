"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowRight, CalendarCheck, DoorOpen } from "lucide-react";
import { services, priceFor, tierInfo, type Tier } from "@/content/services";
import { Container, Eyebrow } from "@/components/ui/Section";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { formatZar, cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Classic vs Premier, as a pinned scroll comparison.
 *
 * The Services grid above answers "what does it cost". It cannot answer "which
 * one is for me", because the difference between the tiers is not really price
 * — it is walk-in versus appointment, and how long you are in the chair. That
 * distinction is the core of Barber Club's offer and the current site never
 * explains it anywhere; it just lists two menus on two unlinked pages.
 *
 * Pinning the left column and swapping the right as you scroll gives each tier
 * a full screen of attention without making the visitor click anything, and the
 * comparison lands because the framing (the pinned heading) never moves.
 *
 * Implementation notes:
 *  - Scroll progress comes from motion's `useScroll` against the tall outer
 *    section. No scroll library, no pinning hack, no layout thrash.
 *  - The tier index is derived in a motion event callback rather than an effect,
 *    so it never causes a cascading render.
 *  - Under `prefers-reduced-motion` the whole mechanism is skipped and both
 *    tiers render as a plain stacked comparison. A pinned section that only
 *    advances on scroll is a trap for anyone who has asked for less movement.
 */

const TIERS: Tier[] = ["classic", "premier"];

/**
 * Price range for a tier, computed over the services actually shown in the
 * panel — not the whole menu.
 *
 * Over the whole menu the Classic range would read "R70 to R290", because R70
 * is a nose wax. Technically true, and actively misleading as a headline for a
 * haircut. Deriving it from the showcase keeps the number consistent with the
 * list sitting next to it.
 */
function priceRange(tier: Tier): { low: number; high: number } {
  const prices = showcaseFor(tier)
    .map((s) => priceFor(s, tier))
    .filter((p): p is number => p !== null);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

/** The handful of services worth showing per tier — the ones people book. */
const SHOWCASE = [
  "the-godfather-cut",
  "the-club-cut",
  "blade-fade-cut",
  "cut-wash-and-style",
  "gents-cut",
  "hot-towel-shave",
];

function showcaseFor(tier: Tier) {
  return SHOWCASE.map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .filter((s) => priceFor(s, tier) !== null)
    .slice(0, 5);
}

export function TierScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  // Pinning needs a viewport tall enough to hold a whole panel. On a phone the
  // heading, tier copy, progress rail and a five-row menu comfortably exceed
  // 100vh, so the pinned child would clip. Below lg we render the stacked
  // comparison instead — which is also what gets server-rendered and indexed.
  const canPin = useMediaQuery("(min-width: 1024px)");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setIndex(v < 0.5 ? 0 : 1);
  });

  if (reduced || !canPin) {
    return (
      <section id="tiers" className="scroll-mt-20 bg-ink py-20 md:py-28">
        <Container>
          <Eyebrow>Which chair</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-4xl leading-[0.95] sm:text-5xl">
            Two ways to sit down.
          </h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {TIERS.map((tier) => (
              <div key={tier} className="border border-line bg-ink-raised p-8">
                <TierCopy tier={tier} />
                <div className="mt-8">
                  <TierMenu tier={tier} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  const tier = TIERS[index];

  return (
    // Two screens of scroll for two panels. The sticky child pins inside it.
    <section id="tiers" ref={ref} className="relative h-[220vh] scroll-mt-20 bg-ink">
      <div className="sticky top-0 flex min-h-screen items-center py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* --- Pinned framing --------------------------------------- */}
            <div className="lg:col-span-5">
              <Eyebrow>Which chair</Eyebrow>
              <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95]">
                Two ways
                <br />
                to sit down.
              </h2>

              <div className="mt-10 min-h-[15rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <TierCopy tier={tier} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress rail — tells the visitor there is a second panel,
                  which a pinned section otherwise hides completely. */}
              <div className="mt-10 flex items-center gap-3">
                {TIERS.map((t, i) => (
                  <span
                    key={t}
                    aria-hidden
                    className={cn(
                      "h-0.5 transition-all duration-500",
                      i === index ? "w-12 bg-brass" : "w-6 bg-line"
                    )}
                  />
                ))}
                <span className="ml-2 font-mono text-xs text-bone-faint">
                  {index + 1} / {TIERS.length}
                </span>
              </div>
            </div>

            {/* --- Swapping panel --------------------------------------- */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="border border-line bg-ink-raised p-6 md:p-8"
                >
                  <TierMenu tier={tier} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

/** Tier name, how it works, price range and the matching call to action. */
function TierCopy({ tier }: { tier: Tier }) {
  const info = tierInfo[tier];
  const { low, high } = priceRange(tier);
  const Icon = tier === "classic" ? DoorOpen : CalendarCheck;

  return (
    <div>
      <p className="flex items-center gap-2.5 text-xs uppercase tracking-[0.22em] text-brass">
        <Icon aria-hidden className="h-4 w-4" />
        {tier === "classic" ? "No appointment" : "By appointment only"}
      </p>

      <h3 className="mt-3 font-display text-[clamp(2.5rem,6vw,4rem)] leading-none tracking-wide">
        {info.label}
      </h3>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-bone-dim">
        {info.description}
      </p>

      <p className="mt-5 text-sm text-bone-dim">
        Cuts and shaves{" "}
        <span className="text-bone">{formatZar(low)}</span> to{" "}
        <span className="text-bone">{formatZar(high)}</span>
      </p>

      <div className="mt-7">
        {tier === "classic" ? (
          <ButtonLink href="/branches" variant="outline" size="md">
            Find your nearest branch
            <ArrowRight aria-hidden className="h-4 w-4" />
          </ButtonLink>
        ) : (
          <BookButton location="tier_card" size="md">
            Book Premier
          </BookButton>
        )}
      </div>
    </div>
  );
}

/** The tier's signature services with their real published prices. */
function TierMenu({ tier }: { tier: Tier }) {
  const list = showcaseFor(tier);

  return (
    <>
      <p className="mb-5 text-xs uppercase tracking-[0.2em] text-brass-dim">
        {tierInfo[tier].label} menu
      </p>
      <ul className="divide-y divide-line">
        {list.map((service) => {
          const price = priceFor(service, tier);
          return (
            <li key={service.slug} className="flex items-baseline justify-between gap-6 py-4">
              <span>
                <span className="block font-display text-xl tracking-wide">
                  {service.name}
                </span>
                <span className="mt-1 block max-w-sm text-xs leading-snug text-bone-faint">
                  {service.blurb}
                </span>
              </span>
              <span className="shrink-0 text-lg text-brass">
                {price === null ? "—" : formatZar(price)}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
