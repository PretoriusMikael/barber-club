'use client';

import { useMemo, forwardRef } from 'react';
import * as THREE from 'three';
import { getScissorMaps, type ScissorMaps } from './scissorTextures';

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

/* --- DO NOT SET `anisotropy` ON THESE MATERIALS ------------------------------
 * It silently disables every normal map on the model.
 *
 * `MeshPhysicalMaterial.anisotropy` needs a tangent frame. When the geometry
 * carries no `tangent` attribute — and none of this geometry does, because
 * ExtrudeGeometry, TubeGeometry and TorusGeometry do not generate one — three
 * takes a different branch through the normal-mapping chunk to derive the frame
 * for the anisotropy direction, and the tangent-space normal perturbation is
 * lost along the way. No warning, no error: the maps just stop having any
 * effect.
 *
 * This is not theoretical. The model shipped with `anisotropy: 0.7` on the
 * steel and 0.3 on the brass, and the blades rendered as two flat cards — one
 * cream, one blue — because a perfectly planar mirror with no working normal
 * map samples the environment at exactly one point. Every attempt to fix it in
 * the lighting rig failed, because the lighting was never the problem. Removing
 * anisotropy brought the maps back and the blades went metallic in one step.
 *
 * If brushed-highlight stretching is ever wanted back, the price is computing
 * real tangents (mergeVertices + computeTangents from BufferGeometryUtils) so
 * `USE_TANGENT` is defined and both features can coexist. Until then the grind
 * direction is carried by the roughness map, which costs nothing and works.
 * -------------------------------------------------------------------------- */

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

/**
 * Built ONCE per page and shared by every mesh that needs it.
 *
 * This was a `useMemo` inside a hook — and `useMemo` memoises per component
 * INSTANCE, not per module. The hook was called from `Scissor` and from
 * `ScissorHalf`, and `ScissorHalf` renders twice, so the entire set was
 * constructed three times over and uploaded to the GPU three times over: two
 * bevelled ExtrudeGeometries at 64 curve segments, a 64x20 tube, two toruses
 * and three primitives, tripled, on the main thread, during the hero's entrance
 * animation. It showed up in a CPU profile as `fromBufferAttribute` and was
 * part of why the headline stuttered.
 *
 * A module-level singleton is correct here because the geometry depends on
 * nothing: no props, no viewport, no quality tier. It is the same object every
 * time. Built lazily on first use rather than at import so that merely loading
 * the chunk costs nothing, and deliberately never disposed — the scene unmounts
 * and remounts as the hero scrolls in and out of view, and rebuilding this on
 * every remount is exactly the cost we are removing.
 */
let geometryCache: ScissorGeometry | null = null;

type ScissorGeometry = {
  blade: THREE.ExtrudeGeometry;
  edge: THREE.ExtrudeGeometry;
  shank: THREE.TubeGeometry;
  ring: THREE.TorusGeometry;
  tang: THREE.TorusGeometry;
  bezel: THREE.CylinderGeometry;
  screw: THREE.CylinderGeometry;
  slot: THREE.BoxGeometry;
};

function getScissorGeometry(): ScissorGeometry {
  if (geometryCache) return geometryCache;
  geometryCache = (() => {
    /* --- Blade -----------------------------------------------------------
     * Runs from the pivot (x~0) to the tip (x~3.6). The spine is the upper
     * curve; the cutting edge below stays much straighter, because a blade that
     * curves on both sides looks like a leaf.
     *
     * The spine was raised from 0.30 to 0.36 at the pivot and from 0.04 to 0.055
     * at the tip. At the old proportions the blades rendered as two narrow
     * spikes — a stiletto, not a pair of shears — because hair scissors carry
     * far more width at the pivot than a general-purpose scissor does. Only the
     * spine moved: the lower curve is the cutting edge, and the honed ribbon
     * below is cut to match it to three decimal places. */
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0.04, 0.36);
    bladeShape.quadraticCurveTo(1.8, 0.35, 3.6, 0.055);
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
    const shank = new THREE.TubeGeometry(shankCurve, 64, 0.118, 20, false);

    /* --- Finger ring -------------------------------------------------------
     * Offset along the shank exit tangent by exactly the ring radius, so the
     * tube meets the torus flush instead of stabbing through it. */
    const endTangent = shankCurve.getTangentAt(1).normalize();
    const RING_RADIUS = 0.47;
    const ringCx = -2.35 + endTangent.x * RING_RADIUS;
    const ringCy = -0.93 + endTangent.y * RING_RADIUS;
    const ring = new THREE.TorusGeometry(RING_RADIUS, 0.1, 24, 72);
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
  })();
  return geometryCache;
}

