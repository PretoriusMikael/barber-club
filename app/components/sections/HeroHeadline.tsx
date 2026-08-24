'use client';

import { useReducedMotion } from 'motion/react';
import { TextEffect } from '@/components/motion-primitives/text-effect';
import { useCurtainPhase } from '@/lib/curtain';

/**
 * The hero headline, wrapped to fix four real defects in a bare <TextEffect>.
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
 * 4. HYDRATION. The reduced-motion path used to return a completely different
 *    tree — two plain spans instead of TextEffect's per-word markup. The server
 *    has no way to read a motion preference, so it always rendered the animated
 *    branch, and every reduced-motion visitor hit a text mismatch on the site's
 *    biggest element and had the whole hero regenerated on the client. Swapping
 *    the variant SET instead of the tree keeps the markup identical; only the
 *    transitions differ, and transitions exist only on the client.
 *
 * The second line's delay was also cut from 0.5s to 0.16s. Half a second of
 * empty space under a finished first line reads as a broken page, and delaying
 * the LCP element by that long is a measurable cost for no design gain.
 *
 * 5. THE ENTRANCE MUST NOT BE SPENT BEHIND THE LOADING SCREEN. TextEffect
 *    hardcodes `initial="hidden" animate="visible"`, so it plays the moment it
 *    mounts — which, with a curtain over the page, meant the whole word-by-word
 *    reveal happened under an opaque panel and the visitor was shown a headline
 *    that had already finished arriving. Until the panels start parting this
 *    renders the plain sentence instead; the animated version is swapped in as
 *    the cut opens, so the words arrive WITH the reveal.
 *
 *    The static branch is also exactly what the server emits, and
 *    `useCurtainPhase()` returns "closed" from both `getServerSnapshot` and the
 *    first client render — so this is a post-hydration update, not a mismatch.
 *    That distinction is the whole reason the phase lives in an external store
 *    with an explicit server snapshot rather than in a plain effect.
 */

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

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
      transition: { duration: 0.5, ease: EASE },
    },
  },
};

/**
 * Reduced motion. IDENTICAL hidden states to WORD, zero-length transitions.
 *
 * The `hidden` variants must match byte for byte, and that is the whole trick.
 * Motion writes the hidden state as an inline style during SSR, and the server
 * cannot know the visitor's motion preference — so if the two variant sets
 * disagreed about the starting style, every reduced-motion visitor would get a
 * hydration mismatch on the largest element on the page. Only the transitions
 * differ, and transitions exist purely on the client.
 */
const WORD_INSTANT = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0, duration: 0 } },
  },
  item: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0 } },
  },
};

const CLASSES = 'max-w-4xl text-[clamp(2.75rem,9.5vw,7rem)] leading-[0.86] tracking-tight';

export function HeroHeadline() {
  const reduced = useReducedMotion();
  const variants = reduced ? WORD_INSTANT : WORD;
  const phase = useCurtainPhase();

  // Still covered: render the sentence, unanimated. Identical to the server
  // output, so hydration matches, and it is what a no-JS visitor keeps.
  if (phase === 'closed') {
    return (
      <h1 className={CLASSES} data-reveal>
        <span className="block">More than a cut.</span>
        <span className="block text-brass">Welcome to the Club.</span>
      </h1>
    );
  }

  return (
    <h1 className={CLASSES} data-reveal data-text-effect="inline">
      <TextEffect as="span" per="word" variants={variants} delay={0} className="block">
        More than a cut.
      </TextEffect>
      <TextEffect
        as="span"
        per="word"
        variants={variants}
        delay={reduced ? 0 : 0.16}
        className="block text-brass"
      >
        Welcome to the Club.
      </TextEffect>
    </h1>
  );
}
