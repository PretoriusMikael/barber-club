/**
 * What the prototyping toolbar can change, and how each change is expressed.
 *
 * ONE DEFINITION DRIVES THREE THINGS: the widget rendered for it, the CSS
 * applied live, and the CSS you copy out at the end. They cannot drift, because
 * they are the same function. That last part is what makes this a prototyping
 * tool rather than a toy — you can take a result back into globals.css instead
 * of squinting at it and guessing what you did.
 *
 * EVERY DEFAULT IS WHAT THE SITE ALREADY IS, so the toolbar starts as a no-op
 * and `css()` returns an empty string until you actually move something. Only
 * the deltas are ever applied or exported.
 *
 * WHY THE INJECTED CSS WINS WITHOUT `!important`
 *
 * Tailwind v4 puts its utilities in real cascade layers. Unlayered author
 * styles outrank every layer regardless of specificity — layer order is checked
 * before specificity is — so a plain rule in the injected stylesheet beats
 * `rounded-none` or `border` without needing `!important` anywhere. That matters
 * for a tool like this: `!important` would win the cascade but would also be
 * uncopyable, because you cannot paste it back into a real stylesheet.
 */

export type ControlValue = number | string | boolean;

interface Base {
  id: string;
  group: GroupId;
  label: string;
  /** Shown under the control when there is something worth warning about. */
  hint?: string;
}

export type Control =
  | (Base & {
      kind: "range";
      min: number;
      max: number;
      step: number;
      def: number;
      /** Rendered next to the value, e.g. "px". */
      unit?: string;
      css: (v: number) => string;
    })
  | (Base & { kind: "color"; def: string; css: (v: string) => string })
  | (Base & {
      kind: "select";
      def: string;
      options: { value: string; label: string }[];
      css: (v: string) => string;
      /** Google Fonts family to load when this option is chosen. */
      font?: (v: string) => string | null;
    })
  | (Base & { kind: "toggle"; def: boolean; css: (v: boolean) => string });

export type GroupId = "shape" | "type" | "colour" | "surface" | "motion";

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: "shape", label: "Shape" },
  { id: "type", label: "Type" },
  { id: "colour", label: "Colour" },
  { id: "surface", label: "Surface" },
  { id: "motion", label: "Motion" },
];

/* Elements that read as "a card, a control or a picture" in this codebase.
   `[class~="border"]` matches the exact Tailwind token `border` (all four
   sides) and deliberately not `border-t` / `border-b`, so turning the corner
   radius up rounds the cards without also rounding the hairline rules that
   separate sections. */
const BOXES = [
  'a[class*="inline-flex"]',
  "button",
  "article",
  '[class~="border"]',
  '[class*="border-dashed"]',
  "img",
  "canvas",
  '[class*="aspect-"]',
].join(",\n");

const round = (n: number, dp = 3) => Number(n.toFixed(dp));

