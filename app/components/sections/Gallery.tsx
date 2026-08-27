import { ArrowRight, Instagram } from "lucide-react";
import { site } from "@/content/site";
import { homeGallery } from "@/content/gallery";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { ButtonLink } from "@/components/ui/Button";

/**
 * SECTION 05 — THE WORK.
 *
 * Proof of skill is the number one thing visitors look for, and this is where it
 * lives. Shoot across multiple branches — an eleven-branch group photographed
 * entirely in one shop looks like one shop.
 */
export function Gallery() {
  return (
    <Section id="gallery" tone="raised">
      <Container>
        <SectionHeading
          // "Scroll it" was an instruction that stopped being true. It was
          // written for a long masonry wall; the section is a four-up grid that
          // fits in one viewport, so the copy was directing people to do
          // something the page no longer asks of them. A flat declarative is
          // also more confident, which is the register the rest of the site is
          // written in.
          title="The work speaks."
          intro="Real cuts on real clients, done in Barber Club chairs across the Winelands. No stock photography, and no filters doing the heavy lifting."
        />

        <div className="mt-14">
          <GalleryGrid items={homeGallery} />
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/gallery" variant="outline" size="lg">
            View full gallery
            <ArrowRight aria-hidden className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href={site.social.instagram} external variant="ghost" size="lg">
            <Instagram aria-hidden className="h-4 w-4" />
            Follow {site.instagramHandle}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
