"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { renderTier, type RenderTier } from "@/lib/motion";

/**
 * Mount gate and scroll behaviour for the hero scissor.
 *
 * LCP protection (the hero is the one place WebGL could hurt):
 *   1. The hero's LCP element is the photograph. This canvas is transparent and
 *      purely additive — the hero renders complete and readable with no 3D.
 *   2. The scene mounts after first paint, so three.js never competes with the
 *      hero for bandwidth or main thread.
 *   3. renderTier() decides what the device can afford: nothing on Data Saver
 *      or 2G/3G, a cheaper scene on low-core/low-memory hardware and on phones,
 *      a single static frame under prefers-reduced-motion.
 *   4. The canvas renders on demand and stops completely once the hero leaves
 *      the viewport.
 *
 * If it never arrives, nothing is missing. It was never load-bearing.
 *
 * --- The bug this rewrite fixes ------------------------------------------
 *
 * The mount used to be `requestIdleCallback(start, { timeout: 2500 })`, with a
 * `setTimeout` used only as a substitute where rIC does not exist. On a page
 * that starts life in a background tab — restored session, opened in a new tab,
 * link opened from a messaging app, or simply a browser window that is not
 * focused — Chrome does not run idle callbacks at all, and the rIC timeout does
 * not rescue it either: it is honoured relative to the page becoming visible,
 * not to wall-clock time. The result was a hero with no scissor, silently,
 * forever, on a load path that is extremely common for a link shared in a
 * WhatsApp group. Which is how this site gets shared.
 *
 * It was found by loading the page in a hidden tab and counting canvases: zero.
 *
 * The fix is to treat "first paint has happened" as the actual precondition and
 * satisfy it from whichever signal arrives first — idle, a hard timer, or the
 * page becoming visible.
 */

const ScissorScene = dynamic(() => import("./ScissorScene"), { ssr: false });

/** Hard ceiling on the wait, whatever the browser is doing with idle time. */
const MOUNT_DEADLINE_MS = 1200;

export function HeroScissor() {
  const [tier, setTier] = useState<RenderTier>(null);
  const [mounted, setMounted] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  // Rendering is suspended entirely while the hero is off screen. Starts true
  // because the hero is, by definition, at the top of the page.
  const [inView, setInView] = useState(true);

  /* --- Mount after first paint, from whichever signal lands first -------- */
  useEffect(() => {
    let done = false;
    let idle: number | undefined;

    const start = () => {
      if (done) return;
      done = true;
      const t = renderTier();
      if (!t) return;
      setTier(t);
      setMounted(true);
    };

    // `typeof` rather than `in`: TS treats `"requestIdleCallback" in window` as
    // exhaustive (the lib types declare it), narrowing the else branch to never.
    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(start, { timeout: MOUNT_DEADLINE_MS });
    }
    // Always armed, not just as an rIC substitute — this is the guarantee.
    const timer = window.setTimeout(start, MOUNT_DEADLINE_MS);
    // And if the tab was hidden the whole time, mount the moment it is not.
    document.addEventListener("visibilitychange", start, { once: true });

    return () => {
      done = true;
      if (idle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idle);
      }
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  /* --- Suspend when the hero is off screen -------------------------------
   * A decorative canvas holding a WebGL context three screens above the
   * viewport is pure cost. The observer unmounts the scene entirely rather than
   * just pausing it, which also releases the context on a long session. */
  useEffect(() => {
    const el = wrap.current;
    if (!el || !mounted) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

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

      {mounted && tier && inView ? <ScissorScene tier={tier} /> : null}
    </motion.div>
  );
}
