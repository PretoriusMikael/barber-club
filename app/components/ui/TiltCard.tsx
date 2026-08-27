"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A card that answers the pointer: it tilts toward the cursor, and a specular
 * highlight and a lit edge track across it as the cursor moves.
 *
 * The effect is trying to say one thing — that the object has a surface. A flat
 * dark rectangle on a flat dark page has no material; the same rectangle
 * catching light along one edge as it turns reads as glass or lacquer, which is
 * the register a R490 service menu wants to be in.
 *
 * WHAT MAKES THIS READ AS EXPENSIVE RATHER THAN AS A GIMMICK
 *
 *   1. SMALL ANGLES. `MAX_TILT` is 6°. Every tacky version of this effect is
 *      tacky because it uses 15–20°, at which point the card stops being a
 *      surface and starts being a flapping panel.
 *   2. THE LIGHT MOVES OPPOSITE THE TILT. A real highlight is a reflection of a
 *      fixed light source, so when the card turns toward you the bright spot
 *      slides the other way. Tying the sheen to the cursor and the tilt to the
 *      cursor in the SAME direction is the tell that it is two unrelated
 *      effects rather than one lit object.
 *   3. NO TRANSITION WHILE TRACKING, A LONG ONE ON EXIT. A card that eases
 *      toward the cursor feels laggy; a card that snaps home feels broken. So
 *      it follows 1:1 while the pointer is over it and takes 600ms to settle
 *      when the pointer leaves.
 *   4. THE CONTENT LIFTS OFF THE CARD. `preserve-3d` plus a small `translateZ`
 *      on the inner layer means the type parallaxes against its own background
 *      instead of being painted onto it.
 *
 * WHAT IT COSTS
 *
 * Nothing that matters. No library, no canvas, no WebGL — the whole effect is
 * four CSS custom properties written inside one rAF, and everything animated is
 * `transform` and `opacity`, so it composites off the main thread. The
 * component is a few hundred bytes.
 *
 * WHO DOES NOT GET IT
 *
 * Anything without a real pointer — the handlers are never attached on touch,
 * where a hover effect is at best invisible and at worst a tap that leaves a
 * card stuck mid-tilt. And anyone who asked for less movement: the CSS in
 * globals.css flattens the transform and hides both light layers under
 * `prefers-reduced-motion`, so the guard holds even if the JS somehow runs.
 */

/** Degrees. Six is the whole difference between "surface" and "toy". */
const MAX_TILT = 6;

export function TiltCard({
  children,
  className,
  /** Applied to the inner layer that lifts off the card face. */
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // A hover effect on a touch screen is either invisible or a trap. Bail
    // before attaching anything rather than guarding inside the handler.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const card = scene.firstElementChild as HTMLElement | null;
    if (!card) return;

    let raf = 0;
    let clientX = 0;
    let clientY = 0;
    let settling = false;

    /* The layout read lives here, inside the frame, not in the pointermove
       handler — `getBoundingClientRect` on every pointer event is a forced
       synchronous layout dozens of times a second, and the card can move under
       the cursor anyway (scroll, the reveal animation), so the rect has to be
       re-read rather than cached on enter. */
    const frame = () => {
      raf = 0;

      if (settling) {
        card.style.setProperty("--tilt-rx", "0deg");
        card.style.setProperty("--tilt-ry", "0deg");
        card.style.setProperty("--tilt-lx", "50%");
        card.style.setProperty("--tilt-ly", "50%");
        return;
      }

      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // −0.5 … 0.5 from the centre of the card.
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;

      // Pointer right → the right edge goes away from you → positive rotateY.
      // Pointer down → the bottom comes toward you → negative rotateX.
      card.style.setProperty("--tilt-ry", `${(x * 2 * MAX_TILT).toFixed(2)}deg`);
      card.style.setProperty("--tilt-rx", `${(-y * 2 * MAX_TILT).toFixed(2)}deg`);

      /* The highlight travels AGAINST the pointer, because it is a reflection
         of a fixed light rather than a spotlight following the mouse. The 0.7
         damps it so the bright spot stays on the card instead of sliding off
         the edge the moment the cursor nears a corner. */
      card.style.setProperty("--tilt-lx", `${(50 - x * 70).toFixed(1)}%`);
      card.style.setProperty("--tilt-ly", `${(50 - y * 70).toFixed(1)}%`);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (event: PointerEvent) => {
      clientX = event.clientX;
      clientY = event.clientY;
      settling = false;
      scene.dataset.tilting = "";
      schedule();
    };

    const onLeave = () => {
      settling = true;
      delete scene.dataset.tilting;
      schedule();
    };

    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    // A pointer that vanishes mid-card — dragged out of the window, or the tab
    // hidden — never fires pointerleave, and the card would stay tilted.
    scene.addEventListener("pointercancel", onLeave);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
      scene.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  return (
    <div ref={sceneRef} className="tilt-scene h-full">
      <div className={cn("tilt-card surface", className)}>
        {/* The lit edge and the sheen are siblings of the content, both
            pointer-events:none, both painted above the card's own background
            and below its type. */}
        <span aria-hidden className="tilt-edge" />
        <span aria-hidden className="tilt-sheen" />
        <div className={cn("tilt-content", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
