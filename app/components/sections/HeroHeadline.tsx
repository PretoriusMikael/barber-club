'use client';

import { useReducedMotion } from 'motion/react';
import { TextEffect } from '@/components/motion-primitives/text-effect';

/**
 * The hero headline, wrapped to fix three real defects in a bare <TextEffect>.
 * This is the largest text on the site and usually its LCP element, so it is
 * worth hardening rather than using the primitive raw.
 *
 * 1. INVISIBLE WITHOUT JS. TextEffect renders `opacity: 0` inline during SSR on
 *    both the container and every word. If hydration is slow or fails, the most
 *    important sentence on the page is simply blank. `data-reveal` opts it into
 *    the `.no-js` / reduced-motion `!important` rules in globals.css, which now
 *    also cover descendants — the per-word spans carry their own inline opacity,
 *    so a rule on the wrapper alone was not enough.
 *
 * 2. INDENTED WRAPPED LINES. TextEffect splits on `/(\s+)/` and renders every
 *    segment — INCLUDING the spaces — as `inline-block whitespace-pre`. An
 *    inline-block space cannot collapse at a line break, so each wrapped line
 *    started with a visible indent. At `clamp(2.75rem, 9.5vw, 7rem)` this
 *    headline wraps at most widths, so it was showing constantly. Fixed by
 *    `data-text-effect="inline"` (see globals.css), which puts the segments back
 *    to `display: inline`. That is only safe because the variants below animate
 *    opacity and filter ONLY — a transform would not apply to an inline box.
 *
 * 3. REDUCED MOTION IGNORED. TextEffect animates regardless of the OS setting.
 *
 * The second line's delay was also cut from 0.5s to 0.16s. Half a second of
 * empty space under a finished first line reads as a broken page, and delaying
 * the LCP element by that long is a measurable cost for no design gain.
 */

const WORD = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.055 } },
  },
  // Opacity + blur only. No transform — see note 2 above.
  item: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  },
};

const CLASSES = 'max-w-4xl text-[clamp(2.75rem,9.5vw,7rem)] leading-[0.86] tracking-tight';

export function HeroHeadline() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <h1 className={CLASSES}>
        <span className="block">More than a cut.</span>
        <span className="block text-brass">Welcome to the Club.</span>
      </h1>
    );
  }

  return (
    <h1 className={CLASSES} data-reveal data-text-effect="inline">
      <TextEffect as="span" per="word" variants={WORD} delay={0} className="block">
        More than a cut.
      </TextEffect>
      <TextEffect
        as="span"
        per="word"
        variants={WORD}
        delay={0.16}
        className="block text-brass"
      >
        Welcome to the Club.
      </TextEffect>
    </h1>
  );
}
