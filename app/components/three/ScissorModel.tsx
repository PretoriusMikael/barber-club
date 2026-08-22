'use client';

import { useMemo, forwardRef } from 'react';
import * as THREE from 'three';
import { getScissorMaps } from './scissorTextures';

/**
 * A hair scissor, built entirely from procedural geometry and procedural maps.
 *
 * Why procedural and not a glTF: no asset to commission, no Draco decoder, no
 * texture downloads, nothing to art-direct before the site can ship. The whole
 * model is a few kilobytes of vertices generated at runtime.
 *
 * Construction:
 *   blade  — ExtrudeGeometry from a 2D profile, bevelled. The bevel gives the
 *            edge a specular highlight that tracks the light, so it reads as
 *            ground steel rather than a flat cutout.
 *   edge   — a narrow ribbon along the cutting edge, standing fractionally proud
 *            of the blade face, with a near-mirror material. This is the honed
 *            bevel, and it is what makes the blade look sharp instead of like a
 *            flat metal leaf.
 *   shank  — TubeGeometry along a Catmull-Rom curve. Round section, so it stays
 *            clean from every angle.
 *   ring   — Torus, positioned along the shank exit tangent so it joins flush.
 *   tang   — the small finger rest, on the lower half only. Minor, but its
 *            absence is one of the things that makes a CG scissor look wrong.
 *   pivot  — a bezel, a screw, and a slot across the screw head.
 *
 * Both halves share one geometry set. The second is mirrored on Y, so the SAME
 * local rotation opens it the opposite way — one angle value drives both blades
 * and they can never desynchronise.
 */

/* --- Thickness budget --------------------------------------------------------
 * blade  : depth 0.10 + 0.024 bevel per face  = 0.148  -> +/-0.074
 * edge   : depth 0.168, no bevel              = 0.168  -> +/-0.084 (0.010 proud)
 * halves : offset +/-0.09                     = 0.180 gap
 * The gap must exceed the edge ribbon thickness or the halves interpenetrate and
 * z-fight down the cutting edge — exactly where the eye is during the cut.
 * 0.180 > 0.168, so they clear.
 * -------------------------------------------------------------------------- */
const BLADE_DEPTH = 0.1;
const BLADE_BEVEL = 0.024;
const EDGE_DEPTH = 0.168;
const HALF_OFFSET = 0.09;

function useScissorGeometry() {
  return useMemo(() => {
    /* --- Blade -----------------------------------------------------------
     * Runs from the pivot (x~0) to the tip (x~3.6). The spine is the upper
     * curve; the cutting edge below stays much straighter, because a blade that
     * curves on both sides looks like a leaf. */
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0.04, 0.3);
    bladeShape.quadraticCurveTo(1.8, 0.315, 3.6, 0.04);
    bladeShape.lineTo(3.62, -0.005);
    bladeShape.quadraticCurveTo(1.75, -0.115, 0.04, -0.225);
    bladeShape.closePath();

    const blade = new THREE.ExtrudeGeometry(bladeShape, {
      depth: BLADE_DEPTH,
      bevelEnabled: true,
      bevelThickness: BLADE_BEVEL,
      bevelSize: 0.026,
      bevelSegments: 4,
      curveSegments: 64,
    });
    blade.translate(0, 0, -BLADE_DEPTH / 2);
    blade.computeVertexNormals();

    /* --- Honed edge ribbon ------------------------------------------------ */
    const edgeShape = new THREE.Shape();
    edgeShape.moveTo(0.06, -0.221);
    edgeShape.quadraticCurveTo(1.75, -0.111, 3.6, -0.001);
    edgeShape.lineTo(3.6, 0.035);
    edgeShape.quadraticCurveTo(1.75, -0.073, 0.06, -0.183);
    edgeShape.closePath();

    const edge = new THREE.ExtrudeGeometry(edgeShape, {
      depth: EDGE_DEPTH,
      bevelEnabled: false,
      curveSegments: 64,
    });
    edge.translate(0, 0, -EDGE_DEPTH / 2);
    edge.computeVertexNormals();

    /* --- Shank ------------------------------------------------------------ */
    const shankCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, -0.03, 0),
      new THREE.Vector3(-0.85, -0.16, 0),
      new THREE.Vector3(-1.72, -0.54, 0),
      new THREE.Vector3(-2.35, -0.93, 0),
    ]);
    const shank = new THREE.TubeGeometry(shankCurve, 64, 0.1, 20, false);

    /* --- Finger ring -------------------------------------------------------
     * Offset along the shank exit tangent by exactly the ring radius, so the
     * tube meets the torus flush instead of stabbing through it. */
    const endTangent = shankCurve.getTangentAt(1).normalize();
    const RING_RADIUS = 0.4;
    const ringCx = -2.35 + endTangent.x * RING_RADIUS;
    const ringCy = -0.93 + endTangent.y * RING_RADIUS;
    const ring = new THREE.TorusGeometry(RING_RADIUS, 0.085, 24, 72);
    ring.translate(ringCx, ringCy, 0);

    /* --- Finger tang (lower half only) ------------------------------------ */
    const tang = new THREE.TorusGeometry(0.2, 0.05, 14, 32, Math.PI * 1.15);
    tang.rotateZ(-0.5);
    tang.translate(ringCx + 0.28, ringCy - 0.5, 0);

    /* --- Pivot ------------------------------------------------------------- */
    const bezel = new THREE.CylinderGeometry(0.2, 0.22, 0.06, 48);
    bezel.rotateX(Math.PI / 2);

    const screw = new THREE.CylinderGeometry(0.105, 0.105, 0.4, 32);
    screw.rotateX(Math.PI / 2);

    // The slot across the screw head.
    const slot = new THREE.BoxGeometry(0.16, 0.024, 0.02);

    return { blade, edge, shank, ring, tang, bezel, screw, slot };
  }, []);
}

