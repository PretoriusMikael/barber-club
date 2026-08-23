"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * A hairline under the header showing how far through the page you are.
 *
 * The home page is roughly twelve thousand pixels tall and every section is a
 * dark panel on a dark background. That combination removes the two cues people
 * normally use to judge their position in a document — the scrollbar (thin,
 * easy to miss, and on a phone it is a fading overlay) and any change in the
 * page's overall colour. The result is a long scroll with no sense of progress,
 * which is one of the more reliable ways to lose someone halfway down.
 *
 * One brass line answers it for a few hundred bytes and nothing per frame that
 * the compositor cannot do: `scaleX` on a transform, driven by a spring so it
 * eases rather than tracking wheel jitter one-to-one.
 *
 * Not shown under reduced motion — it is an animation whose entire content is
 * movement, and there is no still version of it worth keeping.
 */
export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-px origin-left bg-brass"
      style={{ scaleX }}
    />
  );
}
