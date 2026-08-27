import { ImageResponse } from "next/og";
import { branches, getBranch } from "@/content/branches";
import { site } from "@/content/site";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

/**
 * The link preview card for one branch.
 *
 * Branch links are the ones that actually get shared — "here, this one, it's the
 * one by the Spar" — and until now all eleven fell back to the site-wide card,
 * so a Franschhoek link and a Malmesbury link previewed identically. Naming the
 * branch, its street and its own phone number in the preview is the difference
 * between a link somebody taps and a link somebody scrolls past.
 *
 * Prerendered for all eleven at build time, so it costs nothing at request time.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return branches.map((b) => ({ slug: b.slug }));
}

export default async function BranchOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const branch = getBranch(slug);

  // A slug with no branch cannot reach here through the route — the page 404s
  // first — but the card must not throw if it ever does.
  if (!branch) {
    return new ImageResponse(
      OgCard({
        eyebrow: site.name,
        title: "Barber shops across the Cape Winelands",
        facts: [`${branches.length} branches`, site.phone.display],
      }),
      size
    );
  }

  return new ImageResponse(
    OgCard({
      eyebrow: `${site.name} ${branch.town}`,
      title: branch.name.split("—")[1]?.trim() ?? branch.name,
      lede: branch.shortAddress,
      facts: [branch.phone.display, "Cuts, fades, beards & hot-towel shaves"],
    }),
    size
  );
}
