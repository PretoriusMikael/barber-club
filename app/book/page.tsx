import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { branches } from "@/content/branches";
import { Container } from "@/components/ui/Section";
import { BookingEmbed } from "@/components/sections/BookingEmbed";

export const metadata: Metadata = {
  title: "Book a Chair",
  description:
    "Book your barber at Barber Club. Classic branches are walk-in; Premier is by appointment.",
  alternates: { canonical: "/book" },
  // No SEO value in a booking widget, and it should not compete with /services.
  robots: { index: false, follow: true },
};

/**
 * /book — single-purpose page.
 *
 * The header renders in minimal mode and the sticky mobile CTA bar hides itself
 * on this route, because here the whole page is the CTA.
 */
export default function BookPage() {
  return (
    <section className="pb-24 pt-28 md:pt-36">
      <Container className="max-w-3xl">
        <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.9]">Book a chair.</h1>
        <p className="mt-5 max-w-xl text-base text-bone-dim">
          Classic branches are walk-in — turn up whenever suits you. Premier is by
          appointment.
        </p>

        <div className="mt-10">
          <BookingEmbed />
        </div>

        <div className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-xl tracking-wide">Prefer a specific branch?</h2>
          <p className="mt-2 text-sm text-bone-dim">
            All {branches.length} branches have their own page with hours, directions and a
            direct number.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/branches"
              className="inline-flex h-11 items-center justify-center rounded border border-bone/25 px-6 text-sm uppercase tracking-wide hover:border-bone/60"
            >
              Browse branches
            </Link>
            <a
              href={`mailto:${site.email.general}`}
              className="inline-flex h-11 items-center justify-center rounded border border-bone/25 px-6 text-sm uppercase tracking-wide hover:border-bone/60"
            >
              {site.email.general}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
