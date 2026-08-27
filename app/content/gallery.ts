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
  ratio: "3/4" | "1/1" | "4/5" | "6/7";
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
  // --- Supplied 2026-08-23. Real work, in Barber Club chairs. -------------
  // Native ratio is 456x532 = 6/7. Shown at exactly that rather than forced
  // into the 3/4 and 4/5 slots the briefs assumed, because at 456px wide there
  // is no spare resolution to crop away — every pixel discarded is one the tile
  // then has to upscale back. Alt text is written from the picture; the
  // filenames on these are not reliable (see content/photography.ts).
  { id: "g01", src: "/assets/lining-up-fade.avif", tags: ["fades", "kids"], ratio: "6/7", alt: "A young client having a fade clipped in at the back and sides", brief: "SUPPLIED — young client mid-fade" },
  { id: "g02", src: "/assets/barber-and-client.avif", tags: ["club-cut"], ratio: "6/7", alt: "A barber preparing to start a cut, with the client waiting in the chair", brief: "SUPPLIED — barber and client at the chair" },
  { id: "g13", src: "/assets/two-friends-cuttin-next-to-each-other.avif", tags: ["club-cut", "groups"], ratio: "6/7", alt: "Two clients being cut side by side in adjacent chairs", brief: "SUPPLIED — two chairs working at once" },
  { id: "g16", src: "/assets/cool-kid-in-sunglasses.avif", tags: ["kids"], ratio: "6/7", alt: "A young client in sunglasses waiting in the barber chair", brief: "SUPPLIED — schoolboy cut, waiting his turn" },
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
  // Still outstanding — these two briefs used to sit on g01/g02 before real
  // photographs took those slots. The shot list does not shrink just because
  // some of it arrived.
  { id: "g14", src: null, tags: ["fades"], ratio: "3/4", alt: "Blade fade with a sharp line-up", brief: "Blade Fade #1 — three-quarter rear, raking light on the blend" },
  { id: "g15", src: null, tags: ["club-cut"], ratio: "4/5", alt: "The Club Cut, textured on top", brief: "Club Cut #1 — front three-quarter, soft key" },
];

/**
 * What the home page shows.
 *
 * Real photographs only. The briefs above are a production tool and no longer
 * render anywhere — see components/ui/AssetFrame.tsx. A section that exists to
 * prove this business can cut hair must not be mostly evidence that it has not
 * been photographed yet.
 *
 * Derived rather than hand-listed, so it maintains itself: every new `src` that
 * lands in the array above appears here automatically, and nothing without one
 * ever can.
 */
export const homeGallery = gallery.filter((item) => Boolean(item.src));

/**
 * Hero video — the 8-second loop behind the headline.
 *
 * ⚠️  PLACEHOLDER FOOTAGE. This is licensed stock, standing in so the mechanic
 *     can be seen and signed off. It is NOT Barber Club's shop and must not
 *     survive to launch. See PITCH-NOTES.md §2.5. The real brief is `brief`
 *     below, and this clip is close enough to it to hand the videographer as
 *     reference.
 *
 * THE PHOTOGRAPH IS THE LCP ELEMENT, NOT THIS. The still renders always and the
 * loop fades in over it once a capability gate passes (lib/motion.ts
 * `canPlayHeroLoop`), so the video is never on the critical path and never
 * downloads on a phone, a metered connection or a reduced-motion setting.
 *
 * Two encodes, one request: the browser picks the first <source> it can play.
 * VP9 for everything modern, H.264 for Safari and older Android. No audio track
 * at all — not a silent one — which is worth about a third of the file.
 *
 * Self-hosting is fine at this size. If the final loop grows past ~500 KB, move
 * it to Mux or Cloudflare Stream: adaptive bitrate matters a great deal on SA
 * mobile networks.
 */
export const heroVideo = {
  /** VP9. 1152×648, 4.2s, 24fps, no audio, 87 KB. */
  webm: "/video/hero-loop.webm",
  /** H.264 fallback, same source. */
  mp4: "/video/hero-loop.mp4",
  brief:
    "4–8s seamless loop: clippers meeting a neckline, slow push-in, shallow DOF, warm practical lighting. No audio track. Cut so the last frame matches the first — crossfade the tail back over the head if it does not. Keep it dark and low-contrast: the headline sits on top of it, and a bright frame here costs the first viewport its legibility. Shoot at a flagship branch (Val de Vie or Franschhoek).",
};

/** Brand/atmosphere shots — the current site's own copy sells coffee, music and
 *  Wi-Fi as part of the experience, so photograph those, not just haircuts. */
export const atmosphere: AssetBrief[] = [
  { src: null, alt: "Coffee being made in the shop", brief: "The coffee — the site's own copy sells it, so show it" },
  { src: null, alt: "The chairs and mirrors", brief: "Chairs down the length of the shop, practical lights in frame" },
  { src: null, alt: "The waiting area", brief: "Waiting area, warm and lived-in, no staged props" },
];
