"use client";

import { useSyncExternalStore } from "react";

/**
 * The state the loading screen and everything behind it share.
 *
 * Three components need to agree on one timeline and none of them are near each
 * other in the tree: the Curtain (in the root layout) runs the sequence,
 * HeroHeadline (four levels down) must not spend its word-by-word entrance
 * while a panel is covering it, and HeroScissor must mount three.js *behind*
 * the curtain so its ~1.9s of parse and shader compile lands where nothing
 * visible is animating. Prop-drilling that through the layout would mean making
 * half the tree client components; a tiny external store keeps it to the three
 * that actually care.
 *
 * `useSyncExternalStore` rather than context for the same reason OpenNow and
 * useHydrated use it: the value is genuinely external to React, and the server
 * snapshot is explicit — which is what stops this becoming the fourth hydration
 * mismatch in this codebase. `getServerSnapshot` returns "closed", and the
 * client's first render returns "closed" too, ALWAYS, even on a repeat visit
 * where the curtain is skipped. The skip is applied as an ordinary update after
 * mount. Deciding it during render would put the server and the client on
 * different trees.
 */

export type CurtainPhase =
  /** Panel is down. Nothing behind it should be animating. */
  | "closed"
  /** Panels are parting. This is the moment the hero entrance starts. */
  | "opening"
  /** Gone. */
  | "open";

let phase: CurtainPhase = "closed";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useCurtainPhase(): CurtainPhase {
  return useSyncExternalStore(
    subscribe,
    () => phase,
    () => "closed" as const
  );
}

export function setCurtainPhase(next: CurtainPhase) {
  if (phase === next) return;
  phase = next;
  emit();
}

/* --- Readiness -------------------------------------------------------------
 * What the curtain waits for. Each is resolved once; the curtain races the set
 * against a hard cap, so a signal that never arrives can only ever cost the
 * difference between the floor and the cap — never the whole visit.
 * -------------------------------------------------------------------------- */

export type ReadySignal = "fonts" | "hero" | "scene";

const pending = new Set<ReadySignal>();
const resolvers = new Map<ReadySignal, () => void>();

/** Register a signal the curtain should wait for. Call before the race starts. */
export function expectReady(signal: ReadySignal): Promise<void> {
  if (!pending.has(signal)) {
    pending.add(signal);
    return new Promise<void>((resolve) => resolvers.set(signal, resolve));
  }
  return Promise.resolve();
}

/** Mark a signal satisfied. Safe to call more than once, or never. */
export function signalReady(signal: ReadySignal) {
  const resolve = resolvers.get(signal);
  if (resolve) {
    resolvers.delete(signal);
    pending.delete(signal);
    resolve();
  }
}

/**
 * Whether a curtain is covering the page on THIS page view.
 *
 * HeroScissor needs this to decide when it may mount. Behind a curtain it can
 * mount immediately, because a 1.9s main-thread block is invisible if nothing
 * visible is moving. Without one — a repeat visit within the session — it has
 * to wait out the headline entrance instead, or it stutters the very animation
 * the curtain exists to protect.
 *
 * Read from the `<html>` class the inline script in layout.tsx sets before
 * first paint, so it is correct on the very first client render.
 */
export function hasCurtain(): boolean {
  if (typeof document === "undefined") return true;
  return !document.documentElement.classList.contains("curtain-skip");
}

/** Remember that this session has seen it, so it stays an arrival not a toll. */
export function markCurtainSeen() {
  try {
    sessionStorage.setItem("bc:curtain", "1");
  } catch {
    // Private mode, storage disabled — the curtain simply shows again. Harmless.
  }
}
