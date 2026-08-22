"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Matches a media query, safely across SSR.
 *
 * Returns `false` on the server, so whatever you render for the "no match" case
 * is what gets server-rendered and indexed. That matters: it means the
 * mobile/fallback layout is the one in the HTML, and the enhanced desktop
 * layout is applied after mount — not the other way round.
 *
 * Uses useSyncExternalStore rather than useEffect + setState. A media query is
 * genuinely external state, and this avoids the cascading render that a
 * setState-in-effect causes on every mount.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
