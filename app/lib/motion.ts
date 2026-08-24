"use client";

import { useSyncExternalStore } from "react";

/**
 * The motion vocabulary, and the capability gates for the 3D layer.
 *
 * The rule from the blueprint stands: if visual ambition and speed ever
 * conflict, speed wins. What changed is that "speed wins" no longer has to mean
 * "nobody on a phone sees the hero". A single boolean gate could only choose
 * between the full scene and nothing, so it was tuned for the worst device that
 * might ever hit it — and then everyone got the worst-device answer. A tier
 * picks the scene the device can actually hold.
 */

/* --- Easing -----------------------------------------------------------------
 * The same two curves as globals.css, as coefficient arrays for the JS layer.
 * Keeping one vocabulary in both places is what stops CSS transitions and
 * motion animations from feeling like two different products.
 * -------------------------------------------------------------------------- */

/** Confident arrival. Most of the distance is covered early. */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Anything leaving, and anything the user is waiting on. */
export const EASE_SWIFT: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface NavigatorWithCapabilities extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/**
 * What the hero scissor is allowed to be on this device.
 *
 *   "high"  A live WebGL scene: antialiasing, clearcoat, the hollow-ground
 *           normal map, and pointer parallax.
 *   "low"   A pre-rendered picture of that same scene, with the arrival
 *           reproduced in CSS. See components/three/ScissorStill.tsx.
 *   "still" The same picture, not animated. What reduced motion gets.
 *   null    Nothing. No WebGL context, Data Saver on, or a 2G/3G connection.
 *
 * THE RULE CHANGED, AND THE REASON IS WORTH KEEPING.
 *
 * "low" used to mean a cut-down WebGL scene, and it was the worst of both: DPR
 * pinned to 1 on a 3x screen, antialiasing off, normal maps off — so a phone got
 * an object rendered at 11% of its screen's pixels with the material work
 * disabled, and paid 226 KB gz of three.js plus a shader compile for it.
 *
 * The thing WebGL actually buys on this page is pointer parallax. A touch device
 * has no pointer, so its scene never moved after the arrival: the entire context
 * existed to produce a still image. Now it gets a still image — the same one,
 * rendered from the same scene at 3x, sharp at any density, for 28 KB.
 *
 * Hence the first check below is capability, not horsepower. A phone is not
 * excluded for being slow; it is excluded for having nothing to interact with.
 */

export type RenderTier = "high" | "low" | "still" | null;

export function renderTier(): RenderTier {
  if (typeof window === "undefined") return null;

  const nav = navigator as NavigatorWithCapabilities;

  // Explicit user and network signals are absolute — no tier survives them.
  if (nav.connection?.saveData) return null;
  if (nav.connection?.effectiveType && /^(slow-2g|2g|3g)$/.test(nav.connection.effectiveType)) {
    return null;
  }

  // Last hard gate: can we get a context at all?
  let hasWebGL = false;
  try {
    const canvas = document.createElement("canvas");
    hasWebGL = Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl")
    );
  } catch {
    hasWebGL = false;
  }
  if (!hasWebGL) return null;

  if (prefersReducedMotion()) return "still";

  // No hover and a coarse pointer means a touch device: there is no cursor for
  // the scene to answer, so the scene would be a still image with extra steps.
  const noPointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (noPointer) return "low";

  const cores = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 8;
  const memory = typeof nav.deviceMemory === "number" ? nav.deviceMemory : 8;
  const narrow = window.matchMedia("(max-width: 767px)").matches;

  if (cores < 4 || memory < 3) return "low";
  if (narrow) return "low";

  return "high";
}

/**
 * The tier as a hook, resolved after hydration.
 *
 * `renderTier()` reads matchMedia and navigator, so it can only answer on the
 * client — which makes it exactly the shape `useSyncExternalStore` exists for,
 * and the same pattern as hooks/useHydrated.ts. The server snapshot is null, so
 * the server and the first client render agree and hydration cannot mismatch;
 * the real tier arrives as an ordinary update.
 *
 * Reading it in an effect and calling setState was the obvious alternative and
 * the repo's lint rejects it, correctly: it is a cascading render for a value
 * that never changes after mount.
 *
 * Cached because the answer cannot change for the life of the page and
 * getSnapshot must return a referentially stable value or React re-renders
 * forever.
 */
let cachedTier: RenderTier | undefined;

const subscribeToNothing = () => () => {};

export function useRenderTier(): RenderTier {
  return useSyncExternalStore(
    subscribeToNothing,
    () => (cachedTier !== undefined ? cachedTier : (cachedTier = renderTier())),
    () => null
  );
}

/**
 * Kept as a boolean for call sites that only need "is there a scene at all".
 * @deprecated prefer renderTier() — it can distinguish low from none.
 */
export function canRender3D(): boolean {
  const tier = renderTier();
  return tier !== null;
}

/** Clamp helper used by the scroll-scrub logic. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation, for frame-rate-independent damping. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Frame-rate-independent damping factor.
 *
 * `lerp(current, target, 0.1)` per frame is the usual shorthand for smoothing,
 * and it is wrong: at 120fps it converges twice as fast as at 60fps, so the
 * scissor's pointer-follow feels different on a ProMotion display than on a
 * cheap panel. `smoothing` is the fraction of the remaining distance left after
 * one second; this converts it to a per-frame factor for the delta actually
 * elapsed.
 */
export function damp(delta: number, smoothing = 0.0006): number {
  return 1 - Math.pow(smoothing, delta);
}
