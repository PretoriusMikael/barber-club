import type { AssetBrief } from "./services";

/**
 * Barber roster.
 *
 * ⚠️  DELIBERATELY EMPTY. The current barberclub.co.za names not a single
 *     barber anywhere across its 17 pages — it says only "a legendary team of
 *     experienced barbers". Inventing names and quotes for real people would be
 *     both false and, for a business with 11 branches of actual staff,
 *     genuinely harmful.
 *
 * While this array is empty the Team section renders an honest "roster not
 * supplied" panel instead of fake cards.
 *
 * This is a real conversion opportunity, not just a content gap. "Book with
 * [name]" is the highest-converting CTA on a barber site for returning
 * customers, and a chain of this size almost certainly has barbers with
 * personal followings. To switch it on:
 *
 *   1. Collect per barber: name, home branch, speciality, years behind the
 *      chair, and ONE sentence in their own words (collect it, do not write it).
 *   2. Shoot a 3:4 portrait of each at their own station — not a studio
 *      backdrop — with consistent lighting across all branches.
 *   3. Set `bookingId` to the vendor's staff id so the deep link pre-selects them.
 */

export interface Barber {
  slug: string;
  name: string;
  /** Which branch they normally work. */
  branchSlug: string;
  speciality: string;
  /** One sentence, in the barber's own words. Collect it; do not write it. */
  quote: string;
  yearsExperience: number;
  instagram?: string;
  /** Vendor-side staff id for booking deep links. */
  bookingId?: string;
  portrait: AssetBrief;
}

export const barbers: Barber[] = [];

export const rosterSupplied = barbers.length > 0;