export const CONTROLS: Control[] = [
  /* --- Shape ------------------------------------------------------------ */
  {
    kind: "range",
    id: "radius",
    group: "shape",
    label: "Corner radius",
    min: 0,
    max: 28,
    step: 1,
    def: 0,
    unit: "px",
    hint: "The site is square everywhere on purpose. This is the fastest way to find out whether it should be.",
    css: (v) => (v === 0 ? "" : `${BOXES} {\n  border-radius: ${v}px;\n}`),
  },
  {
    kind: "range",
    id: "borderWidth",
    group: "shape",
    label: "Border weight",
    min: 0,
    max: 3,
    step: 0.5,
    def: 1,
    unit: "px",
    css: (v) => (v === 1 ? "" : `[class~="border"] {\n  border-width: ${v}px;\n}`),
  },
  {
    kind: "color",
    id: "line",
    group: "shape",
    label: "Hairline colour",
    def: "#24242a",
    css: (v) => (v === "#24242a" ? "" : `:root {\n  --color-line: ${v};\n}`),
  },
  {
    kind: "select",
    id: "elevation",
    group: "shape",
    label: "Elevation",
    def: "border",
    hint: "Border or shadow, not both — a 1px border under a soft shadow is the ghost-card look.",
    options: [
      { value: "border", label: "Border only" },
      { value: "soft", label: "Soft shadow" },
      { value: "lifted", label: "Lifted" },
      { value: "shadowOnly", label: "Shadow, no border" },
    ],
    css: (v) => {
      if (v === "border") return "";
      const shadow =
        v === "soft"
          ? "0 6px 20px -8px rgba(0, 0, 0, 0.7)"
          : "0 20px 48px -20px rgba(0, 0, 0, 0.9)";
      const border = v === "shadowOnly" ? "\n  border-color: transparent;" : "";
      return `[class~="border"] {\n  box-shadow: ${shadow};${border}\n}`;
    },
  },

  /* --- Type ------------------------------------------------------------- */
  {
    kind: "select",
    id: "displayFont",
    group: "type",
    label: "Display face",
    def: "bebas",
    options: [
      { value: "bebas", label: "Bebas Neue (current)" },
      { value: "anton", label: "Anton" },
      { value: "oswald", label: "Oswald" },
      { value: "archivo", label: "Archivo Black" },
      { value: "shoulders", label: "Big Shoulders Display" },
      { value: "teko", label: "Teko" },
    ],
    font: (v) =>
      ({
        bebas: null,
        anton: "Anton",
        oswald: "Oswald:wght@500;600",
        archivo: "Archivo+Black",
        shoulders: "Big+Shoulders+Display:wght@600;700",
        teko: "Teko:wght@500;600",
      })[v] ?? null,
    css: (v) => {
      const family = {
        bebas: null,
        anton: "'Anton'",
        oswald: "'Oswald'",
        archivo: "'Archivo Black'",
        shoulders: "'Big Shoulders Display'",
        teko: "'Teko'",
      }[v];
      return family ? `:root {\n  --font-display: ${family}, Impact, sans-serif;\n}` : "";
    },
  },
  {
    kind: "select",
    id: "bodyFont",
    group: "type",
    label: "Body face",
    def: "inter",
    options: [
      { value: "inter", label: "Inter (current)" },
      { value: "dmsans", label: "DM Sans" },
      { value: "worksans", label: "Work Sans" },
      { value: "manrope", label: "Manrope" },
      { value: "plex", label: "IBM Plex Sans" },
    ],
    font: (v) =>
      ({
        inter: null,
        dmsans: "DM+Sans:wght@400;500;600",
        worksans: "Work+Sans:wght@400;500;600",
        manrope: "Manrope:wght@400;500;600",
        plex: "IBM+Plex+Sans:wght@400;500;600",
      })[v] ?? null,
    css: (v) => {
      const family = {
        inter: null,
        dmsans: "'DM Sans'",
        worksans: "'Work Sans'",
        manrope: "'Manrope'",
        plex: "'IBM Plex Sans'",
      }[v];
      return family ? `:root {\n  --font-sans: ${family}, ui-sans-serif, system-ui, sans-serif;\n}` : "";
    },
  },
  {
    kind: "range",
    id: "displayTracking",
    group: "type",
    label: "Display tracking",
    min: -0.06,
    max: 0.24,
    step: 0.005,
    def: 0.01,
    unit: "em",
    css: (v) =>
      round(v) === 0.01
        ? ""
        : `h1,\nh2,\nh3,\n[class*="font-display"] {\n  letter-spacing: ${round(v)}em;\n}`,
  },
  {
    kind: "range",
    id: "rootSize",
    group: "type",
    label: "Root size",
    min: 13,
    max: 20,
    step: 0.5,
    def: 16,
    unit: "px",
    hint: "Scales every rem-based size. Headings use clamp() with a vw term, so they move less than the body does.",
    css: (v) => (v === 16 ? "" : `html {\n  font-size: ${v}px;\n}`),
  },
  {
    kind: "range",
    id: "bodyLeading",
    group: "type",
    label: "Body leading",
    min: 1.25,
    max: 1.95,
    step: 0.05,
    def: 1.5,
    css: (v) => (round(v) === 1.5 ? "" : `body {\n  line-height: ${round(v)};\n}`),
  },
  {
    kind: "range",
    id: "measure",
    group: "type",
    label: "Container width",
    min: 56,
    max: 96,
    step: 1,
    def: 72,
    unit: "rem",
    css: (v) => (v === 72 ? "" : `[class*="max-w-6xl"] {\n  max-width: ${v}rem;\n}`),
  },

  /* --- Colour ------------------------------------------------------------ */
  {
    kind: "color",
    id: "brass",
    group: "colour",
    label: "Brass (accent)",
    def: "#c8a35a",
    hint: "Reserved for the booking CTA. If it starts appearing elsewhere, the eye stops reading it as the button that books.",
    css: (v) => (v === "#c8a35a" ? "" : `:root {\n  --color-brass: ${v};\n}`),
  },
  {
    kind: "color",
    id: "ink",
    group: "colour",
    label: "Ink (ground)",
    def: "#0b0b0c",
    css: (v) => (v === "#0b0b0c" ? "" : `:root {\n  --color-ink: ${v};\n}`),
  },
  {
    kind: "color",
    id: "inkRaised",
    group: "colour",
    label: "Ink raised (cards)",
    def: "#141416",
    css: (v) => (v === "#141416" ? "" : `:root {\n  --color-ink-raised: ${v};\n}`),
  },
  {
    kind: "color",
    id: "bone",
    group: "colour",
    label: "Bone (text)",
    def: "#f4f1ea",
    css: (v) => (v === "#f4f1ea" ? "" : `:root {\n  --color-bone: ${v};\n}`),
  },

  /* --- Surface ----------------------------------------------------------- */
  {
    kind: "range",
    id: "grain",
    group: "surface",
    label: "Film grain",
    min: 0,
    max: 0.25,
    step: 0.005,
    def: 0.085,
    css: (v) =>
      round(v) === 0.085 ? "" : `.grain::after {\n  opacity: ${round(v)};\n}`,
  },
  {
    kind: "range",
    id: "rhythm",
    group: "surface",
    label: "Section rhythm",
    min: 0.5,
    max: 1.8,
    step: 0.05,
    def: 1,
    unit: "x",
    hint: "Multiplies the vertical padding between sections. 1 is the shipped rhythm.",
    css: (v) =>
      round(v) === 1
        ? ""
        : `main > section {\n  padding-top: ${round(7 * v, 2)}rem;\n  padding-bottom: ${round(5 * v, 2)}rem;\n}`,
  },

  /* --- Motion ------------------------------------------------------------ */
  {
    kind: "select",
    id: "ease",
    group: "motion",
    label: "Arrival curve",
    def: "expo",
    hint: "Reaches the CSS layer only. The scroll reveals are driven by motion in JS and keep their own curve.",
    options: [
      { value: "expo", label: "Expo out (current)" },
      { value: "quint", label: "Quint out" },
      { value: "back", label: "Slight overshoot" },
      { value: "linear", label: "Linear" },
    ],
    css: (v) => {
      const curve = {
        expo: null,
        quint: "cubic-bezier(0.22, 1, 0.36, 1)",
        back: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        linear: "linear",
      }[v];
      return curve ? `:root {\n  --ease-out-expo: ${curve};\n}` : "";
    },
  },
  {
    kind: "toggle",
    id: "freeze",
    group: "motion",
    label: "Freeze animation",
    def: false,
    hint: "Pauses every CSS animation and transition. For holding a frame still while you look at it.",
    css: (v) =>
      v
        ? `*,\n*::before,\n*::after {\n  animation-play-state: paused;\n  transition: none;\n}`
        : "",
  },
];

