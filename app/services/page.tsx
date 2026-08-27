import type { Metadata } from "next";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { ServicesMenu } from "@/components/sections/ServicesMenu";
import { Faq } from "@/components/sections/Faq";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { JsonLd, faqSchema, breadcrumbSchema, serviceCatalogSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Services & Pricing | Classic and Premier",
  description:
    "Full Barber Club menu and pricing. Classic walk-in from R70, Premier by appointment. Club Cuts, blade fades, beard trims, hot-towel shaves and schoolboy cuts across the Cape Winelands.",
  alternates: { canonical: "/services" },
};

/**
 * /services — the deep-link target and the long-tail SEO page.
 *
 * Both tier catalogues are emitted as JSON-LD so Google can index the real
 * prices, and the FAQ block is rendered as visible copy AND FAQPage schema so
 * questions people actually type ("difference between classic and premier",
 * "how much is a haircut in Paarl") can win results on their own.
 */
export default function ServicesPage() {
  return (
    <>
      <JsonLd data={serviceCatalogSchema("classic")} />
      <JsonLd data={serviceCatalogSchema("premier")} />
      <JsonLd data={faqSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />

      <Section className="pt-32 md:pt-40">
        <Container>
          <SectionHeading
            as="h1"
            title="Every service, every price. No surprises at the counter."
            intro="Classic is walk-in and sharply priced. Premier is by appointment, with the time and the finish to match. Switch between them below."
          />

          <div className="mt-12">
            <ServicesMenu />
          </div>

          <div className="mt-14 flex flex-col gap-3 sm:flex-row">
            <BookButton location="services" size="lg">
              Book your chair
            </BookButton>
            <ButtonLink href="/branches" variant="outline" size="lg">
              Find your branch
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Faq />
    </>
  );
}
