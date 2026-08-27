import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import { branches, getBranch } from "@/content/branches";
import { site } from "@/content/site";
import { Section, Container } from "@/components/ui/Section";
import { AssetFrame } from "@/components/ui/AssetFrame";
import { BranchHours, BranchActions, BranchMap } from "@/components/sections/BranchDetail";
import { BranchCard } from "@/components/sections/BranchCard";
import { BookButton } from "@/components/ui/Button";
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
              {/* The town line is INSIDE the h1, not a separate eyebrow above it.
                  Visually identical; the difference is that the page's one
                  heading now reads "Barber Club Paarl — 276 Main Road" instead
                  of "276 Main Road", which is the phrase this page exists to
                  rank for. Eleven pages, eleven towns, and it was free. */}
              <h1 className="max-w-3xl">
                <span className="mb-4 flex items-center gap-3 font-sans text-xs font-normal uppercase tracking-[0.28em] text-brass-dim">
                  <span aria-hidden className="h-px w-8 bg-brass-rule" />
                  Barber Club {branch.town}
                </span>
                <span className="block text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.92]">
                  {branch.name.split("—")[1]?.trim() ?? branch.name}
                </span>
              </h1>
            </div>
            {/* Nothing while the tier is unconfirmed — see BranchCard. */}
            {branch.tier !== "unconfirmed" ? (
              <span className="rounded-sm border border-brass/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-brass">
                {branch.tier}
              </span>
            ) : null}
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <BranchMap branch={branch} />

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

              {/* No coordinates are published for any branch, so the map falls
                  back to an address search and `geo` is omitted from the schema
                  rather than sent as 0,0 (a real place in the Atlantic). The
                  customer sees a working map either way; the ask for eleven
                  sets of coordinates is in PITCH-NOTES.md. */}
            </div>
          </div>

          {/* Renders only once a shopfront photograph exists for this branch —
              AssetFrame draws nothing without a `src`. Eleven frontage shots are
              on the asset list in PITCH-NOTES.md; they are what makes a branch
              page recognisable from the pavement. */}
          <div className="mt-14 empty:mt-0">
            <AssetFrame asset={branch.image} ratio="16/9" radius="lg" sizes="100vw" />
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
              className="inline-flex h-11 items-center rounded border border-bone/25 px-6 text-sm uppercase tracking-wide hover:border-bone/60"
            >
              See all {branches.length} branches
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
