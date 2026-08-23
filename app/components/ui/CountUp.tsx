"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "@/components/motion-primitives/animated-number";

/**
 * A number that counts up the first time it is scrolled into view.
 *
 * `AnimatedNumber` was already in the codebase and used in exactly one place —
 * the price that re-counts when you flip Classic to Premier. It is a good
 * primitive being under-used: the same "watch the value arrive" moment applies
 * to the headline stat on the story grid, where "11" is the single most
 * persuasive fact on the page and currently just sits there.
 *
 * Deliberately restrained about where this is allowed to go. A count-up is a
 * claim being made — it works on a number a visitor is meant to be impressed
 * by, and it is noise on a number they are meant to read (a price, a date, an
 * address). Two on one page would already be one too many.
 *
 * Starts at the target value and animates only when seen, so a visitor who
 * never reaches the tile is not told the answer is zero, and the SSR markup
 * carries the real figure for anyone without JS.
 */
export function CountUp({
  value,
  className,
  /** Where the count starts. Below about 60% of the target it reads as a slot machine. */
  from = 0,
}: {
  value: number;
  className?: string;
  from?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduced = useReducedMotion();

  /* --- Why this is opt-IN after mount, rather than opt-out --------------
   * The server renders the real number. It has to: it cannot know the
   * visitor's motion preference, so branching the tree on `reduced` during
   * render means SSR emits one thing and the first client render emits
   * another, and React throws a hydration error and rebuilds the subtree.
   * That is exactly the bug this component shipped with — server "0", client
   * "11" — and it only ever fired for people with reduced motion enabled.
   *
   * So: render the true value always, and enable the animated version from an
   * effect, which by definition runs only on the client and only after the
   * markup has already matched.
   *
   * The second condition is subtler. If the tile is ALREADY on screen when the
   * effect runs — a deep link to #story, a short page, a restored scroll
   * position — then resetting a number the visitor is currently reading back
   * to zero so it can climb again is a glitch, not a flourish. In that case it
   * simply stays put. A count-up is only ever worth having on the way in. */
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setAnimate(true);
  }, [reduced]);

  if (!animate) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      <AnimatedNumber
        value={inView ? value : from}
        springOptions={{ bounce: 0, duration: 1100 }}
      />
    </span>
  );
}
