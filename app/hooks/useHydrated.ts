"use client";

import { useSyncExternalStore } from "react";

/**
 * `false` during SSR and on the first client render; `true` from then on.
 *
 * This exists to make browser-only facts safe to branch a TREE on. The pattern
 * it solves comes up wherever the server cannot know something the client can —
 * `prefers-reduced-motion` is the case on this site, since there is no media
 * query to read on a server and `useReducedMotion()` therefore reports false
 * during SSR and true on the client for anyone who has the setting on. Deciding
 * what to render straight from that value means the two renders disagree,
 * React throws a hydration error, and the whole subtree is discarded and
 * rebuilt — and it only ever happens to the people who asked for less motion,
 * so it is easy to ship and never notice.
 *
 * Gating on this defers the divergence to an ordinary update, which React is
 * perfectly happy with:
 *
 *     const reduced = useReducedMotion();
 *     const hydrated = useHydrated();
 *     const pinned = !(hydrated && reduced);
 *
 * Note that this is only needed when the STRUCTURE changes. If the difference
 * is confined to a transition or an animation target, prefer swapping the
 * variants and leaving the markup identical — see components/ui/Reveal.tsx.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the value is
 * genuinely external to React, it never changes after the first commit, and it
 * avoids a set-state-in-effect that would trigger a second render pass. Same
 * reasoning as layout/OpenNow.tsx, which uses the wall clock the same way.
 */

/** Never fires — the value cannot change once hydration has happened. */
const subscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
