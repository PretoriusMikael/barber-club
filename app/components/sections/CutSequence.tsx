"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cutSequence } from "@/content/gallery";
import { clamp, useScrubAllowed } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/Section";

/**
 * THE CUT, SCRUBBED — scrolling advances the blade.
 *
 * A haircut is a sequence, which is the one thing a photograph cannot show and
 * the one thing scroll is good at: the reader's own scrolling drives the pass,
 * so the gesture and the content are the same motion. It lands directly above
 * the gallery on purpose — you scroll through the cut and arrive at the wall of
 * finished cuts, which makes the proof section a payoff rather than a new
 * subject.
 *
 * ⚠️  The footage is PLACEHOLDER STOCK (see content/gallery.ts and
 *     PITCH-NOTES.md §2.5). The mechanic is real; the shop in it is not.
 *
 * WHY FRAMES AND NOT A VIDEO
 *
 * Scroll-scrubbing a <video> does not work. Setting `currentTime` seeks to the
 * nearest keyframe, so the picture lurches between I-frames instead of tracking
 * the scroll, and on mobile Safari the seek is throttled hard enough to stall
 * outright. Encoding every frame as a keyframe fixes the seeking and costs four
 * times the bytes — measured on this clip: 1,956 KB all-intra against 520 KB
 * for the 48 WebP frames this uses. Frames also decode independently, so a
 * half-loaded sequence still scrubs across whatever has arrived.
 *
 * WHY 48 FRAMES AT 960px
 *
 * Frame count beats resolution on a scrub. A sequence that skips reads as
 * broken; a soft one reads as cinematic, and this clip is shallow-focus anyway.
 * 48 frames over one viewport of travel is roughly a frame every 2vh, which is
 * under the threshold where the eye starts seeing steps.
 *
 * LAYOUT IS DECIDED IN CSS, NOT JAVASCRIPT
 *
 * The tall scrolling track exists at `lg` and nowhere else, chosen by a media
 * query. Deciding it in JS would mean the server rendering one height and the
 * client swapping to another at hydration — a large, entirely avoidable layout
 * shift, and the same trap TierScroll documents. So the section is short
 * everywhere by default and tall only where the scrub can actually run; the
 * poster fills the frame in both cases and JS only ever adds the canvas on top.
 */