interface Materials {
  steel: THREE.MeshPhysicalMaterial;
  honed: THREE.MeshPhysicalMaterial;
  brass: THREE.MeshPhysicalMaterial;
  dark: THREE.MeshStandardMaterial;
}

/** One half: blade + honed edge + shank + ring, pivoting about the origin. */
const ScissorHalf = forwardRef<
  THREE.Group,
  { materials: Materials; withTang?: boolean }
>(function ScissorHalf({ materials, withTang }, ref) {
  const geo = useScissorGeometry();

  return (
    <group ref={ref}>
      <mesh geometry={geo.blade} material={materials.steel} />
      <mesh geometry={geo.edge} material={materials.honed} />
      <mesh geometry={geo.shank} material={materials.steel} />
      <mesh geometry={geo.ring} material={materials.brass} />
      {withTang ? <mesh geometry={geo.tang} material={materials.brass} /> : null}
      <mesh geometry={geo.bezel} material={materials.brass} />
    </group>
  );
});

export const Scissor = forwardRef<
  THREE.Group,
  {
    /** Refs to the two pivoting halves, driven by the scene cut animation. */
    halfA: React.RefObject<THREE.Group | null>;
    halfB: React.RefObject<THREE.Group | null>;
  }
>(function Scissor({ halfA, halfB }, ref) {
  const geo = useScissorGeometry();

  const materials = useMemo<Materials>(() => {
    const maps = getScissorMaps();

    // Steel is a cool grey, never white. Pure white metal reads as plastic.
    const steel = new THREE.MeshPhysicalMaterial({
      color: '#c7cad2',
      metalness: 1,
      // Multiplied by the roughness map green channel, so the effective range
      // lands near 0.09-0.34: polished, but with visible grind direction.
      roughness: 0.4,
      roughnessMap: maps.roughness,
      normalMap: maps.normal,
      envMapIntensity: 1.45,
      // Anisotropy stretches the highlight along the grind direction. This is
      // the difference between "shiny grey" and "brushed steel".
      anisotropy: 0.55,
      anisotropyRotation: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.14,
    });
    steel.normalScale = new THREE.Vector2(0.32, 0.32);

    // The honed bevel: almost no roughness and no scratch maps. It is the one
    // near-mirror surface on the model, which is what makes it read as sharp.
    const honed = new THREE.MeshPhysicalMaterial({
      color: '#dfe3ea',
      metalness: 1,
      roughness: 0.045,
      envMapIntensity: 1.7,
      clearcoat: 0.6,
      clearcoatRoughness: 0.04,
    });

    // Brass rings, tying the model to the brand accent.
    const brass = new THREE.MeshPhysicalMaterial({
      color: '#c9a24e',
      metalness: 1,
      roughness: 0.42,
      roughnessMap: maps.roughness,
      normalMap: maps.normal,
      envMapIntensity: 1.25,
      anisotropy: 0.3,
      clearcoat: 0.25,
      clearcoatRoughness: 0.2,
    });
    brass.normalScale = new THREE.Vector2(0.18, 0.18);

    // The screw slot. Dark and rough, so it reads as a recess not a decal.
    const dark = new THREE.MeshStandardMaterial({
      color: '#1b1b20',
      metalness: 0.7,
      roughness: 0.65,
    });

    return { steel, honed, brass, dark };
  }, []);

  return (
    <group ref={ref}>
      {/* Upper half */}
      <group position={[0, 0, HALF_OFFSET]}>
        <ScissorHalf ref={halfA} materials={materials} />
      </group>

      {/* Lower half — mirrored on Y, so the same local rotation opens it the
          other way. three flips the winding order for negative-determinant
          matrices, so the lighting stays correct. Carries the finger tang. */}
      <group position={[0, 0, -HALF_OFFSET]} scale={[1, -1, 1]}>
        <ScissorHalf ref={halfB} materials={materials} withTang />
      </group>

      {/* The screw passes through both halves, so it belongs to neither. */}
      <mesh geometry={geo.screw} material={materials.brass} />
      <mesh geometry={geo.slot} material={materials.dark} position={[0, 0, 0.201]} />
      <mesh
        geometry={geo.slot}
        material={materials.dark}
        position={[0, 0, -0.201]}
        rotation={[0, 0, Math.PI / 2]}
      />
    </group>
  );
});
