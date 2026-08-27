'use client';

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';

/**
 * Scroll reveal.
 *
 * Three gestures, chosen by what the content IS — the variants themselves live
 * in globals.css under `[data-reveal]`:
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
 * WHY THIS IS CSS AND NOT `motion`
 *
 * It used to be motion. Measured, on a clean production build: `motion` costs
 * ~49 KB of parser-blocking JavaScript, and because this component appears in
 * every section of every page — and `ui/Section.tsx` imports it, so even the
 * legal pages pulled it in through `<Container>` — that 49 KB sat on the
 * critical path of every route on the site. For an opacity change and a 24px
 * translate. On South African mobile data that is a real cost, charged to every
 * visitor, for an effect a CSS transition performs identically and on the
 * compositor.
 *
 * Pages that genuinely need motion (the hero parallax, the pinned tier
 * comparison, the gallery lightbox) still load it. The pages that only ever
 * wanted a fade no longer do: /branches and /book drop it entirely.
 *
 * FOUR GUARANTEES, ALL STRONGER THAN BEFORE
 *
 *   1. CONTENT IS NEVER HIDDEN BEHIND JS. The `.no-js [data-reveal]` rule in
 *      globals.css uses `!important` and releases opacity, transform, filter
 *      and clip-path. A blank booking page is a business outage, not a visual
 *      bug.
 *   2. NO HYDRATION HAZARD. The hidden state is a stylesheet rule, not an
 *      inline style written during SSR, so there is nothing for the server and
 *      the client to disagree about. The previous version had to derive its
 *      reduced-motion variants from the animated ones specifically to keep the
 *      two byte-identical; that entire class of bug is now unreachable.
 *   3. REDUCED MOTION IS HONOURED IN CSS. The `prefers-reduced-motion` block in
 *      globals.css forces every `[data-reveal]` visible. No JS branch, no media
 *      query read during render, and it applies before hydration rather than
 *      after it.
 *   4. NOTHING ANIMATES LAYOUT. Every variant moves opacity, transform or
 *      clip-path only, so a reveal can never reflow the page under the reader.
 *
 * ONE OBSERVER, NOT THIRTY-SIX. The home page has 36 reveals and the old
 * version created an IntersectionObserver per component through `useInView`.
 * They share one here, created lazily on first use.
 */

export type RevealVariant = 'rise' | 'mask' | 'frame';

let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  sharedObserver ??= new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        /* `isIntersecting` alone is not enough, and the failure is invisible
           until someone flicks.

           An IntersectionObserver computes intersection at DELIVERY time, not
           continuously. Scroll fast enough and an element can enter and leave
           the viewport between two delivery cycles — the observer then reports
           it once, as NOT intersecting, and a block the reader has already
           scrolled past stays at opacity 0 for the rest of the visit. Measured
           here at 10,000px/s: 24 of 33 reveals on the home page never fired.
           A hard flick on a phone is well within that range.

           So: also release anything the viewport has already passed. A negative
           `top` means the element is above the fold line — whether we saw it
           arrive or not, the reader has, and hiding it now would be a bug they
           can see rather than an animation they cannot. */
        if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) continue;
        // The attribute is the trigger; globals.css owns what it looks like.
        (entry.target as HTMLElement).setAttribute('data-shown', '');
        // Once only. An element that has arrived never needs watching again.
        observer.unobserve(entry.target);
      }
    },
    {
      // Fire once the block is properly into the viewport rather than the
      // instant its first pixel appears, so the motion is something you watch
      // happen instead of something already finished when you get there.
      rootMargin: '0px 0px -15% 0px',
    }
  );
  return sharedObserver;
}

function useRevealTrigger<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = getObserver();
    if (!observer) {
      // No IntersectionObserver at all. Show the content rather than leave it
      // at opacity 0 — the reveal is decoration, the content is the product.
      el.setAttribute('data-shown', '');
      return;
    }

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return ref;
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
  const ref = useRevealTrigger<HTMLElement>();

  /* A staggering group carries no visual state of its own — it is the thing the
     observer watches, and the schedule its children read. The per-child offset
     is done with `:nth-child` in globals.css rather than an index prop, so call
     sites stay a plain `.map()` and nothing has to thread a counter through. */
  const style = staggerChildren
    ? ({
        '--reveal-stagger': `${stagger}ms`,
        '--reveal-delay-base': `${delay}ms`,
      } as CSSProperties)
    : delay
      ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties)
      : undefined;

  return createElement(
    as,
    {
      ref,
      className,
      style,
      ...(staggerChildren ? { 'data-reveal-group': '' } : { 'data-reveal': variant }),
    },
    children
  );
}

/**
 * A direct child of a staggering <Reveal>.
 *
 * It carries no trigger of its own: the group is what the observer watches, and
 * `[data-reveal-group][data-shown] [data-reveal]` in globals.css releases the
 * whole set together, offset per child.
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
  return createElement(as, { className, 'data-reveal': variant }, children);
}
