'use client';
/* eslint-disable react-hooks/static-components --
   MotionComponent is a lookup into a module-level registry (see
   ../motion-primitives/create-motion), not a component created during render.
   Its identity is stable for the life of the page, so the rule's concern
   (state resetting on every render) does not apply here. */

import type { ElementType, ReactNode } from 'react';
import { useRef } from 'react';
import { useInView, useReducedMotion, type Variants } from 'motion/react';
import { createMotion } from '@/components/motion-primitives/create-motion';
import { EASE_OUT_EXPO } from '@/lib/motion';

/**
 * Scroll reveal.
 *
 * The previous version had exactly one gesture — 24px up, fade in, 0.7s — and
 * applied it to every block on the site: headings, price cards, bento tiles,
 * photographs, the lot. Nine sections entering identically is not choreography,
 * it is a tic. It also wastes the one thing scroll motion is good for, which is
 * telling you what kind of thing just arrived before you have read it.
 *
 * So there are now three gestures, chosen by what the content IS:
 *
 *   rise   Default. A block of text or a card arriving as one object.
 *   mask   A wipe up from the baseline, via clip-path. For headlines only.
 *          Type revealed by an edge moving across it reads as *set* rather
 *          than as *floating in*, which is the difference between a masthead
 *          and a slide transition. Deliberately scarce: one per section.
 *   frame  A photograph settling into its crop — scales from 1.05 while the
 *          frame around it stays put. This is how a picture arrives; sliding
 *          it up the page is how a div arrives.
 *
 * Three guarantees, all carried over or added:
 *
 *   1. CONTENT IS NEVER HIDDEN BEHIND JS. Motion writes the hidden state inline
 *      during SSR, so a failed hydration would otherwise leave a blank page.
 *      The `.no-js [data-reveal]` rule in globals.css uses `!important` — which
 *      beats a non-important inline style — and now releases `clip-path` too,
 *      or a masked headline would stay clipped to nothing. A blank booking page
 *      is a business outage, not a visual bug.
 *   2. Reduced motion is honoured in JS, not just CSS: motion animates via rAF,
 *      so the media query alone cannot stop it.
 *   3. Nothing animates layout. Every variant moves transform, opacity or
 *      clip-path only, so a reveal can never reflow the page under the reader.
 *
 * This drops the <InView> primitive it used to wrap. InView owned the animated
 * element, which forced the className onto an inner div — fine for a fade,
 * fatal for `frame`, where the scaling element and the element that clips it
 * have to be the same box.
 */

export type RevealVariant = 'rise' | 'mask' | 'frame';

const VARIANTS: Record<RevealVariant, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
  },

  /**
   * Negative insets on the horizontal and top edges so the rectangle sits
   * slightly outside the border box: an `inset(0 0 100% 0)` clipped exactly to
   * the box shaves the overshoot on rounded glyphs and any descender that pokes
   * below the baseline. The bottom edge is the one doing the work.
   */
  mask: {
    hidden: {
      opacity: 0,
      y: 14,
      clipPath: 'inset(-0.25em -0.12em 100% -0.12em)',
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(-0.25em -0.12em -0.25em -0.12em)',
      transition: { duration: 0.9, ease: EASE_OUT_EXPO },
    },
  },

  /** Pair with `overflow-hidden` on this element, or the scale does nothing. */
  frame: {
    hidden: { opacity: 0, scale: 1.05 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.9, ease: EASE_OUT_EXPO },
    },
  },
};

/** A staggering container holds no styles of its own; it only schedules children. */
function containerVariants(stagger: number, delay: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger / 1000,
        delayChildren: delay / 1000,
      },
    },
  };
}

/**
 * The reduced-motion variants: identical end state, reached in zero seconds.
 *
 * The obvious implementation is `if (reduced) return <plain tag>`, and it is
 * what this file used to do. It is wrong on a server-rendered page, and subtly
 * so: the SERVER cannot know the visitor's motion preference — there is no
 * media query to read — so `useReducedMotion()` returns false during SSR and
 * true on the first client render for anyone who has the setting on. Two
 * different trees, and React throws a hydration error and regenerates the whole
 * subtree. It only ever fires for the people who asked for less movement, which
 * is why it survives so long unnoticed.
 *
 * Keeping the element identical and swapping only the TRANSITION means server
 * and client always agree on the markup. Reduced motion then means the content
 * arrives instantly rather than not arriving at all.
 *
 * The `hidden` state must be IDENTICAL to the animated set's, which is why this
 * is derived from it rather than written out. Motion serialises `hidden` as an
 * inline style during SSR, so if the reduced set started from a different
 * position the server would emit `clip-path: inset(...)` for the mask variant
 * and the client would emit nothing — trading a text mismatch for an attribute
 * one. Only the transition may differ, because transitions exist only on the
 * client.
 */
function instantOf(variant: RevealVariant): Variants {
  return {
    hidden: VARIANTS[variant].hidden,
    visible: { ...(VARIANTS[variant].visible as object), transition: { duration: 0 } },
  };
}

const INSTANT: Record<RevealVariant, Variants> = {
  rise: instantOf('rise'),
  mask: instantOf('mask'),
  frame: instantOf('frame'),
};

/** The staggering-container equivalent: same empty hidden state, no schedule. */
const INSTANT_CONTAINER: Variants = {
  hidden: {},
  visible: { transition: { duration: 0, staggerChildren: 0, delayChildren: 0 } },
};

export function Reveal({
  children,
  as = 'div',
  className,
  /** ms between child animations when `staggerChildren` is on. */
  stagger = 0,
  delay = 0,
  /** Animate direct children individually instead of the wrapper as one block. */
  staggerChildren = false,
  variant = 'rise',
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  stagger?: number;
  delay?: number;
  staggerChildren?: boolean;
  variant?: RevealVariant;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // `-15%` bottom margin: fire once the block is properly into the viewport
  // rather than the instant its first pixel appears, so the motion is something
  // you watch happen instead of something already finished when you get there.
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });

  const MotionComponent = createMotion(as);

  return (
    <MotionComponent
      ref={ref}
      className={className}
      data-reveal=""
      initial="hidden"
      // Reduced motion goes straight to `visible` rather than waiting to be
      // scrolled into view: a section that only appears once you reach it is
      // scroll-triggered motion by another name.
      animate={reduced || inView ? 'visible' : 'hidden'}
      variants={
        staggerChildren
          ? reduced
            ? INSTANT_CONTAINER
            : containerVariants(stagger, delay)
          : reduced
            ? INSTANT[variant]
            : VARIANTS[variant]
      }
      // A non-staggering Reveal with an explicit delay still needs one.
      transition={staggerChildren || reduced ? undefined : { delay: delay / 1000 }}
    >
      {children}
    </MotionComponent>
  );
}

/**
 * A direct child of a staggering <Reveal>. Inherits the `hidden`/`visible`
 * label from the container through motion's variant propagation, so the
 * stagger schedule is driven entirely by the parent.
 */
export function RevealItem({
  children,
  className,
  as = 'div',
  variant = 'rise',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  variant?: RevealVariant;
}) {
  const reduced = useReducedMotion();
  const MotionComponent = createMotion(as);

  return (
    <MotionComponent
      className={className}
      variants={reduced ? INSTANT[variant] : VARIANTS[variant]}
      data-reveal=""
    >
      {children}
    </MotionComponent>
  );
}
