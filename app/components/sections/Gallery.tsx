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
          title="The work speaks. Scroll it."
          intro="Real cuts on real clients, done in Barber Club chairs across the Winelands. No stock photography, and no filters doing the heavy lifting."
        />

        <div className="mt-14">
          {/* Equal cells: the supplied photographs all share one 6/7 ratio, so
              there is nothing for masonry to balance. */}
          <GalleryGrid items={homeGallery} layout="grid" />
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
