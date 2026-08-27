import type { Metadata } from "next";
import { Instagram } from "lucide-react";
import { site } from "@/content/site";
import { gallery } from "@/content/gallery";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Gallery | Blade Fades, Club Cuts & Hot-Towel Shaves",
  description:
    "Real cuts on real clients, done in Barber Club chairs across the Cape Winelands. Blade fades, Club Cuts, beard work, hot-towel shaves and schoolboy cuts.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />

      <Section className="pt-32 md:pt-40">
        <Container>
          <SectionHeading
            as="h1"
            title="Every cut here happened in a Barber Club chair."
            intro="No stock photography, no borrowed portfolios. Filter by what you are actually after."
          />

          <div className="mt-14">
            <GalleryGrid items={gallery} filterable />
          </div>

          <div className="mt-14 flex flex-col gap-3 sm:flex-row">
            <BookButton location="gallery" size="lg">
              Book your chair
            </BookButton>
            <ButtonLink href={site.social.instagram} external variant="outline" size="lg">
              <Instagram aria-hidden className="h-4 w-4" />
              Follow {site.instagramHandle}
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
