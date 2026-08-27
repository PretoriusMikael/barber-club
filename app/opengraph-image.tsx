import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { branches } from "@/content/branches";

/**
 * The link preview card.
 *
 * This mattered more than the usual OG image and was the one asset the build was
 * missing outright: a barber gets shared in WhatsApp groups constantly, and a
 * WhatsApp share with no image is a grey rectangle with a URL in it. The
 * previous plan was a static /public/og.jpg that nobody had made.
 *
 * Generated instead, at build time, from the same tokens as the site — so it can
 * never drift from the brand, needs no designer round-trip, and costs nothing to
 * keep in step when the branch count changes. Route-level files may override it
 * later (a per-branch card is the obvious next one).
 *
 * Deliberately typographic: no photograph. The supplied photography is small and
 * an OG card is rendered at thumbnail size in most feeds, where a crop of a
 * haircut reads as noise and a wordmark reads as a brand.
 */
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          padding: 72,
          // The brass hairline from the loading screen, as the card's one
          // graphic device.
          borderTop: "10px solid #c8a35a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 10,
              textTransform: "uppercase",
              color: "#c8a35a",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              marginTop: 40,
              fontSize: 78,
              lineHeight: 1.06,
              fontWeight: 800,
              // Uppercase and tightened. ImageResponse renders with the fonts it
              // is handed, and handing it Bebas would mean a network fetch inside
              // the build — so the card echoes the display face's condensed,
              // all-caps shape with weight and tracking instead of pretending to
              // be it. Sentence case in a generic sans looked like a different
              // company's card.
              letterSpacing: -2,
              textTransform: "uppercase",
              color: "#f4f1ea",
              maxWidth: 940,
            }}
          >
            More than a cut. Welcome to the Club.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 28,
            color: "#b9b4ab",
          }}
        >
          <span>{branches.length} branches</span>
          <span style={{ color: "#6d5830" }}>/</span>
          <span>Cape Winelands</span>
          <span style={{ color: "#6d5830" }}>/</span>
          <span>Since {site.established}</span>
        </div>
      </div>
    ),
    size
  );
}
