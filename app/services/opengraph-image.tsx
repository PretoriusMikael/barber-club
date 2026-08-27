import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { lowestPrice, services } from "@/content/services";
import { formatZar } from "@/lib/utils";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

/**
 * The menu's own preview card.
 *
 * "What does a cut cost there?" is the question this link gets shared to answer,
 * so the card answers it before anyone taps: the entry price and the number of
 * services, both read from content/services.ts so they cannot go stale.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function ServicesOgImage() {
  return new ImageResponse(
    OgCard({
      eyebrow: `${site.name} — Services`,
      title: "Every service, every price.",
      lede: "Classic is walk-in. Premier is by appointment. Both menus, side by side.",
      facts: [`From ${formatZar(lowestPrice)}`, `${services.length} services`, "No surprises"],
    }),
    size
  );
}
