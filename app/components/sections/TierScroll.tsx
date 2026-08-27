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
 * The Services grid above answers "what does it cost". This section answers
 * "which one is for me" — a different question, and the one the current site
 * never answers anywhere, because it just lists two menus on two unlinked pages.
 *
 * IT USED TO ANSWER THE FIRST QUESTION TWICE. The right-hand panel was a
 * five-row price list: the same services, at the same prices, as the cards two
 * screens above and the full menu one click away. Three statements of the same
 * numbers on one journey is not emphasis, it is a page that has lost track of
 * what each section is for — and it left the actual difference between the
 * tiers, which is how you get a chair rather than what it costs, unstated.
 *
 * So the panel is now a comparison: four questions, answered differently per
 * tier. Every answer is derived from content/services.ts rather than written
 * down here, so the menu and this section cannot drift apart.
 *
 * THE LABELS HOLD STILL AND ONLY THE ANSWERS MOVE. That is the whole reason to
 * pin a section: the reader keeps one frame of reference and watches the values
 * change inside it. Previously both columns crossfaded at once, which is a slide
 * transition wearing a comparison's clothes.
 *
 * Still missing, and the reason there are four rows rather than five: how long
 * each tier takes. Time in the chair is the real difference between a Classic
 * and a Premier cut and the current site publishes no durations at all
 * (PITCH-NOTES.md §3.3). When they arrive, a "Time in the chair" row drops
 * straight into COMPARISON below and needs nothing else.
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

/**
 * What a haircut costs in a tier — computed over the `cuts` category only.
 *
 * Over the whole menu Classic would read "R70 to R290", because R70 is a nose
 * wax. Technically true, and a misleading answer to "what does a haircut cost".
 * Restricting it to cuts is both accurate and self-maintaining: add a cut to
 * content/services.ts and this moves on its own.
 */
function cutRange(tier: Tier): { low: number; high: number } {
  const prices = services
    .filter((s) => s.category === "cuts")
    .map((s) => priceFor(s, tier))
    .filter((p): p is number => p !== null);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

/** How many services you can actually order in a tier. */
function menuSize(tier: Tier): number {
  return services.filter((s) => priceFor(s, tier) !== null).length;
}

/** Services one tier has and the other does not — today, The Godfather Cut. */
function exclusiveTo(tier: Tier): string[] {
  const other: Tier = tier === "classic" ? "premier" : "classic";
  return services
    .filter((s) => priceFor(s, tier) !== null && priceFor(s, other) === null)
    .map((s) => s.name);
}

interface ComparisonRow {
  label: string;
  value: Record<Tier, string>;
}

/**
 * The four things that decide which chair someone sits in.
 *
 * Two are computed from the real menu; two are the brand's own positioning put
 * into plain language ("without the need for an appointment… at an unbeatable
 * price" / "for those who value the complete grooming experience"). Nothing here
 * asserts anything Barber Club has not already asserted itself.
 */
function comparisonRows(): ComparisonRow[] {
  const classicCuts = cutRange("classic");
  const premierCuts = cutRange("premier");
  const premierOnly = exclusiveTo("premier");

  return [
    {
      label: "Getting a chair",
      value: {
        classic: "Walk in. No appointment, no waiting list — whenever suits you.",
        premier: "By appointment. The chair is held, so you sit down at your time.",
      },
    },
    {
      label: "A haircut costs",
      value: {
        classic: `${formatZar(classicCuts.low)} to ${formatZar(classicCuts.high)}`,
        premier: `${formatZar(premierCuts.low)} to ${formatZar(premierCuts.high)}`,
      },
    },
    {
      label: "On the menu",
      value: {
        classic: `${menuSize("classic")} services, every one of them walk-in.`,
        premier:
          premierOnly.length > 0
            ? `${menuSize("premier")} services — including ${listOf(premierOnly)}, which only Premier does.`
            : `${menuSize("premier")} services.`,
      },
    },
    {
      label: "Pick this when",
      value: {
        classic: "The cut needs to happen today and you would rather not plan it.",
        premier: "You want the whole thing, unhurried, and finished properly.",
      },
    },
  ];
}

/** "A", "A and B", "A, B and C" — so the sentence survives a second exclusive. */
function listOf(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
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

  // Derived from the menu, so it is the same on the server and the client and
  // costs one pass over eleven services. No memo needed for that.
  const rows = comparisonRows();

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
              <div
                key={tier}
                className="flex flex-col rounded border border-line bg-ink-raised p-6 sm:p-8"
              >
                {/* Facts first, ask last. The pinned layout can afford to lead
                    with the tier's own description because the comparison sits
                    beside it; stacked, that description is four lines of
                    positioning between the reader and the four answers they came
                    for. `mt-auto` on the CTA also lands both buttons on the same
                    line in the 768–1023px band where these cards sit side by
                    side, which is the only width at which they are compared
                    rather than read one after the other. */}
                <TierCopy tier={tier} cta={false} />
                <dl className="mt-8 divide-y divide-line border-t border-line">
                  {rows.map((row) => (
                    <div key={row.label} className="py-4">
                      <dt className="text-xs uppercase tracking-[0.2em] text-brass-dim">
                        {row.label}
                      </dt>
                      <dd className="mt-1.5 text-sm leading-relaxed text-bone">
                        {row.value[tier]}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 pt-2 sm:mt-auto">
                  <TierCta tier={tier} />
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
                  <span aria-hidden className="relative block h-0.5 w-20 overflow-hidden rounded-full bg-line">
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

              {/* The card, its border and all four labels are STATIC. Only the
                  answers crossfade — which is the entire argument for pinning a
                  section rather than stacking two cards: one frame of reference,
                  held still, with the values changing inside it.

                  Each answer cell stacks both tiers in the same grid cell, so
                  the row is always as tall as its longer answer and nothing
                  reflows as you scroll through the transition. */}
              <div className="lg:col-span-7">
                <dl className="divide-y divide-line rounded-lg border border-line bg-ink-raised p-8 lg:p-10">
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid gap-x-8 gap-y-1.5 py-5 first:pt-0 last:pb-0 xl:grid-cols-[11rem_1fr]"
                    >
                      <dt className="text-xs uppercase tracking-[0.2em] text-brass-dim xl:pt-1">
                        {row.label}
                      </dt>
                      <dd className="grid">
                        {TIERS.map((tier, i) => (
                          <motion.span
                            key={tier}
                            className="col-start-1 row-start-1 text-lg leading-snug text-bone"
                            style={{ opacity: opacity[i], y: yShift[i] }}
                            aria-hidden={i !== index}
                          >
                            {row.value[tier]}
                          </motion.span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
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

/** Tier name, how it works, and — unless the caller places it itself — the CTA. */
function TierCopy({ tier, cta = true }: { tier: Tier; cta?: boolean }) {
  const info = tierInfo[tier];
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

      {/* The price range used to live here as well. It is row two of the
          comparison now — stating it in both columns of the same viewport was
          the smaller version of the duplication this section was fixing. */}

      {cta ? (
        <div className="mt-7">
          <TierCta tier={tier} />
        </div>
      ) : null}
    </div>
  );
}

/** Walk in, or book. The two tiers convert through different actions. */
function TierCta({ tier }: { tier: Tier }) {
  return tier === "classic" ? (
    <ButtonLink href="/branches" variant="outline" size="md">
      Find your nearest branch
      <ArrowRight aria-hidden className="h-4 w-4" />
    </ButtonLink>
  ) : (
    <BookButton location="tier_card" size="md">
      Book Premier
    </BookButton>
  );
}
