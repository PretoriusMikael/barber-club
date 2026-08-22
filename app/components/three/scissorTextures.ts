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
  return tex;
}

/**
 * Normal map for the same scratches. Tangent-space, so flat is (128, 128, 255).
 * Only the green channel is perturbed: the scratches run along U, so their
 * surface tilt is across V.
 */
function buildNormal(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rand = mulberry32(0x51c1); // same seed → scratches line up with roughness

  ctx.fillStyle = 'rgb(128,128,255)';
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
  return tex;
}

export interface ScissorMaps {
  roughness: THREE.Texture | null;
  normal: THREE.Texture | null;
}

// Built once per page, shared by every material. Canvas work is not free and
// there is no reason for two instances to generate identical bitmaps.
let cached: ScissorMaps | null = null;

export function getScissorMaps(): ScissorMaps {
  if (cached) return cached;
  cached = { roughness: buildRoughness(), normal: buildNormal() };
  return cached;
}

export function disposeScissorMaps() {
  cached?.roughness?.dispose();
  cached?.normal?.dispose();
  cached = null;
}
