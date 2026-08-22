"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createStudioEnvironment } from "./scissorEnvironment";
import { Scissor } from "./ScissorModel";
import {
  REST_POSE,
  BLADE_OPEN,
  BLADE_CLOSED,
  CUT_DURATION,
  CUT_SETTLE,
} from "./scissorPose";

/**
 * The hero scissor.
 *
 * Sits in one pose. Cuts once. Then stops — and "stops" here is literal: the
 * canvas runs in `frameloop="demand"`, so outside the cut the GPU does no work
 * at all. A decorative object that redraws forever is a battery complaint
 * waiting to happen.
 *
 * The cut trigger arrives as a PROP, not a ref read inside useFrame. In demand
 * mode useFrame is not called unless a render is requested, so a ref the scene
 * polls itself would never be seen — the trigger has to come from outside and
 * flip the frameloop on.
 *
 * Only reached through HeroScissor, which gates on device capability and mounts
 * after first paint. Never in the initial bundle.
 */

function Rig({
  cutting,
  startClosed,
  onSettled,
}: {
  cutting: boolean;
  startClosed: boolean;
  onSettled: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const halfA = useRef<THREE.Group>(null);
  const halfB = useRef<THREE.Group>(null);

  // Local animation clock. Starts finished when the visitor landed below the
  // hero, so the blades are simply already closed rather than replaying a cut
  // for a hero that was never on screen.
  const cutT = useRef(startClosed ? 1 : 0);
  const settle = useRef(0);
  const done = useRef(startClosed);

  const { viewport, invalidate } = useThree();

  // Narrow screens: pull the scissor in and shrink it so it never crowds the
  // headline. 9.2 is the frame width the pose was composed against.
  const widthRatio = Math.min(1, viewport.width / 9.2);
  const xScale = 0.45 + 0.55 * widthRatio;
  const sizeScale = 0.62 + 0.38 * widthRatio;

  const applyPose = useCallback(
    (bladeAngle: number, zKick = 0) => {
      const g = root.current;
      if (!g) return;
      g.position.set(
        REST_POSE.position[0] * xScale,
        REST_POSE.position[1],
        REST_POSE.position[2]
      );
      g.rotation.set(
        REST_POSE.rotation[0],
        REST_POSE.rotation[1],
        REST_POSE.rotation[2] + zKick
      );
      g.scale.setScalar(REST_POSE.scale * sizeScale);
      halfA.current?.rotation.set(0, 0, bladeAngle);
      halfB.current?.rotation.set(0, 0, bladeAngle);
    },
    [xScale, sizeScale]
  );

  // Draw the static pose on mount, and again whenever the viewport changes.
  useEffect(() => {
    applyPose(done.current ? BLADE_CLOSED : BLADE_OPEN);
    invalidate();
  }, [applyPose, invalidate]);

  useFrame((_, delta) => {
    if (done.current || !cutting) return;

    const dt = Math.min(delta, 1 / 30); // clamp after a tab-switch stall

    cutT.current = Math.min(1, cutT.current + dt / CUT_DURATION);
    const c = cutT.current;

    // Quartic ease-out: the blades cover most of the arc in the first third,
    // which is what makes it read as a snip rather than a slow close.
    const e = 1 - Math.pow(1 - c, 4);
    let angle = BLADE_OPEN + (BLADE_CLOSED - BLADE_OPEN) * e;

    // Damped metallic quiver as the blades meet.
    angle += Math.sin(c * Math.PI * 3) * Math.exp(-c * 6.5) * 0.035;

    // A matching recoil through the whole body — the kick of the cut. Applied
    // as an offset from the rest pose, so it always returns exactly to it.
    const kick = Math.sin(c * Math.PI * 2) * Math.exp(-c * 5) * 0.07;

    applyPose(angle, kick);

    if (c >= 1) {
      settle.current += dt;
      if (settle.current >= CUT_SETTLE) {
        // Snap to the exact final state so the last frame is clean, then stand
        // down for good.
        applyPose(BLADE_CLOSED);
        done.current = true;
        onSettled();
      }
    }
  });

  return <Scissor ref={root} halfA={halfA} halfB={halfB} />;
}

export default function ScissorScene({
  cutting,
  startClosed = false,
}: {
  cutting: boolean;
  startClosed?: boolean;
}) {
  const [settled, setSettled] = useState(startClosed);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleSettled = useCallback(() => setSettled(true), []);

  // "always" only for the ~0.8s the cut is actually moving. Everything else is
  // a single render on mount and one more per resize.
  const live = cutting && !settled && visible;

  return (
    <Canvas
      // Capped DPR: at full retina ratio the fragment cost quadruples for no
      // perceptible gain on a model this simple.
      dpr={[1, 1.6]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0, 9], fov: 32 }}
      frameloop={live ? "always" : "demand"}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl, scene }) => {
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

      <Rig cutting={cutting} startClosed={startClosed} onSettled={handleSettled} />
    </Canvas>
  );
}
