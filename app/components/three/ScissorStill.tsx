"use client";

import { useCallback, useRef, useState } from "react";
import { signalReady } from "@/lib/curtain";

/**
 * The scissor as a picture, for every device that was never going to benefit
 * from it being a scene — and it snips when you tap it.
 *
 * WHY THIS EXISTS
 *
 * On a phone the WebGL scissor rendered at 390x844 against a 1170x2532 screen —
 * 33% resolution per axis, 11% of the pixels — with antialiasing off and normal
 * maps disabled, which put the blades back to the flat uniform fills the whole
 * material pass existed to fix. And it did that at enormous cost for no
 * interaction, because what WebGL buys here is pointer parallax and a touch
 * device has no pointer. Roughly 226 KB gz of three.js, a shader compile and a
 * live context, to produce a still image, badly.
 *
 * TWO FRAMES, ONE FILE
 *
 * The asset is a sprite: blades closed on top, blades open beneath, both
 * rendered from the real scene at a viewport that is a pixel-exact 3x of a
 * phone. Both frames are cropped to the UNION of their alpha bounds, so they
 * share one coordinate frame — crop each to its own bounds and the pivot lands
 * somewhere different in each, and the snip reads as a glitch instead of a
 * hinge.
 *
 * Stepping between the two rows is what makes the blades move. It is a
 * two-position animation rather than a smooth articulation, which is honest
 * about what a picture can do: a real snip is fast enough that two frames read
 * as a cut rather than as stop-motion, and the travel underneath it is
 * continuous.
 *
 * A `<div>` with a background rather than an `<img>` inside a `<picture>`: the
 * frame swap is a background-position step, which scales with the element,
 * whereas object-position on a scaled img does not. The orientation switch
 * moves into CSS with it, and the browser still only fetches the matching one.
 */

/** Matches SNIP_DURATION in scissorPose.ts and the keyframes in globals.css. */
const SNIP_MS = 885;

export function ScissorStill({ animate }: { animate: boolean }) {
  // The loading screen waits on this the same way it waits on the WebGL
  // scene's first frame — same signal, so it need not know which it got.
  const onReady = useCallback(() => signalReady("scene"), []);
  const [snipping, setSnipping] = useState(false);
  const timer = useRef<number | null>(null);

  const snip = useCallback(() => {
    // Restart rather than ignore: tapping twice should cut twice, and a
    // one-shot that swallows the second tap reads as broken.
    if (timer.current) window.clearTimeout(timer.current);
    setSnipping(false);
    // Two frames of gap so the class removal actually lands before it is
    // re-added; without it React batches both and the animation never restarts.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setSnipping(true);
        timer.current = window.setTimeout(() => setSnipping(false), SNIP_MS);
      })
    );
  }, []);

  return (
    <div
      className={`scissor-still${snipping ? " scissor-still-snip" : ""}${
        animate ? " scissor-still-arrive" : ""
      }`}
      /* The wrapper above is pointer-events:none so the canvas can never
         swallow a tap meant for the Book button. This one opts back in for
         itself alone — it is a small box over empty hero, nowhere near a
         control. `role`/`aria-hidden` stay off the a11y tree: it is decoration
         that happens to react, not a control, and there is nothing behind it
         that a keyboard user would be missing. */
      onPointerDown={snip}
      aria-hidden
      // Signals the curtain once the sprite has actually painted.
      ref={(el) => {
        if (!el) return;
        const url = getComputedStyle(el).backgroundImage.match(/url\("?([^")]+)"?\)/)?.[1];
        if (!url) return onReady();
        const img = new Image();
        img.onload = onReady;
        img.onerror = onReady;
        img.src = url;
      }}
    />
  );
}
