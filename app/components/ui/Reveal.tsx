'use client';

import type { ElementType, ReactNode } from 'react';
import { motion, useReducedMotion, type Variant, type Variants } from 'motion/react';
import { InView } from '@/components/motion-primitives/in-view';

/**
 * Scroll reveal, built on motion-primitives' <InView>.
 *
 * Replaces the previous GSAP + ScrollTrigger implementation — `motion` is now
 * the single animation engine on the site, so gsap was removed entirely rather
 * than shipping two libraries that do the same job.
 *
 * The public API (Reveal / RevealItem, `staggerChildren`, `stagger`, `delay`) is
 * unchanged, so no call site needed touching.
 *
 * Two guarantees carried over from the GSAP version:
 *
 *   1. CONTENT IS NEVER HIDDEN BEHIND JS. Motion writes `opacity: 0` inline
 *      during SSR, so a failed hydration would otherwise leave a blank page. The
 *      `.no-js [data-reveal]` rule in globals.css uses `!important`, which beats
 *      a non-important inline style, forcing everything visible. A blank booking
 *      page is a business outage, not a visual bug.
 *   2. Reduced motion is honoured in JS, not just CSS — motion animates via
 *      rAF, so the CSS media query alone would not stop it.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/**
 * InView types its `variants` prop as exactly `{ hidden, visible }`, not the
 * open-ended `Variants` record — so build that shape directly rather than
 * widening it.
 */
function buildVariants(
  staggerChildren: boolean,
  stagger: number,
  delay: number
): { hidden: Variant; visible: Variant } {
  // A staggering container holds no styles of its own; it only schedules children.
  if (staggerChildren) {
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
  return { hidden: fadeUp.hidden as Variant, visible: fadeUp.visible as Variant };
}

export function Reveal({
  children,
  as = 'div',
  className,
  /** ms between child animations when `staggerChildren` is on. */
  stagger = 0,
  delay = 0,
  /** Animate direct children individually instead of the wrapper as one block. */
  staggerChildren = false,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  stagger?: number;
  delay?: number;
  staggerChildren?: boolean;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Tag = as as 'div';
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <InView
      as={as}
      once
      variants={buildVariants(staggerChildren, stagger, delay)}
      viewOptions={{ once: true, margin: '0px 0px -15% 0px' }}
    >
      {/* InView owns the animated element, so the className and the no-JS hook
          ride on an inner wrapper. */}
      <div className={className} data-reveal>
        {children}
      </div>
    </InView>
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
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Tag = as as 'div';
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <motion.div className={className} variants={fadeUp} data-reveal>
      {children}
    </motion.div>
  );
}
