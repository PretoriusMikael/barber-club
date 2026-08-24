"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowRight, CalendarCheck, DoorOpen } from "lucide-react";
import { services, priceFor, tierInfo, type Tier } from "@/content/services";
import { Container } from "@/components/ui/Section";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { formatZar, cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";

/**
 * Classic vs Premier, as a pinned scroll comparison.
 *
 * The Services grid above answers "what does it cost". It cannot answer "which
 * one is for me", because the difference between the tiers is not really price
 * — it is walk-in versus appointment, and how long you are in the chair. That
 * distinction is the core of Barber Club's offer and the current site never
 * explains it anywhere; it just lists two menus on two unlinked pages.
 *
 * Pinning the left column and swapping the right as you scroll gives each tier a
 * full screen of attention without making the visitor click anything, and the
 * comparison lands because the framing never moves.
 *
 * LAYOUT: the pinned version is desktop-only, chosen in CSS, not JavaScript.
 *
 *   Pinning needs a viewport tall enough to hold a whole panel; on a phone the
 *   heading, tier copy and a five-row menu comfortably exceed 100vh and the
 *   pinned child would clip. The obvious fix — a JS media query picking a layout
 *   — was tried and rejected: the server cannot know the viewport, so the page
 *   would render one layout and then swap to the other on hydration, which is a
 *   large, entirely avoidable layout shift.
 *
 *   Instead both layouts are in the markup and CSS picks one. `display: none`
 *   removes the hidden branch from the accessibility tree as well as the layout,
 *   so screen readers never encounter the content twice.
 *
 * MOTION: under `prefers-reduced-motion` the pinned branch is not rendered at
 * all. A section that only advances when you scroll is a trap for anyone who has
 * asked for less movement.
 */

const TIERS: Tier[] = ["classic", "premier"];

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

/**
 * Price range for a tier, computed over the services actually shown in the panel
 * — not the whole menu.
 *
 * Over the whole menu the Classic range would read "R70 to R290", because R70 is
 * a nose wax. Technically true, and misleading as a headline for a haircut.
 * Deriving it from the showcase keeps the number consistent with the list
 * sitting next to it.
 */
function priceRange(tier: Tier): { low: number; high: number } {
  const prices = showcaseFor(tier)
    .map((s) => priceFor(s, tier))
    .filter((p): p is number => p !== null);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

export function TierScroll() {
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  // The ref is attached to the section unconditionally, so this always has a
  // valid target even when the pinned branch is hidden by CSS.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Derived in a motion event callback rather than an effect, so it never causes
  // a cascading render. React bails out when the value is unchanged.
  // This drives only the things that must be discrete — `aria-hidden`,
  // `pointer-events` and the "1 / 2" readout. The visuals are continuous below.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setIndex(v < 0.5 ? 0 : 1);
  });

  /* --- Continuous crossfade -------------------------------------------------
   * The panels used to swap on a boolean at exactly 50%: you scrolled, nothing
   * happened, nothing happened, then both panels animated at once. In a section
   * whose entire premise is "the framing holds still while the content changes",
   * a hard cut is the one thing that breaks the illusion — it tells you the page
   * is switching slides rather than that you are moving through a comparison.
   *
   * Handing the fade to scroll position makes the transition something you drive
   * with the wheel. The 0.34–0.58 band is deliberately narrow: wide enough that
   * you can feel yourself moving through it, tight enough that you are never
   * looking at two half-transparent price lists for long.
   * ------------------------------------------------------------------------ */
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.6 });
  const classicOpacity = useTransform(smooth, [0.3, 0.46], [1, 0]);
  const premierOpacity = useTransform(smooth, [0.42, 0.58], [0, 1]);
  const classicY = useTransform(smooth, [0.3, 0.46], [0, -18]);
  const premierY = useTransform(smooth, [0.42, 0.58], [18, 0]);
  const railScale = useTransform(smooth, [0.3, 0.58], [0, 1]);

  const opacity = [classicOpacity, premierOpacity];
  const yShift = [classicY, premierY];

  /* The pinned branch is still dropped for reduced motion — a section that only
   * advances when you scroll is exactly what someone asking for less movement
   * does not want. But the decision has to wait for mount.
   *
   * The server cannot read a motion preference, so it always renders the pinned
   * markup; deciding during render meant a reduced-motion visitor's first client
   * render produced the stacked markup instead, and React discarded and rebuilt
   * the section. Resolving it in an effect makes the first client render match
   * the server by construction, and the swap then happens as an ordinary update.
   * TierScroll sits several screens below the fold, so the resulting height
   * change is never on screen when it happens. */
  const hydrated = useHydrated();
  const pinned = !(hydrated && reduced);

  return (
    <section
      id="tiers"
      ref={ref}
      /* Tone step + hairline. Services above is `bg-ink` and this was too, which
         made them the only two adjacent sections on the page with no visual
         boundary between them — so the space where one ended and the next began
         read as a rendering fault rather than as a section break. A step down to
         `sunken` and a 1px rule cost nothing and turn the same gap into a
         deliberate pause. */
      className={cn(
        "relative scroll-mt-20 border-t border-line bg-ink-sunken",
        pinned && "lg:h-[200vh]"
      )}
    >
      {/* --- Stacked: mobile, and every width under reduced motion --------- */}
      <div className={cn("pb-16 pt-20 md:pb-24 md:pt-28", pinned && "lg:hidden")}>
        <Container>
          <Heading />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {TIERS.map((tier) => (
              <div key={tier} className="border border-line bg-ink-raised p-6 sm:p-8">
                <TierCopy tier={tier} />
                <div className="mt-8">
                  <TierMenu tier={tier} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* --- Pinned: desktop only ------------------------------------------ */}
      {pinned ? (
        <div className="hidden lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:items-center lg:py-16">
          <Container>
            <div className="grid items-center gap-16 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Heading />

                {/* Both tiers occupy the same grid cell; only the active one is
                    opaque. Stacking them rather than swapping avoids any height
                    change as the copy length differs between tiers. */}
                <div className="mt-10 grid">
                  {TIERS.map((tier, i) => (
                    <motion.div
                      key={tier}
                      className={cn(
                        "col-start-1 row-start-1",
                        i !== index && "pointer-events-none"
                      )}
                      // Opacity comes from scroll position, not from a state
                      // transition. Panel 1 also starts hidden in CSS so there is
                      // no flash of both overlapping before hydration.
                      style={{ opacity: opacity[i], y: yShift[i] }}
                      aria-hidden={i !== index}
                    >
                      <TierCopy tier={tier} />
                    </motion.div>
                  ))}
                </div>

                {/* Progress rail. A pinned section otherwise gives no hint that
                    a second panel exists, and no hint of how far through it you
                    are — the rail fills continuously as you scroll, so it is a
                    scrubber you can read rather than two lamps that swap. */}
                <div className="mt-10 flex items-center gap-3">
                  <span aria-hidden className="relative block h-0.5 w-20 bg-line">
                    <motion.span
                      className="absolute inset-y-0 left-0 w-full origin-left bg-brass"
                      style={{ scaleX: railScale }}
                    />
                  </span>
                  <span className="ml-2 font-mono text-xs tabular-nums text-bone-faint">
                    {index + 1} / {TIERS.length}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="grid">
                  {TIERS.map((tier, i) => (
                    <motion.div
                      key={tier}
                      className={cn(
                        "col-start-1 row-start-1 border border-line bg-ink-raised p-8 lg:p-10",
                        i !== index && "pointer-events-none"
                      )}
                      style={{ opacity: opacity[i], y: yShift[i] }}
                      aria-hidden={i !== index}
                    >
                      <TierMenu tier={tier} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </div>
      ) : null}
    </section>
  );
}

function Heading() {
  return (
    <h2 className="max-w-2xl text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95]">
      Two ways to sit down.
    </h2>
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

      <h3 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-none tracking-wide">
        {info.label}
      </h3>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-bone-dim">{info.description}</p>

      <p className="mt-5 text-sm text-bone-dim">
        Cuts and shaves <span className="tnum text-bone">{formatZar(low)}</span> to{" "}
        <span className="tnum text-bone">{formatZar(high)}</span>
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
                <span className="block font-display text-xl tracking-wide">{service.name}</span>
                <span className="mt-1 block max-w-sm text-xs leading-snug text-bone-faint">
                  {service.blurb}
                </span>
              </span>
              <span className="tnum shrink-0 text-lg text-brass">
                {price === null ? "—" : formatZar(price)}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
