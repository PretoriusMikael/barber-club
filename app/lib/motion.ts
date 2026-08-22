"use client";

/**
 * Capability gates for the motion + 3D layer.
 *
 * The rule from the blueprint: if visual ambition and speed ever conflict,
 * speed wins. These helpers are how that rule is enforced in code — the WebGL
 * scene refuses to mount on low-end devices rather than shipping a 12fps hero
 * to someone on a budget Android over mobile data.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface NavigatorWithCapabilities extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/**
 * Conservative gate for mounting the WebGL scene. Any failure → static fallback.
 * Thresholds are deliberately cautious; loosen them only with field data from
 * real devices, not from a desktop dev machine.
 */
export function canRender3D(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;

  const nav = navigator as NavigatorWithCapabilities;

  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /^(slow-2g|2g|3g)$/.test(nav.connection.effectiveType)) {
    return false;
  }
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) return false;

  // Last check: can we actually get a WebGL context at all?
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

/** Clamp helper used by the scroll-scrub logic. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}
