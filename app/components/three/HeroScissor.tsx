"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { canRender3D } from "@/lib/motion";
import { CUT_AT_VIEWPORT_FRACTION } from "./scissorPose";

/**
 * Mount gate for the hero scissor.
 *
 * The scissor is anchored IN the hero — it does not follow the page. It holds
 * one pose, snaps shut once as the user starts scrolling away, and is then
 * completely static, scrolling out of frame with the rest of the hero.
 *
 * LCP protection (the hero is the one place WebGL could hurt):
 *   1. The hero's LCP element is the poster image. This canvas is transparent
 *      and purely additive — the hero renders complete and readable with no 3D.
 *   2. The scene mounts on requestIdleCallback AFTER first paint, so three.js
 *      never competes with the hero for bandwidth or main thread.
 *   3. canRender3D() still applies: nothing on low-end devices, saveData,
 *      2G/3G, or prefers-reduced-motion.
 *   4. The canvas renders on demand — it is idle except during the cut itself.
 *
 * If it never arrives, nothing is missing. It was never load-bearing.
 */

const ScissorScene = dynamic(() => import("./ScissorScene"), { ssr: false });

export function HeroScissor() {
  const [mounted, setMounted] = useState(false);
  const [cutting, setCutting] = useState(false);
  // Captured at mount: was the hero already scrolled past when we appeared?
  const [startClosed, setStartClosed] = useState(false);

  /* --- Mount after first paint ----------------------------------------- */
  useEffect(() => {
    let idle: number | undefined;
    let timeout: number | undefined;

    const start = () => {
      if (!canRender3D()) return;
      const past = window.scrollY > window.innerHeight * CUT_AT_VIEWPORT_FRACTION;
      setStartClosed(past);
      setCutting(past);
      setMounted(true);
    };

    // `typeof` rather than `in`: TS treats `"requestIdleCallback" in window` as
    // exhaustive (the lib types declare it), narrowing the else branch to never.
    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(start, { timeout: 2500 });
    } else {
      timeout = window.setTimeout(start, 900);
    }

    return () => {
      if (idle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idle);
      }
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  /* --- Cut trigger ------------------------------------------------------
   * The only thing scroll does now. Once fired, the listener detaches — there
   * is nothing further to watch, and a scroll handler that outlives its purpose
   * is a cost paid on every frame of the rest of the visit. */
  useEffect(() => {
    if (!mounted || cutting) return;

    const onScroll = () => {
      if (window.scrollY > window.innerHeight * CUT_AT_VIEWPORT_FRACTION) {
        setCutting(true);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted, cutting]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      // Absolute, not fixed: it belongs to the hero and leaves with it.
      // Below the copy in the stacking order so text always wins.
      className="pointer-events-none absolute inset-0 z-[5]"
    >
      <ScissorScene cutting={cutting} startClosed={startClosed} />
    </div>
  );
}
