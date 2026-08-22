import { motion } from 'motion/react';
import type { ComponentType, ElementType } from 'react';

/**
 * Motion components for a dynamic `as` prop, created ONCE at module load.
 *
 * Two problems with the upstream motion-primitives code this replaces:
 *
 *  1. It targets Framer Motion v11 on React 18. On motion v13 + React 19,
 *     `motion[tag]` dynamic indexing is gone (replaced by `motion.create()`) and
 *     the global `JSX` namespace moved to `React.JSX`, so
 *     `keyof JSX.IntrinsicElements` no longer resolves.
 *
 *  2. More seriously, it called `motion.create()` DURING RENDER. That returns a
 *     brand-new component type on every call, and React treats a new type as a
 *     different component — so the subtree unmounts and remounts, losing state
 *     and restarting animations. `useMemo` only papers over it: memo caches are
 *     allowed to be dropped, and each component instance keeps its own.
 *
 * Building the whole registry at module scope fixes both. Every lookup returns
 * the same stable component identity for the life of the page, for every caller.
 */

export type DynamicMotionComponent = ComponentType<Record<string, unknown>>;

/**
 * Every element the site actually animates. Deliberately a closed list — an
 * open factory would put us back to creating components on demand.
 */
const REGISTRY = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  footer: motion.footer,
  nav: motion.nav,
  figure: motion.figure,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  a: motion.a,
  button: motion.button,
} as unknown as Record<string, DynamicMotionComponent>;

/**
 * Look up the motion component for an element type.
 *
 * Falls back to `motion.div` rather than creating one on the fly: an unknown tag
 * is a caller bug, and silently minting a fresh component type would reintroduce
 * exactly the remount problem this module exists to prevent.
 */
export function createMotion(as: ElementType): DynamicMotionComponent {
  if (typeof as === 'string' && as in REGISTRY) return REGISTRY[as];
  return REGISTRY.div;
}
