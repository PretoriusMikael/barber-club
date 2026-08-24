import * as THREE from 'three';

/**
 * Procedural brushed-metal maps for the scissor.
 *
 * Polished steel is never uniformly smooth — it carries fine directional grind
 * marks from manufacture, and those marks are most of what tells the eye "this
 * is metal" rather than "this is a grey plastic shape". A constant roughness
 * value gives a mirror with no character; a roughness map with directional
 * streaks gives the long, broken highlights real blades have.
 *
 * Generated on a canvas at runtime: no texture files to download, no asset
 * pipeline, a couple of hundred bytes of code instead of a few hundred KB of
 * PNGs.
 *
 * Deterministic by construction — a seeded PRNG, not Math.random. Random
 * geometry would differ between renders and trips React's purity rule.
 */

/** Seeded PRNG (mulberry32). Same seed, same scratches, every time. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1024;
const H = 256;

/**
 * Roughness map. three multiplies `material.roughness` by this texture's GREEN
 * channel, so mid-grey ≈ half the material value. Streaks run along U, which is
 * the blade's long axis after the UV mapping ExtrudeGeometry produces.
 */
function buildRoughness(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rand = mulberry32(0x51c1);

  // Base: fairly polished.
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, 0, W, H);

  // Fine grind lines, mostly parallel, a few coarser.
  for (let i = 0; i < 900; i++) {
    const y = rand() * H;
    const len = 120 + rand() * (W - 120);
    const x = rand() * (W - len);
    const light = rand();
    const v = light > 0.5 ? 255 : 0;
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.02 + rand() * 0.07})`;
    ctx.lineWidth = rand() < 0.9 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    // A hair of vertical drift, so the lines are not mechanically parallel.
    ctx.lineTo(x + len, y + (rand() - 0.5) * 1.6);
    ctx.stroke();
  }

  // A few deeper scratches — the eye reads these as wear and they sell the scale.
  for (let i = 0; i < 14; i++) {
    const y = rand() * H;
    ctx.strokeStyle = `rgba(190,190,190,${0.12 + rand() * 0.15})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rand() * W * 0.4, y);
    ctx.lineTo(W * (0.5 + rand() * 0.5), y + (rand() - 0.5) * 5);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  applyBladeScale(tex);
  return tex;
}

/**
 * ExtrudeGeometry writes UVs in WORLD units, not normalised 0–1 — the front and
 * back faces just take the shape's own (x, y). The blade runs 3.6 units along X
 * and about 0.5 across Y, so at repeat (1, 1) the map tiled three and a half
 * times down the blade while covering only half its height: the grind lines
 * came out short, obviously repeating, and squashed flat across the width.
 *
 * Compressing U stretches each streak along the blade the way a real grind runs
 * and pushes the tile seam off the end of the geometry; multiplying V puts the
 * line spacing back to something the eye reads as fine machining rather than
 * corduroy.
 */
function applyBladeScale(tex: THREE.Texture) {
  tex.repeat.set(0.3, 3);
}

/**
 * Normal map for the same scratches. Tangent-space, so flat is (128, 128, 255).
 * Only the green channel is perturbed: the scratches run along U, so their
 * surface tilt is across V.
 *
 * `curved` additionally bakes in a broad cross-blade curvature — see
 * buildBladeNormal below for why that one gradient is the single most important
 * thing in this file.
 */
