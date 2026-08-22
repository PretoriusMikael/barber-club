import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import { branches, getBranch } from "@/content/branches";
import { site } from "@/content/site";
import { Section, Container, Eyebrow } from "@/components/ui/Section";
import { AssetFrame } from "@/components/ui/AssetFrame";
import { BranchHours, BranchActions } from "@/components/sections/BranchDetail";
import { BranchCard } from "@/components/sections/BranchCard";
import { BookButton } from "@/components/ui/Button";
import { mapEmbedFor } from "@/lib/booking";
import { JsonLd, branchSchema, breadcrumbSchema } from "@/lib/schema";

export function generateStaticParams() {
  return branches.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const branch = getBranch(slug);
  if (!branch) return {};

  return {
    // Local-SEO title pattern: service + place + brand.
    title: `Barber Shop in ${branch.town} | ${branch.name.split("—")[1]?.trim() ?? branch.name}`,
    description: `Barber Club ${branch.name}. ${branch.address}. Cuts, blade fades, beard trims and hot-towel shaves. Call ${branch.phone.display}.`,
    alternates: { canonical: `/branches/${branch.slug}` },
    openGraph: {
      title: `Barber Club — ${branch.name}`,
      description: branch.address,
      url: `${site.url}/branches/${branch.slug}`,
    },
  };
}

/**
 * One branch, in full. Eleven of these are prerendered at build time.
 *
 * These pages carry the local-SEO weight: each has its own address, phone,
 * opening hours, canonical URL and HairSalon JSON-LD linked to the parent
 * Organization. The current site has branch pages but no structured data on
 * them at all.
 */
export default async function BranchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const branch = getBranch(slug);
  if (!branch) notFound();

  const nearby = branches.filter((b) => b.town === branch.town && b.slug !== branch.slug);
  const others = branches.filter((b) => b.town !== branch.town).slice(0, 3);
  const alsoSee = nearby.length > 0 ? nearby : others;

  return (
    <>
      <JsonLd data={branchSchema(branch)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Branches", path: "/branches" },
          { name: branch.name, path: `/branches/${branch.slug}` },
        ])}
      />

      <Section className="pt-32 md:pt-40">
        <Container>
          <Link
            href="/branches"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-bone-dim hover:text-bone"
          >
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
            All branches
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <div>
              <Eyebrow>{branch.town}</Eyebrow>
              <h1 className="max-w-3xl text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.92]">
                {branch.name.split("—")[1]?.trim() ?? branch.name}
              </h1>
            </div>
            {branch.tier === "unconfirmed" ? (
              <span
                className="border border-dashed border-bone/25 px-3 py-1.5 text-[10px] uppercase tracking-wider text-bone-faint"
                title="Classic vs Premier is not published on the current site"
              >
                Tier to confirm
              </span>
            ) : (
              <span className="border border-brass/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-brass">
                {branch.tier}
              </span>
            )}
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="h-[320px] overflow-hidden border border-line bg-ink-sunken md:h-[440px]">
              <iframe
                title={`Map showing Barber Club ${branch.name}`}
                src={mapEmbedFor(branch)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0 grayscale-[0.6] contrast-[1.1] invert-[0.92] hue-rotate-180"
                allowFullScreen
              />
            </div>

            <div>
              <address className="flex items-start gap-3 not-italic">
                <MapPin aria-hidden className="mt-1 h-5 w-5 shrink-0 text-brass" />
                <span className="text-lg leading-snug">{branch.address}</span>
              </address>

              <div className="mt-5 space-y-2 text-sm">
                <a
                  href={`tel:${branch.phone.e164}`}
                  className="flex items-center gap-3 text-bone-dim hover:text-bone"
                >
                  <Phone aria-hidden className="h-4 w-4 shrink-0 text-brass-dim" />
                  {branch.phone.display}
                </a>
                <a
                  href={`mailto:${branch.email}`}
                  className="flex items-center gap-3 text-bone-dim hover:text-bone"
                >
                  <Mail aria-hidden className="h-4 w-4 shrink-0 text-brass-dim" />
                  {branch.email}
                </a>
              </div>

              <BranchActions branch={branch} />

              <BranchHours branch={branch} />

              <div className="mt-8">
                <BookButton location="branch_page" branch={branch} size="lg">
                  Book at {branch.town}
                </BookButton>
              </div>

              {!branch.geo ? (
                <p className="mt-5 text-xs leading-relaxed text-bone-faint">
                  CONFIRM: no coordinates are published for this branch. The map falls back
                  to an address search, and <code>geo</code> is omitted from the schema
                  rather than sent as 0,0 — which is a real location in the Atlantic.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-14">
            <AssetFrame asset={branch.image} ratio="16/9" sizes="100vw" />
          </div>
        </Container>
      </Section>

      <Section tone="raised">
        <Container>
          <h2 className="font-display text-3xl tracking-wide">
            {nearby.length > 0 ? `Also in ${branch.town}` : "Other branches"}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {alsoSee.map((b) => (
              <BranchCard key={b.slug} branch={b} />
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/branches"
              className="inline-flex h-11 items-center border border-bone/25 px-6 text-sm uppercase tracking-wide hover:border-bone/60"
            >
              See all {branches.length} branches
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
