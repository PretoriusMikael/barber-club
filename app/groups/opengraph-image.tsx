import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { groupPackages } from "@/content/packages";
import { formatZar } from "@/lib/utils";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

/**
 * The groomsmen card.
 *
 * This is the link a best man pastes into a WhatsApp group, which makes it the
 * highest-value preview on the site — R450 to R650 a head against R160 for a
 * walk-in. The entry price comes from content/packages.ts.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function GroupsOgImage() {
  const priced = groupPackages
    .map((p) => p.pricePerPerson)
    .filter((p): p is number => p !== null);
  const from = priced.length > 0 ? Math.min(...priced) : null;
  const smallest = Math.min(...groupPackages.map((p) => p.minimumPeople));

  return new ImageResponse(
    OgCard({
      eyebrow: `${site.name} — Groups`,
      title: "Bring the whole wedding party.",
      lede: "Cuts, hot-towel shaves, a drink in hand and the place to yourselves.",
      facts: [
        from !== null ? `From ${formatZar(from)} per person` : "Priced on request",
        `Minimum ${smallest}`,
        "Exclusive use available",
      ],
    }),
    size
  );
}
