"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createStudioEnvironment } from "./scissorEnvironment";
import { Scissor } from "./ScissorModel";
import { clamp, damp, type RenderTier } from "@/lib/motion";
import {
  REST_POSE,
  PORTRAIT_POSE,
  ENTRY_OFFSET,
  ENTRY_DURATION,
  CUT_DELAY,
  BLADE_OPEN,
  BLADE_CLOSED,
  CUT_DURATION,
  CUT_SETTLE,
  POINTER_ROTATION,
  POINTER_DRIFT,
} from "./scissorPose";

/**
 * The hero scissor.
 *
 * What it does, in order: flies in from behind and slightly above, settles,
 * snips once, and then holds — tracking the pointer with a small, damped
 * parallax for as long as the hero is on screen. Off screen it stops dead.
 *
 * WHAT CHANGED, AND WHY
 *
 * The previous scene held one pose, closed the blades when the visitor had
 * scrolled 14% of the viewport, and then froze permanently. It was defensible
 * on battery grounds and wrong on every other axis:
 *
 *   - Nothing announced it. The canvas mounted on an idle callback and the
 *     scissor was simply present in the next frame, which after a headline that
 *     animates word by word reads as a late-loading image, not as staging.
 *   - The one moment it existed for was keyed to a scroll position most people
 *     pass through at speed, so most people never saw it.
 *   - It never responded to anything. An object that holds perfectly still and
 *     ignores the cursor is indistinguishable from a PNG — which means the
 *     entire WebGL context was being spent to produce a picture.
 *
 * Pointer parallax is the cheap fix for the third, and the important one. Two
 * degrees of rotation answering the mouse is what tells the eye there is a far
 * side to the object.
 *
 * WHAT DID NOT CHANGE: the discipline. The canvas still runs `frameloop`
 * "demand", still renders nothing at all when the hero is off screen or the tab
 * is hidden, and still refuses to mount on a device that cannot afford it. The
 * budget was not raised — it was spent on different things.
 */

/** Frames the scene keeps rendering after the pointer stops, to let it settle. */
const POINTER_SETTLE = 0.45;

