"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRenderTier } from "@/lib/motion";
import { hasCurtain } from "@/lib/curtain";
import { ScissorStill } from "./ScissorStill";

/**
 * Mount gate and scroll behaviour for the hero scissor.
 *
 * LCP protection (the hero is the one place WebGL could hurt):
 *   1. The hero's LCP element is the photograph. This canvas is transparent and
 *      purely additive — the hero renders complete and readable with no 3D.
 *   2. The scene mounts after first paint, and behind the loading screen where
 *      there is one, so three.js never competes for bandwidth or main thread.
 *   3. renderTier() decides what the device can afford: nothing on Data Saver
 *      or 2G/3G, a cheaper scene on low-core/low-memory hardware and on phones,
 *      a single static frame under prefers-reduced-motion.
 *   4. The canvas renders on demand and stops completely once the hero leaves
 *      the viewport.
 *
 * If it never arrives, nothing is missing. It was never load-bearing.
 *
 * Mount timing — including the background-tab bug that used to leave the hero
 * with no scissor at all — is documented on the constants below.
 */

/**
 * Only the "high" tier ever reaches this import, so three.js is not merely
 * deferred on a phone — it is never requested at all. Everything else gets
 * ScissorStill, which is a 28 KB picture and no chunk.
 */
const ScissorScene = dynamic(() => import("./ScissorScene"), { ssr: false });

/**
 * How long to wait before mounting three.js, and why there are two answers.
 *
 * Mounting costs about 1.9s of main-thread blocking (measured: 3235ms of long
 * tasks with the scene against 1304ms without, production build, 4x CPU
 * throttle). Nothing makes that free — the only question is what it lands on.
 *
 * BEHIND THE CURTAIN it lands on nothing. The loading screen's panels animate
 * on the compositor, so a blocked main thread cannot touch them, and the work
 * happens while the visitor is looking at a still wordmark. Mount at once: the
 * curtain waits for the scene's first frame anyway, so every millisecond spent
 * idling here is a millisecond the loading screen stays up.
 *
 * WITHOUT ONE — a repeat visit inside the session — the block would land square
 * on the headline's word-by-word entrance, which is exactly the stutter this
 * whole exercise started with. So wait out the entrance first: the second line
 * finishes around 830ms, and 1100ms clears it with room.
 */
const MOUNT_BEHIND_CURTAIN_MS = 0;
const MOUNT_AFTER_ENTRANCE_MS = 1100;

export function HeroScissor() {
  // Resolved after hydration; null on the server and on the first client render.
  const tier = useRenderTier();
  // Only the WebGL scene has a mount worth scheduling, so only it needs a gate.
  const [sceneReady, setSceneReady] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  // Rendering is suspended entirely while the hero is off screen. Starts true
  // because the hero is, by definition, at the top of the page.
  const [inView, setInView] = useState(true);

  /* --- Mount ------------------------------------------------------------
   * `requestIdleCallback` used to gate this, with a `setTimeout` only as a
   * substitute where rIC does not exist. That was a real bug: on a page that
   * starts life in a background tab — restored session, opened in a new tab, a
   * link opened from a messaging app — Chrome does not run idle callbacks at
   * all, and the rIC timeout does not rescue it either, because it is honoured
   * relative to the page becoming visible rather than to wall-clock time. The
   * result was a hero with no scissor, silently, forever, on a load path that
   * is extremely common for a link shared in a WhatsApp group. Which is how
   * this site gets shared. Found by loading the page in a hidden tab and
   * counting canvases: zero.
   *
   * Idle time is no longer part of the decision. The delay is chosen from
   * whether a loading screen is covering the page, and a plain timer runs it. */
  useEffect(() => {
    if (tier !== "high") return;
    const delay = hasCurtain() ? MOUNT_BEHIND_CURTAIN_MS : MOUNT_AFTER_ENTRANCE_MS;
    const timer = window.setTimeout(() => setSceneReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [tier]);

  /* --- Suspend when the hero is off screen -------------------------------
   * A decorative canvas holding a WebGL context three screens above the
   * viewport is pure cost. The observer unmounts the scene entirely rather than
   * just pausing it, which also releases the context on a long session. */
  useEffect(() => {
    const el = wrap.current;
    if (!el || !tier) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tier]);

  /* --- Scroll handoff -----------------------------------------------------
   * As the hero leaves, the scissor lifts and fades slightly ahead of the copy
   * beside it. Two layers moving at different rates is the whole of parallax,
   * and it is what stops the hero from feeling like a flat picture being pushed
   * off the top of the screen.
   *
   * Deliberately a CSS transform on the wrapper rather than a camera move
   * inside the scene: the compositor does this for free, whereas animating the
   * scene would mean rendering a WebGL frame for every scroll event, which is
   * exactly the cost the demand frameloop exists to avoid. */
  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -130]);
  const opacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <motion.div
      ref={wrap}
      aria-hidden
      // Absolute, not fixed: it belongs to the hero and leaves with it.
      // Below the copy in the stacking order so text always wins, and
      // pointer-events off so it can never swallow a tap meant for a CTA.
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{ y, opacity, scale }}
    >
      {/* Grounding. A mirrored object floating on a flat dark field has nothing
          to be reflected in and nothing to sit against, which is most of why
          CG props look pasted on. A single soft warm pool behind it reads as
          the spill from the light that is lighting it. Pure CSS — no extra
          fragment cost in the WebGL pass. */}
      <div
        className="absolute right-0 top-0 h-[70%] w-[62%] opacity-70 md:h-[85%]"
        style={{
          background:
            "radial-gradient(closest-side at 62% 42%, rgba(200,163,90,0.14), rgba(200,163,90,0.04) 55%, transparent 78%)",
        }}
      />

      {tier && inView
        ? tier === "high"
          ? sceneReady && <ScissorScene tier={tier} />
          : <ScissorStill animate={tier === "low"} />
        : null}
    </motion.div>
  );
}
