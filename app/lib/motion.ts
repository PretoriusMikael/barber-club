"use client";

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
 * What the hero scene is allowed to be on this device.
 *
 *   "high"  full scene: antialiasing, clearcoat, anisotropic steel, pointer
 *           parallax, DPR up to 1.6.
 *   "low"   the same model at DPR 1, no antialiasing, no clearcoat, and no
 *           per-frame pointer tracking. Costs roughly a third of "high" and
 *           still reads as a lit metal object rather than a flat graphic.
 *   "still" one frame, drawn once, never again. This is what reduced-motion
 *           gets: a static 3D render is a picture, not an animation, and
 *           deleting it entirely was answering a request for less movement by
 *           removing an image.
 *   null    no scene at all. No WebGL, Data Saver on, or a 2G/3G connection.
 *
 * Thresholds stay conservative, but they no longer disqualify the mid-range
 * Android that most of this site's traffic is actually on: `hardwareConcurrency
 * <= 4` ruled out every 4-core phone AND a fair number of laptops, and
 * `deviceMemory < 4` ruled out most Android handsets outright, so in practice
 * the "3D hero" was a desktop-only easter egg.
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

  const cores = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 8;
  const memory = typeof nav.deviceMemory === "number" ? nav.deviceMemory : 8;
  const narrow = window.matchMedia("(max-width: 767px)").matches;

  if (cores < 4 || memory < 3) return "low";
  // Phones get the cheaper scene regardless of what they claim about cores —
  // a thermally throttled 8-core handset is not an 8-core desktop.
  if (narrow && (cores < 8 || memory < 6)) return "low";

  return "high";
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