export function CutSequence() {
  const allowed = useScrubAllowed();
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!allowed) return;

    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let cancelled = false;
    let raf = 0;
    let current = -1;
    const images: HTMLImageElement[] = [];

    /* Draw one frame, cover-fitted. The canvas is the size of the viewport and
       the frames are 16:9, so one axis always overflows — same maths as
       `object-fit: cover`, done by hand because a canvas has no such property. */
    const paint = (index: number) => {
      const img = images[index];
      if (!img?.complete || img.naturalWidth === 0) return;

      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      current = index;
    };

    /* Frame from scroll position. `progress` runs 0→1 across the part of the
       track that actually moves — the pinned viewport height is subtracted,
       or the sequence would finish before the section had finished passing. */
    const frameForScroll = () => {
      const rect = track.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return 0;
      const progress = clamp(-rect.top / travel);
      // Written straight to the transform rather than through state: this runs
      // inside a rAF on every scroll frame, and a setState here would re-render
      // the section sixty times a second to move a 1px line.
      if (railRef.current) railRef.current.style.transform = `scaleX(${progress})`;
      return Math.min(cutSequence.frames - 1, Math.round(progress * (cutSequence.frames - 1)));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = frameForScroll();
        if (next !== current) paint(next);
      });
    };

    /* The canvas is sized in device pixels, capped at 2x. A 3x phone would ask
       for nine times the fill rate to draw a 960px source — all of it upscale. */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const at = current;
      current = -1;
      paint(at < 0 ? frameForScroll() : at);
    };

    /* Decode before scrolling starts. `decode()` keeps the work off the main
       thread; without it the first scrub stutters as each frame decodes
       synchronously inside drawImage. */
    const load = async () => {
      const pad = (n: number) => String(n + 1).padStart(2, "0");
      const all = Array.from({ length: cutSequence.frames }, (_, i) => {
        const img = new window.Image();
        img.decoding = "async";
        img.src = `${cutSequence.path}/f${pad(i)}.webp`;
        images[i] = img;
        return img.decode().catch(() => undefined);
      });

      // The first frame alone is enough to swap the poster for the canvas; the
      // rest arrive behind it and the scrub simply gets smoother as they do.
      await all[0];
      if (cancelled) return;
      resize();
      setReady(true);

      await Promise.all(all);
      if (cancelled) return;
      onScroll();
    };

    void load();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      // Release the decoded bitmaps. Forty-eight frames at 960×540 is roughly
      // 100 MB of RGBA in memory, which is not something to leave behind on a
      // section the reader has scrolled past.
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, [allowed]);

  return (
    <section
      aria-label="A blade fade, start to finish"
      className="relative bg-ink-sunken pb-16 pt-20 lg:py-0"
    >
      <div ref={trackRef} className="relative lg:h-[220vh] lg:motion-reduce:h-auto">
        {/* `pt-24` clears the fixed header. Without it the flex centring
              measures the whole viewport, so the eyebrow ends up underneath the
              header bar at every scroll position. */}
        <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:pt-24 lg:motion-reduce:static lg:motion-reduce:h-auto lg:motion-reduce:py-20">
          <Container>
            <div className="max-w-2xl">
              <p className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-brass-dim">
                <span aria-hidden className="h-px w-8 bg-brass-rule" />
                The blade fade
              </p>
              {/* Their own menu copy. It is already written, and it is literally
                  what the footage shows. */}
              <p className="font-display text-[clamp(1.5rem,2.8vw,2.15rem)] leading-[1.1] tracking-wide text-bone">
                Zero to blended, done properly. The line stays sharp for weeks,
                not days.
              </p>
            </div>

            {/* CONTAINED, NOT FULL-BLEED, and that is a correction rather than a
                preference. Full-bleed meant cover-fitting a 960px macro frame
                across a 1440px viewport: a 1.5x upscale of a shot that is
                already so close you cannot tell clippers from a shadow. At this
                width the source renders near 1:1 and stays sharp, the frame
                picks up the house radius, and the copy sits beside the picture
                instead of fighting a scrim for contrast. */}
            <div className="relative mt-7 aspect-video w-full max-w-4xl overflow-hidden rounded-lg border border-line bg-ink">
              {/* The poster is the floor: it renders on every device, carries
                  the section on gated ones, and is what the canvas fades in
                  over. */}
              <Image
                src={cutSequence.poster}
                alt=""
                aria-hidden
                fill
                unoptimized
                sizes="(min-width: 1024px) 896px, 100vw"
                className="object-cover"
              />

              {allowed ? (
                <canvas
                  ref={canvasRef}
                  aria-hidden
                  className={cn(
                    "absolute inset-0 h-full w-full transition-opacity duration-700 ease-[var(--ease-out-expo)]",
                    ready ? "opacity-100" : "opacity-0"
                  )}
                />
              ) : null}

              {/* A short scrim at the foot only — enough to seat the frame in
                  the page without dulling the picture it exists to show. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-ink/70 to-transparent"
              />
            </div>

            {/* The same rail as TierScroll. A pinned section otherwise gives no
                hint of how far through it you are — and on a scrub, that is the
                difference between "this is responding to me" and "this is
                stuck". */}
            {allowed ? (
              <div className="mt-6 hidden max-w-4xl items-center gap-3 lg:flex lg:motion-reduce:hidden">
                <span
                  aria-hidden
                  className="relative block h-0.5 w-20 overflow-hidden rounded-full bg-line"
                >
                  <span
                    ref={railRef}
                    className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-brass"
                  />
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-bone-faint">
                  Keep scrolling
                </span>
              </div>
            ) : null}
          </Container>
        </div>
      </div>
    </section>
  );
}
