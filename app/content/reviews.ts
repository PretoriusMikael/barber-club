/**
 * Google reviews.
 *
 * ⚠️  EMPTY ON PURPOSE. Do not hand-type reviews and do not invent a rating.
 *     AggregateRating schema built on unverifiable numbers is a structured-data
 *     violation and can earn a manual action in Search.
 *
 * For an 11-branch group this needs a per-branch fetch: each branch has its own
 * Google Business Profile, its own Place ID and its own rating. A single
 * group-wide star count would be both wrong and unrankable.
 *
 * Production path:
 *   1. Get a Place ID per branch from the Google Place ID finder.
 *   2. Fetch Place Details server-side (`rating`, `user_ratings_total`, `reviews`).
 *   3. Cache with ISR: `export const revalidate = 86400` (daily).
 *   4. Populate `reviewsByBranch`, then flip `site.rating.verified` — the star
 *      rows and the AggregateRating JSON-LD are all gated on that flag.
 */

export interface Review {
  id: string;
  author: string;
  /** 1–5 */
  rating: number;
  text: string;
  /** ISO date */
  date: string;
  branchSlug: string;
}

export const reviews: Review[] = [];

/** branchSlug → Google Place ID. Populate before wiring the Places API. */
export const placeIdByBranch: Record<string, string> = {};