function buildNormal(curved = false): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rand = mulberry32(0x51c1); // same seed → scratches line up with roughness

  if (curved) {
    // A linear ramp in green across V: the surface tilts steadily from one edge
    // of the blade to the other, which is exactly the normal field of a shallow
    // cylinder.
    //
    // The range has to be big. A first attempt at ±58 changed nothing visible,
    // and the reason is worth writing down: a mirror's reflection vector turns
    // at TWICE the rate of its normal, but the environment it is sampling is a
    // dark room with a handful of narrow sources in it. A ±25° reflection sweep
    // simply moves around inside whichever single source the blade already
    // faced, so the fill stayed flat and merely shifted colour. ±98 puts the
    // sweep near ±80°, which is wide enough to cross from a bright strip into
    // the dark between sources and back — and it is the crossing, not the
    // brightness, that reads as curved polished metal.
    const ramp = ctx.createLinearGradient(0, 0, 0, H);
    ramp.addColorStop(0, 'rgb(128,30,255)');
    ramp.addColorStop(0.5, 'rgb(128,128,255)');
    ramp.addColorStop(1, 'rgb(128,226,255)');
    ctx.fillStyle = ramp;
  } else {
    ctx.fillStyle = 'rgb(128,128,255)';
  }
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 900; i++) {
    const y = rand() * H;
    const len = 120 + rand() * (W - 120);
    const x = rand() * (W - len);
    const up = rand() > 0.5;
    // Very shallow tilt — a scratch you can see but not feel.
    const g = up ? 150 : 106;
    ctx.strokeStyle = `rgba(128,${g},255,${0.16 + rand() * 0.2})`;
    ctx.lineWidth = rand() < 0.9 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rand() - 0.5) * 1.6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  applyBladeScale(tex);
  return tex;
}

/**
 * The blade's own normal map, and the reason the blades stopped looking like
 * cream card with a blue one next to it.
 *
 * A `metalness: 1` surface is a mirror, and a FLAT mirror reflects exactly one
 * direction of its surroundings — so a perfectly planar blade face samples the
 * environment at a single point and fills with a single flat colour. No amount
 * of work on the lighting rig can fix that: point one flat mirror at a warm
 * softbox and it is a warm rectangle, point the other at a cool strip and it is
 * a blue rectangle. That is precisely what was on screen.
 *
 * Real shears are hollow-ground: the face is very slightly concave-to-convex
 * across its width, not planar. That curvature is why a real blade shows a
 * highlight that travels along it rather than a flat fill — the surface normal
 * sweeps through a range of directions, so one blade face samples a whole arc
 * of the environment.
 *
 * Baking that curve into the normal map buys the same optical behaviour for the
 * cost of a gradient, with no extra vertices and — importantly — no change to
 * the thickness budget at the top of ScissorModel. Curving the actual geometry
 * was the first instinct and it does not fit: the two halves clear each other
 * by only 0.032 units, so a bulge deep enough to matter makes them interpenetrate
 * down the cutting edge, which is exactly where the eye is during the cut.
 *
 * The UV transform is calibrated, not guessed. ExtrudeGeometry writes UVs in
 * world units, and the blade profile spans y ∈ [-0.225, 0.36] — 0.585 units. To
 * lay the gradient across the blade EXACTLY once, V must scale by 1/0.585 and
 * shift by 0.225 × that. Get this wrong and the blade gets several cylinders
 * across its width, which reads as corrugation.
 */
const BLADE_Y_MIN = -0.225;
const BLADE_Y_SPAN = 0.585;

function buildBladeNormal(): THREE.CanvasTexture | null {
  const tex = buildNormal(true);
  if (!tex) return null;
  const vScale = 1 / BLADE_Y_SPAN;
  tex.repeat.set(0.28, vScale);
  tex.offset.set(0, -BLADE_Y_MIN * vScale);
  // The gradient must not tile, or the far side of the blade wraps back round
  // to the near side's normal and creates a hard crease down the spine.
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export interface ScissorMaps {
  roughness: THREE.Texture | null;
  /** Fine grind only. For the shank and rings, which are round already. */
  normal: THREE.Texture | null;
  /** Fine grind plus the hollow-ground cross-curve. Blades only. */
  bladeNormal: THREE.Texture | null;
}

// Built once per page, shared by every material. Canvas work is not free and
// there is no reason for two instances to generate identical bitmaps.
let cached: ScissorMaps | null = null;

export function getScissorMaps(): ScissorMaps {
  if (cached) return cached;
  cached = {
    roughness: buildRoughness(),
    normal: buildNormal(),
    bladeNormal: buildBladeNormal(),
  };
  return cached;
}

export function disposeScissorMaps() {
  cached?.roughness?.dispose();
  cached?.normal?.dispose();
  cached?.bladeNormal?.dispose();
  cached = null;
}
