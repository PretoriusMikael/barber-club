"use client";

import { useEffect } from "react";
import { site } from "@/content/site";
import {
  expectReady,
  hasCurtain,
  markCurtainSeen,
  setCurtainPhase,
  signalReady,
  useCurtainPhase,
} from "@/lib/curtain";
import { renderTier } from "@/lib/motion";

/**
 * THE CUT — the loading screen.
 *
 * An ink panel with the wordmark and a brass hairline resting across it. The
 * hairline draws as the page loads; when everything is ready it becomes the cut
 * line, the screen parts along it, and the wordmark splits with it.
 *
 * WHY A LOADER AT ALL, GIVEN IT COSTS LCP
 *
 * Because the alternative was worse. Mounting three.js costs ~1.9s of
 * main-thread blocking (measured: 3235ms of long tasks with the scissor against
 * 1304ms without), and it was landing in the middle of the headline's word-by-
 * word entrance — so the words froze mid-animation and then snapped to their
 * end state. Deferring the mount only moves the stall somewhere else. Covering
 * it is the only option that makes the block genuinely free, because a panel
 * animating on the compositor cannot be stuttered by a busy main thread.
 *
 * So this is not decoration that costs performance. It is what buys the hero
 * its entrance back, and the scissor is already in place when the panels part
 * rather than appearing a second later.
 *
 * The honest cost: covering the hero delays measured LCP by roughly the
 * loader's duration on the first page view of a session. `curtain-skip` keeps
 * it to that one view.
 *
 * FOUR WAYS THIS IS NOT ALLOWED TO TRAP ANYONE
 *
 * 1. No JS at all — `.no-js #curtain { display: none }` in globals.css. The
 *    inline script in layout.tsx drops `no-js` before first paint, so if
 *    scripting is off the curtain was never visible.
 * 2. JS runs but React never hydrates — a pure-CSS failsafe fades the whole
 *    thing out at 3s regardless of anything this component does. It is on the
 *    outer element while the split is on the inner halves, so the two can never
 *    fight over the same property.
 * 3. A readiness signal never arrives — the race is capped at 2.2s.
 * 4. Scroll is locked from an effect, never from CSS, so a failed hydration
 *    cannot leave the page unscrollable.
 */

/* Both are measured from NAVIGATION START, not from when this effect happens to
 * run, and that distinction turned out to matter enormously. Timing the cap
 * from the effect meant hydration time was silently added to it: on a throttled
 * device where React took 2.5s to get here, a "2.2s cap" held the panel up for
 * 4.7s. `performance.now()` is already relative to the time origin, so reading
 * it directly gives time-since-navigation for free — and it self-corrects, since
 * a cap that has already elapsed opens the curtain at once instead of starting
 * a fresh countdown. */

/** Never shorter than this, or it reads as a flash rather than an arrival. */
const FLOOR_MS = 900;
/** Never longer than this, whatever has not finished loading. */
const CAP_MS = 2200;
/**
 * Only a fallback. The unmount is driven by the panel's own `animationend`, so
 * the duration lives in exactly one place (`--curtain-split` in globals.css)
 * and the two can never drift apart. This exists for the case where the event
 * never arrives at all — a panel that was display:none'd mid-flight, say.
 * Timing it instead of listening measured over a second late under load,
 * because a `setTimeout` waits behind whatever the main thread is doing.
 */
const SPLIT_FALLBACK_MS = 1400;

export function Curtain() {
  const phase = useCurtainPhase();

  useEffect(() => {
    // Repeat visit within the session: the inline script already hid it, so
    // just release everything behind it. Applied here as an update rather than
    // during render, which is what keeps the server and client trees identical.
    if (!hasCurtain()) {
      setCurtainPhase("open");
      return;
    }

    markCurtainSeen();

    // The panel covers the viewport, so scrolling behind it is meaningless.
    // Locked from JS on purpose — see note 4 above.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* --- What we are actually waiting for --------------------------------- */
    const waits: Promise<unknown>[] = [];

    // The display face. Without this the wordmark can swap mid-animation, and
    // the headline behind would reflow the instant it is revealed.
    waits.push(
      document.fonts ? document.fonts.ready.catch(() => undefined) : Promise.resolve()
    );

    // The hero photograph, decoded — not merely fetched. `decode()` resolves
    // after the browser has the pixels ready to paint, which is the difference
    // between revealing the hero and revealing an empty box that fills in.
    const heroImg = document.querySelector<HTMLImageElement>("img[data-hero]");
    if (heroImg) {
      waits.push(
        heroImg.decode
          ? heroImg.decode().catch(() => undefined)
          : Promise.resolve()
      );
    }

    // The 3D scene's first frame — but only where there is going to be one.
    // renderTier() returns null on Data Saver, 2G/3G and without WebGL, and
    // waiting for a scene that will never mount would spend the full cap.
    if (renderTier() !== null) {
      waits.push(expectReady("scene"));
    }

    /* --- The race ---------------------------------------------------------- */
    let opened = false;

    const open = () => {
      if (opened) return;
      opened = true;
      setCurtainPhase("opening");
      // Release the scroll lock as the panels start moving, not after — the
      // page underneath should already be interactive as it is revealed.
      document.body.style.overflow = prevOverflow;
      window.setTimeout(() => setCurtainPhase("open"), SPLIT_FALLBACK_MS);
    };

    const cap = window.setTimeout(open, Math.max(0, CAP_MS - performance.now()));

    Promise.all(waits).then(() => {
      // Honour the floor: if everything was ready in 200ms, still hold the
      // panel long enough for the hairline to finish its draw.
      window.setTimeout(open, Math.max(0, FLOOR_MS - performance.now()));
    });

    return () => {
      window.clearTimeout(cap);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Signal the scene as ready if it turns out no scene is coming after all —
  // covered by the renderTier check above, but harmless belt and braces.
  useEffect(() => {
    if (renderTier() === null) signalReady("scene");
  }, []);

  // Fully open: unmount it. Leaving a fixed, full-viewport element in the DOM
  // — even at opacity 0 — keeps a composited layer alive for the whole visit.
  if (phase === "open") return null;

  return (
    <div
      id="curtain"
      className={phase === "opening" ? "is-opening" : undefined}
      // The panel is an interstitial, not content. Screen readers should be
      // reading the page underneath, which is fully present in the markup.
      aria-hidden
    >
      {/* Each half clips a full-height copy of the wordmark, offset so the two
          together read as one line. `overflow: hidden` does the splitting, so
          there is no clip-path seam to go wrong at any font size. */}
      <div
        className="curtain-half curtain-top"
        // The panels are gone the instant this fires; anything later is a
        // full-viewport composited layer sitting on the page doing nothing.
        onAnimationEnd={() => setCurtainPhase("open")}
      >
        <div className="curtain-inner">
          <span className="curtain-mark">{site.name}</span>
        </div>
      </div>
      <div className="curtain-half curtain-bottom">
        <div className="curtain-inner">
          <span className="curtain-mark">{site.name}</span>
        </div>
      </div>
      <span className="curtain-hair" />
    </div>
  );
}