export const DEFAULTS: Record<string, ControlValue> = Object.fromEntries(
  CONTROLS.map((c) => [c.id, c.def])
);

/**
 * Scope the applied CSS away from the toolbar itself.
 *
 * The override selectors deliberately include `button`, `img` and
 * `[class~="border"]`, because that is what a card or a control looks like in
 * this codebase — and the toolbar is built out of exactly those. Turning the
 * corner radius up would round the toolbar's own buttons along with the site's,
 * which makes the tool part of the thing it is measuring.
 *
 * This runs only on the CSS that gets APPLIED. `buildCss` stays clean, because
 * its output is meant to be pasted into globals.css where no toolbar exists and
 * `:not([data-bc-dev] *)` would be meaningless noise.
 *
 * `:root`, `html`, `body` and `*` are left alone: they cannot be excluded from
 * meaningfully (the toolbar lives inside body), so instead the toolbar's own
 * styles are written in px and literal colours, inheriting nothing it could be
 * knocked over by.
 */
export function scopeCss(css: string): string {
  return css.replace(/([^{}]+)\{/g, (_m, selectors: string) =>
    selectors
      .split(",")
      .map((s) => {
        const t = s.trim();
        if (!t || /^(:root|html|body|\*)/.test(t)) return t;
        // The exclusion must go BEFORE any pseudo-element. Nothing may follow a
        // pseudo-element in a compound selector, so `.grain::after:not(…)` is
        // invalid and the browser drops the whole rule — silently, which is how
        // the film-grain control shipped doing nothing at all until a check
        // compared the rules emitted against the rules the parser accepted.
        const cut = t.indexOf("::");
        if (cut === -1) return `${t}:not([data-bc-dev] *)`;
        return `${t.slice(0, cut)}:not([data-bc-dev] *)${t.slice(cut)}`;
      })
      .filter(Boolean)
      .join(",\n") + " {"
  );
}

/** The CSS for the current values — deltas only, and exactly what gets copied. */
export function buildCss(values: Record<string, ControlValue>): string {
  const parts: string[] = [];
  for (const c of CONTROLS) {
    const v = values[c.id] ?? c.def;
    let out = "";
    if (c.kind === "range") out = c.css(Number(v));
    else if (c.kind === "toggle") out = c.css(Boolean(v));
    else out = c.css(String(v));
    if (out) parts.push(out);
  }
  return parts.join("\n\n");
}

/** Google Fonts families needed by the current selection, if any. */
export function fontHref(values: Record<string, ControlValue>): string | null {
  const families: string[] = [];
  for (const c of CONTROLS) {
    if (c.kind !== "select" || !c.font) continue;
    const f = c.font(String(values[c.id] ?? c.def));
    if (f) families.push(f);
  }
  if (!families.length) return null;
  return `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;
}

export function countChanged(values: Record<string, ControlValue>): number {
  return CONTROLS.filter((c) => (values[c.id] ?? c.def) !== c.def).length;
}