function Rig({
  tier,
  onSettled,
}: {
  tier: Exclude<RenderTier, null>;
  onSettled: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const halfA = useRef<THREE.Group>(null);
  const halfB = useRef<THREE.Group>(null);

  const { viewport, invalidate, size } = useThree();

  /* --- Composition ------------------------------------------------------
   * Derived from the frame the camera actually sees, so the pose holds at any
   * aspect ratio instead of being tuned for one monitor. `viewport.height` is
   * constant (fixed FOV, fixed camera distance); width is what changes. */
  const portrait = size.height > size.width;
  const pose = portrait ? PORTRAIT_POSE : REST_POSE;

  const layout = useMemo(() => {
    const halfWidth = viewport.width / 2;
    // Fit factor: 1.0 at the 16:9 frame the poses were composed against,
    // clamped so a very wide or very narrow window still gets a sane object.
    const fit = clamp(viewport.width / 9.2, 0.42, 1.15);
    return {
      x: halfWidth * pose.xFraction,
      y: pose.y,
      scale: pose.scale * (portrait ? clamp(fit * 1.9, 0.5, 0.95) : fit),
    };
  }, [viewport.width, pose, portrait]);

  /* --- Animation state (refs: none of this belongs in React) ------------- */
  const entry = useRef(0); // 0 → 1 arrival
  const cutT = useRef(0); // 0 → 1 blade close
  const settle = useRef(0);
  const cutDone = useRef(false);
  const sinceEntry = useRef(0);

  // Pointer target and its damped follower, in normalised -1..1 screen space.
  const target = useRef({ x: 0, y: 0 });
  const follow = useRef({ x: 0, y: 0 });
  const pointerActive = useRef(0); // seconds of render still owed to the pointer

  const applyPose = useCallback(
    (t: number, bladeAngle: number, zKick: number) => {
      const g = root.current;
      if (!g) return;

      // Entry offsets unwind as `t` goes 0 → 1.
      const inv = 1 - t;
      const f = follow.current;

      g.position.set(
        layout.x + f.x * POINTER_DRIFT.x,
        layout.y + inv * ENTRY_OFFSET.y + f.y * POINTER_DRIFT.y,
        inv * ENTRY_OFFSET.z
      );
      g.rotation.set(
        pose.rotation[0] - f.y * POINTER_ROTATION.x,
        pose.rotation[1] + f.x * POINTER_ROTATION.y,
        pose.rotation[2] + inv * ENTRY_OFFSET.rotationZ + zKick
      );
      const s = layout.scale * (ENTRY_OFFSET.scale + (1 - ENTRY_OFFSET.scale) * t);
      g.scale.setScalar(s);

      halfA.current?.rotation.set(0, 0, bladeAngle);
      halfB.current?.rotation.set(0, 0, bladeAngle);
    },
    [layout, pose]
  );

  /* --- "still" tier: draw once, never again ------------------------------
   * Reduced motion gets the finished frame. A static render of a 3D object is
   * a picture; deleting it was answering "less movement please" by removing an
   * image, which is not the same request. */
  useEffect(() => {
    if (tier === "still") {
      entry.current = 1;
      cutDone.current = true;
      applyPose(1, BLADE_CLOSED, 0);
      invalidate();
      onSettled();
      return;
    }
    // Everything else starts at the beginning of the arrival.
    applyPose(entry.current, cutDone.current ? BLADE_CLOSED : BLADE_OPEN, 0);
    invalidate();
  }, [tier, applyPose, invalidate, onSettled]);

  /* --- Pointer ----------------------------------------------------------
   * Window-level, passive, and only on the tier that can afford it. Reading
   * the pointer from the window rather than from the canvas matters: the canvas
   * has `pointer-events: none` so that it can never intercept a tap meant for
   * the Book button, which means it receives no pointer events of its own. */
  useEffect(() => {
    if (tier !== "high") return;

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.current.x = clamp(nx, -1, 1);
      target.current.y = clamp(ny, -1, 1);
      pointerActive.current = POINTER_SETTLE;
      invalidate();
    };

    // Returning to rest when the cursor leaves is what stops the scissor from
    // sitting permanently cocked toward wherever the mouse happened to exit.
    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
      pointerActive.current = POINTER_SETTLE;
      invalidate();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [tier, invalidate]);

  useFrame((_, rawDelta) => {
    if (tier === "still") return;

    const dt = Math.min(rawDelta, 1 / 30); // clamp after a tab-switch stall
    let needsAnother = false;

    /* --- Arrival --------------------------------------------------------- */
    if (entry.current < 1) {
      entry.current = Math.min(1, entry.current + dt / ENTRY_DURATION);
      needsAnother = true;
    } else if (!cutDone.current) {
      sinceEntry.current += dt;
    }
    // Quintic ease-out. Almost all the distance in the first third, so it lands
    // rather than drifts.
    const e = 1 - Math.pow(1 - entry.current, 5);

    /* --- The cut --------------------------------------------------------- */
    let blade = BLADE_OPEN;
    let kick = 0;

    if (cutDone.current) {
      blade = BLADE_CLOSED;
    } else if (entry.current >= 1 && sinceEntry.current >= CUT_DELAY) {
      cutT.current = Math.min(1, cutT.current + dt / CUT_DURATION);
      const c = cutT.current;

      // Quartic ease-out: the blades cover most of the arc in the first third,
      // which is what makes it read as a snip rather than a slow close.
      const ce = 1 - Math.pow(1 - c, 4);
      blade = BLADE_OPEN + (BLADE_CLOSED - BLADE_OPEN) * ce;
      // Damped metallic quiver as the blades meet.
      blade += Math.sin(c * Math.PI * 3) * Math.exp(-c * 6.5) * 0.035;
      // A matching recoil through the whole body — the kick of the cut.
      kick = Math.sin(c * Math.PI * 2) * Math.exp(-c * 5) * 0.07;

      needsAnother = true;

      if (c >= 1) {
        settle.current += dt;
        if (settle.current >= CUT_SETTLE) {
          blade = BLADE_CLOSED;
          kick = 0;
          cutDone.current = true;
          onSettled();
        }
      }
    } else {
      needsAnother = true; // still waiting out CUT_DELAY
    }

    /* --- Pointer parallax ------------------------------------------------ */
    if (tier === "high" && pointerActive.current > 0) {
      const k = damp(dt);
      follow.current.x += (target.current.x - follow.current.x) * k;
      follow.current.y += (target.current.y - follow.current.y) * k;
      pointerActive.current -= dt;

      // Stop early once it is close enough that no one could see the remainder.
      const dx = Math.abs(target.current.x - follow.current.x);
      const dy = Math.abs(target.current.y - follow.current.y);
      if (dx > 0.002 || dy > 0.002) needsAnother = true;
      else pointerActive.current = 0;
    }

    applyPose(e, blade, kick);

    // Demand mode: every frame has to ask for the next one, or the loop stops.
    // This is the whole battery story — when nothing is moving, nothing renders.
    if (needsAnother) invalidate();
  });

  return <Scissor ref={root} halfA={halfA} halfB={halfB} quality={tier} />;
}

export default function ScissorScene({ tier }: { tier: Exclude<RenderTier, null> }) {
  const [settled, setSettled] = useState(tier === "still");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleSettled = useCallback(() => setSettled(true), []);

  /* `frameloop` is "always" only while the arrival and cut are actually
   * playing. After that the scene drops to "demand" and every subsequent frame
   * is one the pointer explicitly asked for via invalidate(). A hidden tab gets
   * neither. */
  const live = !settled && visible && tier !== "still";

  const highQuality = tier === "high";

  return (
    <Canvas
      // Capped DPR: at full retina ratio the fragment cost quadruples for no
      // perceptible gain on a model this simple. The low tier gives up
      // supersampling entirely, which is most of what makes it affordable.
      dpr={highQuality ? [1, 1.6] : 1}
      gl={{
        antialias: highQuality,
        alpha: true,
        powerPreference: highQuality ? "high-performance" : "default",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0, 9], fov: 32 }}
      frameloop={live ? "always" : "demand"}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl, scene }) => {
        // Slightly under 1: ACES plus a bright strip-lit environment was
        // clipping the blade highlights to flat white, which is the other half
        // of why the steel looked like paper. Pulling exposure back keeps the
        // top end inside the curve where it still has gradient.
        gl.toneMappingExposure = 0.92;

        // A metalness-1 surface is a mirror: it shows almost nothing of itself,
        // only what surrounds it. The environment map therefore does nearly all
        // the visual work here, and the direct lights below only add a little
        // shaping. See ./scissorEnvironment for why a purpose-built studio beats
        // three's stock RoomEnvironment for this.
        scene.environment = createStudioEnvironment(gl);
      }}
    >
      {/* Direct lights are deliberately restrained. On metal they contribute
          little beyond a specular dot, and turning them up flattens the
          environment reflections that are doing the real work. These exist to
          shape the non-mirror surfaces (the screw slot) and add a touch of
          warmth the environment alone does not carry. */}
      <directionalLight position={[5, 6, 6]} intensity={1.1} color="#fff4e2" />
      <directionalLight position={[-6, 1, 3]} intensity={0.35} color="#9db8dc" />
      <ambientLight intensity={0.12} />

      <Rig tier={tier} onSettled={handleSettled} />
    </Canvas>
  );
}
