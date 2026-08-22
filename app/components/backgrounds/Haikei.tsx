/**
 * Haikei-style SVG backgrounds.
 *
 * ⚠️  PROVENANCE, stated plainly: Haikei (haikei.app) is a browser-only GUI
 *     generator. It has no npm package, no API and no programmatic export — you
 *     download SVGs from its web app by hand. So these are NOT Haikei exports.
 *     They are hand-authored SVGs in the same generator families Haikei offers
 *     (Layered Waves, Blurry Gradient, Low Poly Grid, Blob Scene), coloured from
 *     the Barber Club palette.
 *
 *     Each is a drop-in replacement target: generate the real thing in Haikei
 *     with the brand colours below, and paste it over the `<svg>` body. The
 *     component wrapper, sizing and accessibility handling stay as they are.
 *
 * Palette used (from globals.css @theme):
 *   ink #0b0b0c · ink-raised #141416 · ink-sunken #060607
 *   brass #c8a35a · brass-dim #8e733e · pole (red) #b4302b
 *
 * All are decorative: aria-hidden, pointer-events-none, and they never carry
 * information. All geometry is static — no randomness at render time, so server
 * and client markup always match.
 */

import { cn } from "@/lib/utils";

type BgProps = {
  className?: string;
  /** Flip vertically — for a divider at the top of a section rather than the bottom. */
  flip?: boolean;
};

/**
 * Haikei family: **Layered Waves**.
 *
 * Four stacked waves fading from brass into the page background. Used as a
 * section transition so the seam between two dark sections is not a hard line.
 */
export function LayeredWaves({ className, flip }: BgProps) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none block w-full",
        flip && "rotate-180",
        className
      )}
    >
      <path
        fill="#c8a35a"
        fillOpacity="0.05"
        d="M0,192 C240,256 480,96 720,128 C960,160 1200,288 1440,224 L1440,320 L0,320 Z"
      />
      <path
        fill="#c8a35a"
        fillOpacity="0.08"
        d="M0,224 C220,288 460,160 720,192 C980,224 1220,304 1440,256 L1440,320 L0,320 Z"
      />
      <path
        fill="#141416"
        d="M0,256 C200,304 480,208 720,240 C960,272 1240,320 1440,288 L1440,320 L0,320 Z"
      />
      <path
        fill="#0b0b0c"
        d="M0,288 C240,320 480,256 720,272 C960,288 1200,320 1440,304 L1440,320 L0,320 Z"
      />
    </svg>
  );
}

/**
 * Haikei family: **Blurry Gradient**.
 *
 * Three large blurred ellipses. Cheaper and far crisper than a raster gradient:
 * one inline SVG, no network request, and it scales to any viewport without
 * banding.
 */
export function BlurryGradient({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <filter id="hk-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="90" />
        </filter>
      </defs>
      <g filter="url(#hk-blur)">
        <ellipse cx="220" cy="180" rx="260" ry="200" fill="#c8a35a" fillOpacity="0.16" />
        <ellipse cx="620" cy="420" rx="240" ry="190" fill="#b4302b" fillOpacity="0.10" />
        <ellipse cx="430" cy="300" rx="200" ry="160" fill="#8e733e" fillOpacity="0.12" />
      </g>
    </svg>
  );
}

/**
 * Haikei family: **Low Poly Grid**.
 *
 * A triangulated mesh. The vertex offsets are a fixed lookup table rather than
 * Math.random(): random geometry would differ between the server render and the
 * client hydration, and would also trip React's purity rule for calling an
 * impure function during render.
 */
const JITTER = [
  0.42, -0.31, 0.18, 0.37, -0.24, 0.11, -0.4, 0.29, 0.05, -0.17, 0.33, -0.36,
  0.21, 0.08, -0.28, 0.39, -0.12, 0.26, -0.05, 0.44, -0.33, 0.14, 0.31, -0.22,
];

function lowPolyTriangles(cols: number, rows: number, w: number, h: number) {
  const cw = w / cols;
  const ch = h / rows;
  let j = 0;
  const jitter = () => JITTER[j++ % JITTER.length];

  const pt = (c: number, r: number) => {
    const edge = c === 0 || r === 0 || c === cols || r === rows;
    const dx = edge ? 0 : jitter() * cw * 0.45;
    const dy = edge ? 0 : jitter() * ch * 0.45;
    return [c * cw + dx, r * ch + dy] as const;
  };

  const grid: (readonly [number, number])[][] = [];
  for (let r = 0; r <= rows; r++) {
    const row: (readonly [number, number])[] = [];
    for (let c = 0; c <= cols; c++) row.push(pt(c, r));
    grid.push(row);
  }

  const tris: { d: string; o: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = grid[r][c];
      const b = grid[r][c + 1];
      const d = grid[r + 1][c];
      const e = grid[r + 1][c + 1];
      // Opacity ramps down and to the right, so the mesh dissolves into the page.
      const base = 0.03 + ((cols - c) / cols) * 0.05 + ((rows - r) / rows) * 0.03;
      tris.push({ d: `M${a[0]},${a[1]} L${b[0]},${b[1]} L${d[0]},${d[1]} Z`, o: base });
      tris.push({
        d: `M${b[0]},${b[1]} L${e[0]},${e[1]} L${d[0]},${d[1]} Z`,
        o: base * 0.7,
      });
    }
  }
  return tris;
}

// Computed once at module load, not per render.
const LOW_POLY = lowPolyTriangles(8, 6, 800, 600);

export function LowPolyGrid({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      {LOW_POLY.map((t, i) => (
        <path
          key={i}
          d={t.d}
          fill="#c8a35a"
          fillOpacity={t.o}
          stroke="#c8a35a"
          strokeOpacity={t.o * 0.6}
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}

/**
 * Haikei family: **Blob Scene**.
 *
 * A single organic blob, anchored to one corner. Used behind the group-packages
 * block to give the most valuable product on the site a bit of visual weight.
 */
export function BlobScene({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <linearGradient id="hk-blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c8a35a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#b4302b" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        fill="url(#hk-blob)"
        d="M430,90 C500,140 560,220 545,305 C530,390 440,480 345,505 C250,530 150,490 95,415 C40,340 30,230 85,155 C140,80 260,40 430,90 Z"
      />
    </svg>
  );
}
