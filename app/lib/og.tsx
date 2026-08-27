import type { ReactElement } from "react";

/**
 * The shared layout for every link-preview card on the site.
 *
 * There are four of these now — the site card, eleven branch cards, the menu and
 * the group packages — and they must look like one set. Four copies of the same
 * inline-styled JSX would have drifted within a month, so the layout lives here
 * once and each route supplies only its words.
 *
 * TWO CONSTRAINTS THAT ARE NOT OBVIOUS, both from Satori (the renderer behind
 * `next/og`), and both of which fail at runtime rather than at build:
 *
 *  1. **Every element with more than one child needs an explicit `display`.**
 *     And "more than one child" counts interpolations: `{a} {b}` is three
 *     children, not one string. Anything variable is therefore composed into a
 *     single template literal before it reaches JSX.
 *
 *  2. **Only the fonts you hand it exist.** Bebas is loaded through `next/font`
 *     at the page level and is not available here, and fetching it inside the
 *     build would put a network call on the critical path of every deploy. The
 *     cards echo the display face's condensed, all-caps shape with weight,
 *     tracking and capitalisation instead of pretending to be it — which reads
 *     as the same brand, where sentence case in a default sans did not.
 *
 * Colours are the palette from globals.css, hard-coded because Satori resolves
 * no custom properties. Keep them in step by hand; there are five.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#0b0b0c";
const BONE = "#f4f1ea";
const BONE_DIM = "#b9b4ab";
const BRASS = "#c8a35a";
const BRASS_RULE = "#6d5830";

export function OgCard({
  eyebrow,
  title,
  lede,
  facts,
}: {
  /** Small tracked line above the title. Pre-composed into one string. */
  eyebrow: string;
  /** The headline. Set in caps by the card. */
  title: string;
  /** Optional supporting line under the title — an address, a subtitle. */
  lede?: string;
  /** The footer row, joined by brass slashes. */
  facts: string[];
}): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: INK,
        padding: 72,
        // The brass hairline from the loading screen, as the card's one graphic
        // device. It is the thing that makes eleven branch cards read as a set.
        borderTop: `10px solid ${BRASS}`,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 26,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: BRASS,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            marginTop: 36,
            // Long branch names (Neelsie Student Centre) take two lines at 92px
            // and still clear the footer; anything longer would not, so the size
            // steps down once the title passes a line's worth of characters.
            fontSize: title.length > 26 ? 76 : 92,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: -2,
            textTransform: "uppercase",
            color: BONE,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {lede ? (
          <div style={{ marginTop: 26, fontSize: 32, color: BONE_DIM, maxWidth: 940 }}>
            {lede}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontSize: 28,
          color: BONE_DIM,
        }}
      >
        {facts.map((fact, i) => (
          <div key={fact} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {i > 0 ? <span style={{ color: BRASS_RULE }}>/</span> : null}
            <span>{fact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