interface Materials {
  /** The blade faces. Same alloy as `steel`, but hollow-ground — see below. */
  bladeSteel: THREE.MeshPhysicalMaterial;
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
  const geo = getScissorGeometry();

  return (
    <group ref={ref}>
      <mesh geometry={geo.blade} material={materials.bladeSteel} />
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
    /**
     * Shading budget. "low" drops the two most expensive things on the
     * material — the clearcoat lobe and anisotropic filtering of the specular
     * highlight — and the normal map with them. It costs roughly a third less
     * per fragment and still reads as a lit metal object, which is the whole
     * argument for having a low tier rather than showing nothing.
     */
    quality?: "high" | "low" | "still";
  }
>(function Scissor({ halfA, halfB, quality = "high" }, ref) {
  const geo = getScissorGeometry();

  const materials = useMemo<Materials>(() => {
    const rich = quality !== "low";
    const maps: ScissorMaps = rich
      ? getScissorMaps()
      : { roughness: null, normal: null, bladeNormal: null };

    // Steel is a cool grey, never white. Pure white metal reads as plastic —
    // and this was reading as cream, which is worse. Darkening the base a step
    // and pulling envMapIntensity back from 1.45 lets the environment's bright
    // strips punch out of a mid-grey body instead of blowing the whole surface
    // to a single flat value.
    const steel = new THREE.MeshPhysicalMaterial({
      color: '#b6bbc5',
      metalness: 1,
      // Multiplied by the roughness map green channel, so the effective range
      // lands near 0.10-0.38: polished, but with visible grind direction.
      roughness: 0.44,
      roughnessMap: maps.roughness,
      normalMap: maps.normal,
      envMapIntensity: 1.15,
      clearcoat: rich ? 0.3 : 0,
      clearcoatRoughness: 0.16,
    });
    steel.normalScale = new THREE.Vector2(0.45, 0.45);

    // The honed bevel: almost no roughness and no scratch maps. It is the one
    // near-mirror surface on the model, which is what makes it read as sharp.
    const honed = new THREE.MeshPhysicalMaterial({
      color: '#e6eaf2',
      metalness: 1,
      roughness: 0.04,
      // Stays high while the steel comes down. The whole point of this ribbon
      // is to be the brightest thing on the model — a blade looks sharp because
      // its ground edge catches light the flat of the blade cannot.
      envMapIntensity: 1.9,
      clearcoat: rich ? 0.6 : 0,
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
      clearcoat: rich ? 0.25 : 0,
      clearcoatRoughness: 0.2,
    });
    brass.normalScale = new THREE.Vector2(0.18, 0.18);

    // The screw slot. Dark and rough, so it reads as a recess not a decal.
    const dark = new THREE.MeshStandardMaterial({
      color: '#1b1b20',
      metalness: 0.7,
      roughness: 0.65,
    });

    /* The blade face carries the hollow-ground cross-curve; the shank and
     * rings do not, because they are round geometry already and adding a second
     * curvature to a tube just makes it look dented. Same alloy, same grind,
     * one different map — so the two still read as one object. */
    const bladeSteel = steel.clone();
    bladeSteel.normalMap = rich ? maps.bladeNormal : null;
    bladeSteel.normalScale = new THREE.Vector2(1.35, 1.35);
    // The flats are the darkest part of a real blade — they are mostly
    // reflecting the dark room. Only the ground edge and the light strips are
    // bright, and that ratio is what makes steel read as steel.
    bladeSteel.envMapIntensity = 1.3;

    return { bladeSteel, steel, honed, brass, dark };
  }, [quality]);

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
