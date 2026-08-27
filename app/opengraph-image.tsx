import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { branches } from "@/content/branches";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

/**
 * The site's link preview card.
 *
 * This mattered more than the usual OG image and was the one asset the build was
 * missing outright: a barber gets shared in WhatsApp groups constantly, and a
 * WhatsApp share with no image is a grey rectangle with a URL in it. The
 * previous plan was a static /public/og.jpg that nobody had made.
 *
 * Generated instead, at build time, from the same words as the site — so it can
 * never drift from the brand, needs no designer round-trip, and costs nothing to
 * keep in step when the branch count changes. Layout and the Satori constraints
 * live in lib/og.tsx, shared with the branch, menu and groups cards.
 *
 * Deliberately typographic: no photograph. The supplied photography is small and
 * an OG card is rendered at thumbnail size in most feeds, where a crop of a
 * haircut reads as noise and a wordmark reads as a brand.
 */
export const alt = `${site.name} — ${site.tagline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpengraphImage() {
  return new ImageResponse(
    OgCard({
      eyebrow: site.name,
      title: "More than a cut. Welcome to the Club.",
      facts: [
        `${branches.length} branches`,
        "Cape Winelands",
        `Since ${site.established}`,
      ],
    }),
    size
  );
}
