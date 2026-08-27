import { ImageResponse } from "next/og";

/**
 * The favicon, which the build did not have — `/favicon.ico` was a 404, so every
 * tab and every bookmark showed the browser's blank-document glyph. On a site
 * whose entire job is to be found again ("that barber place"), the tab icon is
 * not decoration.
 *
 * Generated rather than shipped as a file, for the same reason as the OG card:
 * it is drawn from the brand tokens, so it cannot drift, and there is no binary
 * asset for someone to forget to replace.
 *
 * BC in brass on ink. A scissor glyph is the obvious idea and the wrong one — at
 * 32px it collapses into a smudge, and every barber in the country has one.
 */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          color: "#c8a35a",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: -1,
          fontFamily: "sans-serif",
        }}
      >
        BC
      </div>
    ),
    size
  );
}
