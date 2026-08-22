import type { AssetBrief } from "./services";

/**
 * The portfolio — the single highest-leverage asset class on the project.
 *
 * Rules:
 *  - Real clients, real cuts, shot in Barber Club chairs. Stock is detected instantly.
 *  - Cover a genuine range of hair textures and skin tones. A Cape Winelands
 *    barber gallery that shows no textured or coily work silently disqualifies a
 *    large share of the market.
 *  - Shoot across MULTIPLE branches. An 11-branch group photographed entirely in
 *    one shop looks like one shop.
 *  - Refresh monthly; commission a repeat half-day shoot every 6 months.
 *  - `alt` is descriptive, not decorative — it doubles as image SEO.
 */

export type GalleryTag = "fades" | "club-cut" | "beards" | "shaves" | "kids" | "groups";

export interface GalleryItem extends AssetBrief {
  id: string;
  tags: GalleryTag[];
  /** Explicit aspect ratio keeps CLS at zero. */
  ratio: "3/4" | "1/1" | "4/5";
  /** Which branch it was shot in — useful for branch pages later. */
  branchSlug?: string;
}

export const galleryTagLabels: Record<GalleryTag, string> = {
  fades: "Blade fades",
  "club-cut": "Club cuts",
  beards: "Beards",
  shaves: "Hot-towel shaves",
  kids: "Schoolboy cuts",
  groups: "Group events",
};

export const gallery: GalleryItem[] = [
  { id: "g01", src: null, tags: ["fades"], ratio: "3/4", alt: "Blade fade with a sharp line-up", brief: "Blade Fade #1 — three-quarter rear, raking light on the blend" },
  { id: "g02", src: null, tags: ["club-cut"], ratio: "4/5", alt: "The Club Cut, textured on top", brief: "Club Cut #1 — front three-quarter, soft key" },
  { id: "g03", src: null, tags: ["beards"], ratio: "1/1", alt: "Full beard shaped with a defined cheek line", brief: "Beard #1 — profile, backlit rim on the beard edge" },
  { id: "g04", src: null, tags: ["fades", "beards"], ratio: "3/4", alt: "Blade fade paired with a sculpted beard", brief: "Combo #1 — straight-on, symmetrical framing" },
  { id: "g05", src: null, tags: ["shaves"], ratio: "4/5", alt: "Hot-towel shave in progress", brief: "Shave #1 — steam, lather, razor mid-pass" },
  { id: "g06", src: null, tags: ["fades"], ratio: "1/1", alt: "Taper fade on coily hair with a defined line-up", brief: "Fade #2 — coily/4C texture. Non-negotiable inclusion." },
  { id: "g07", src: null, tags: ["club-cut"], ratio: "3/4", alt: "Longer Club Cut swept back", brief: "Club Cut #2 — longer length, movement in the hair" },
  { id: "g08", src: null, tags: ["kids"], ratio: "4/5", alt: "Schoolboy cut, finished", brief: "Kids #1 — signed parental release required" },
  { id: "g09", src: null, tags: ["beards"], ratio: "3/4", alt: "Short boxed beard with a clean neckline", brief: "Beard #2 — under-chin angle showing the neckline" },
  { id: "g10", src: null, tags: ["groups"], ratio: "1/1", alt: "A groomsmen party mid-service", brief: "Groups #1 — wedding party, exclusive-use feel" },
  { id: "g11", src: null, tags: ["fades"], ratio: "4/5", alt: "Drop fade with a hard part", brief: "Fade #3 — hard part detail, top light" },
  { id: "g12", src: null, tags: ["club-cut"], ratio: "3/4", alt: "Textured crop with a natural finish", brief: "Club Cut #3 — wavy/curly texture" },
];

export const homeGallery = gallery.slice(0, 9);

/**
 * Hero video.
 *
 * Host on Mux or Cloudflare Stream — adaptive bitrate matters a great deal on
 * SA mobile networks. A self-hosted MP4 is acceptable only for a loop this short.
 */
export const heroVideo = {
  /** ~8s seamless loop, muted, no audio track at all (halves the file size). */
  src: "",
  /** LCP element. Must exist before launch — the video is decorative. */
  poster: "",
  brief:
    "8s seamless loop: clippers meeting a neckline, slow push-in, shallow DOF, warm practical lighting. No audio track. Poster frame graded identically. Shoot at a flagship branch (Val de Vie or Franschhoek).",
};

/** Brand/atmosphere shots — the current site's own copy sells coffee, music and
 *  Wi-Fi as part of the experience, so photograph those, not just haircuts. */
export const atmosphere: AssetBrief[] = [
  { src: null, alt: "Coffee being made in the shop", brief: "The coffee — the site's own copy sells it, so show it" },
  { src: null, alt: "The chairs and mirrors", brief: "Chairs down the length of the shop, practical lights in frame" },
  { src: null, alt: "The waiting area", brief: "Waiting area, warm and lived-in, no staged props" },
];
