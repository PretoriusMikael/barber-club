/**
 * The real photography, and the only place its alt text is written.
 *
 * SOURCE: supplied by the client, 2026-08-23, in /public/assets.
 *
 * TWO THINGS WORTH KNOWING BEFORE EDITING THIS FILE.
 *
 * 1. CHECK THE PICTURE, NOT THE FILENAME. `two-friends-cuttin-next-to-each-
 *    other.avif` is two strangers in adjacent chairs; `lining-up-fade.avif`
 *    and `cool-kid-in-sunglasses.avif` are two different young clients and it
 *    is easy to swap them. Every `alt` in this file and in content/gallery.ts
 *    was written from the rendered image. Alt text here doubles as image SEO,
 *    so a confident wrong description is worse than a plain one.
 *
 * 2. THEY ARE THREE DIFFERENT KINDS OF ASSET, not one pool.
 *
 *    - Four portraits at 456×532 and a 950×689 group shot. Small. Fine at tile
 *      size, nowhere near enough for anything full-bleed.
 *    - Three ULTRA-WIDE strips at 2.3:1 to 2.9:1 that already have a dark
 *      gradient burned into one side. These are not photographs that happen to
 *      be wide — they are banners, pre-treated for text to sit in the dark half,
 *      and roughly half of each frame is nearly black. Dropped into a square
 *      gallery tile one would render as a half-black rectangle. Used as a
 *      full-bleed band with the copy in the dark zone, they are exactly right,
 *      which is what `side` records below.
 *
 * All eight files are distinct. An earlier pass in this codebase recorded two
 * of them as byte-identical duplicates; that was wrong, and wrong in an
 * instructive way — the hashes were taken while the files were still being
 * copied into the directory, so one of them was measured mid-write. Anything
 * derived from a directory read is only as stable as the directory was at the
 * time. The eight were re-hashed and re-rendered from the settled files.
 */

export interface Photograph {
  src: string;
  /** Written from the image itself. Never from the filename. */
  alt: string;
  /** Intrinsic pixels. Recorded so nobody has to guess how far a file stretches. */
  width: number;
  height: number;
  /**
   * CSS object-position. These are wide crops of off-centre subjects, so
   * letting them default to `center` throws away the subject on narrow screens.
   */
  focus?: string;
}

/** Which half of a banner strip is dark, and therefore where copy can live. */
export type BandSide = "left" | "right";

export interface BandPhotograph extends Photograph {
  /** The side the SUBJECT is on. Copy goes on the other one. */
  subject: BandSide;
}

/**
 * HERO. The largest asset supplied (1904×822) and the only one with enough
 * height to survive a full-viewport crop — at a 900px-tall hero it upscales by
 * 1.09x, which is invisible under the hero's gradient stack.
 *
 * It is black and white while everything else here is colour. That is kept
 * rather than corrected: it sits under three overlay layers and a grain pass,
 * so almost no colour would read through anyway, and a monochrome hero above a
 * colour gallery is a deliberate-looking split rather than an inconsistency. It
 * also leaves brass as the only chromatic thing in the first viewport, which is
 * the whole point of reserving that colour for the booking CTA.
 */
export const heroPhoto: Photograph = {
  src: "/assets/barber-and-client-side-shot.avif",
  alt: "A barber combing and cutting a seated client's hair, silhouetted against a bright shop window",
  width: 1904,
  height: 822,
  // The barber and client sit left of centre; a centred crop pushes them
  // under the headline column on wide screens.
  focus: "38% 35%",
};

/**
 * BAND — between the tier comparison and the story. Subject is the hand, comb
 * and scissors on the left; the right two-thirds is nearly black already, so
 * the copy needs no scrim of its own.
 */
export const cutBand: BandPhotograph = {
  src: "/assets/close-up-of-hair-being-cut.avif",
  alt: "A barber's hand holding a comb and scissors, cutting a section of hair",
  width: 1897,
  height: 660,
  subject: "left",
  focus: "20% 50%",
};

/**
 * BAND — behind the closing call to action. Mirror of the one above: subject on
 * the right, dark left.
 */
export const shaveBand: BandPhotograph = {
  src: "/assets/lining-up-beard.avif",
  alt: "A barber leaning in to line up a reclined client's beard",
  width: 1904,
  height: 662,
  subject: "right",
  focus: "72% 50%",
};

/**
 * THE TEAM, as they actually are.
 *
 * This does NOT make content/barbers.ts obsolete and must not be treated as
 * though it does. A group photograph shows four people; it does not tell us
 * their names, their branches or what they are best at, and "Book with [name]"
 * is the CTA the roster exists for. The photo goes above the gap panel, not
 * instead of it.
 */
export const teamPhoto: Photograph = {
  src: "/assets/group-of-employees.avif",
  alt: "Four Barber Club barbers in branded shirts, standing together in one of the shops",
  width: 950,
  height: 689,
  focus: "50% 30%",
};
