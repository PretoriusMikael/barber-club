"use client";

import { useCallback } from "react";
import { signalReady } from "@/lib/curtain";

/**
 * The scissor as a picture, for every device that was never going to benefit
 * from it being a scene.
 *
 * WHY THIS EXISTS
 *
 * On a phone the WebGL scissor was rendering at 390x844 against a 1170x2532
 * screen — 33% resolution per axis, 11% of the pixels — with antialiasing off
 * and, worst of all, normal maps disabled, which put the blades back to the flat
 * uniform fills that the whole material pass existed to fix. It looked like a
 * low-resolution render upscaled, because it was one.
 *
 * And it was doing that at enormous cost for no interaction, because the thing
 * WebGL buys here is pointer parallax — and a touch device has no pointer. After
 * the arrival the mobile scene never moved again. So roughly 226 KB gz of
 * three.js, a shader compile and a live WebGL context were being spent to
 * produce a still image, badly.
 *
 * This is the same still image, produced properly: rendered from that exact
 * scene at a viewport which is a pixel-for-pixel 3x of a phone, so the pose maths
 * lands on identical numbers rather than being re-derived by eye. 28 KB, sharp at
 * any density, no context, no compile.
 *
 * WHAT IS LOST: the blades no longer snip. A still cannot. The arrival is
 * reproduced below in CSS — it was only ever position, rotation and scale — but
 * the cut itself is a desktop moment now.
 *
 * PLACEMENT is expressed as fractions of the hero box, taken from the alpha
 * bounding box of the render rather than measured off a screenshot, so the image
 * lands exactly where WebGL drew it. Both orientations are in globals.css.
 */
export function ScissorStill({ animate }: { animate: boolean }) {
  // The loading screen waits on this the same way it waits on the WebGL scene's
  // first frame — same signal, so the curtain does not need to know which of the
  // two it got.
  const onReady = useCallback(() => signalReady("scene"), []);

  return (
    <picture>
      {/* `<picture>` rather than two positioned <img>s: a hidden img still
          downloads, and these are different crops of different sizes. Only the
          matching source is ever fetched. */}
      <source
        media="(orientation: landscape)"
        srcSet="/scissor/scissor-landscape.webp"
        width={674}
        height={966}
      />
      {/* A bare <img>, not next/image: next/image cannot express "position
          this by the alpha bounds of the source", and there is nothing for the
          optimiser to do — the asset is already a cropped WebP at its final
          density, and it must stay inside <picture> for the source switch. */}
      <img
        src="/scissor/scissor-portrait.webp"
        alt=""
        aria-hidden
        width={534}
        height={955}
        decoding="async"
        onLoad={onReady}
        onError={onReady}
        className={animate ? "scissor-still scissor-still-arrive" : "scissor-still"}
      />
    </picture>
  );
}
