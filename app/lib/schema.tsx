import { site } from "@/content/site";
import { branches, type Branch } from "@/content/branches";
import { services, priceFor } from "@/content/services";
import { faqs } from "@/content/faq";
import { openingHoursSpecification } from "@/lib/hours";
import { mapsUrlFor } from "@/lib/booking";

/**
 * JSON-LD builders.
 *
 * An 11-branch group needs a different shape to a single shop: one
 * `Organization` for the brand, plus one `HairSalon` per branch, each with its
 * own address, phone and opening hours, all linked back to the parent. Emitting
 * a single LocalBusiness for a chain is a common and costly local-SEO mistake —
 * it gives Google one entity to rank instead of eleven.
 *
 * Hard rule: AggregateRating is emitted ONLY when site.rating.verified is true,
 * i.e. when the numbers came from the Google Places API.
 */

const sameAs = [
  site.social.facebook,
  site.social.instagram,
  site.social.tiktok,
  site.social.youtube,
  site.social.googleBusiness,
].filter(Boolean);

function postalAddress(branch: Branch) {
  return {
    "@type": "PostalAddress",
    streetAddress: branch.shortAddress,
    addressLocality: branch.town,
    addressRegion: "Western Cape",
    postalCode: branch.postalCode,
    addressCountry: "ZA",
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone.e164,
    email: site.email.general,
    foundingDate: "2017-12",
    ...(sameAs.length ? { sameAs } : {}),
    department: branches.map((b) => ({ "@id": `${site.url}/branches/${b.slug}#branch` })),
  };
}

export function branchSchema(branch: Branch) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${site.url}/branches/${branch.slug}#branch`,
    name: `${site.name} — ${branch.name}`,
    parentOrganization: { "@id": `${site.url}/#organization` },
    url: `${site.url}/branches/${branch.slug}`,
    telephone: branch.phone.e164,
    email: branch.email,
    address: postalAddress(branch),
    // `geo` is omitted rather than zeroed — 0,0 is a real place in the Atlantic,
    // and publishing it would actively mislead Google.
    ...(branch.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: branch.geo.lat, longitude: branch.geo.lng } }
      : {}),
    hasMap: mapsUrlFor(branch),
    openingHoursSpecification: openingHoursSpecification(branch),
    currenciesAccepted: "ZAR",
    priceRange: "R70–R490",
    ...(sameAs.length ? { sameAs } : {}),
    ...(site.rating.verified && site.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: site.rating.value,
            reviewCount: site.rating.count,
          },
        }
      : {}),
  };
}

/** Full menu as an OfferCatalog, with the real published prices for a tier. */
export function serviceCatalogSchema(tier: "classic" | "premier") {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `Barber Club ${tier === "classic" ? "Classic" : "Premier"} services`,
    itemListElement: services
      .filter((s) => priceFor(s, tier) !== null)
      .map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, description: s.blurb },
        price: priceFor(s, tier),
        priceCurrency: "ZAR",
      })),
  };
}

export function faqSchema() {
  // Never publish an unconfirmed answer into structured data.
  const answered = faqs.filter((f) => !f.answer.includes("CONFIRM"));
  if (answered.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}

/** Renders a JSON-LD block. Usage: <JsonLd data={organizationSchema()} /> */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
