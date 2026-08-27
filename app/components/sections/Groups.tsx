import { Check, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupPackages, groupBookingContact, type GroupPackage } from "@/content/packages";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { formatZar } from "@/lib/utils";
import { GlowEffect } from "@/components/motion-primitives/glow-effect";
import { BlobScene } from "@/components/backgrounds/Haikei";

/**
 * Groomsmen, group bookings and special events.
 *
 * This is the highest-value product Barber Club sells — R450 to R650 a head
 * against R160 for a walk-in Gent's Cut — and on the current site it is buried
 * on a page reachable only from a sub-menu, with an email address as the entire
 * conversion mechanism.
 *
 * Giving it a home-page block and its own route is one of the clearer commercial
 * wins available in the rebuild.
 */
export function Groups({ compact = false }: { compact?: boolean }) {
  return (
    <Section id="groups" tone={compact ? "base" : "raised"} className="relative overflow-hidden">
      {/* Haikei-family blob, giving the highest-value product on the site some
          visual weight without another image request. */}
      <BlobScene className="opacity-70" />
      <Container className="relative">
        <SectionHeading
          as={compact ? "h2" : "h1"}
          title="Bring the whole wedding party."
          intro="Cuts, hot-towel shaves, head and neck massages, a drink in hand and the place to yourselves. Booked as one."
        />

        <Reveal
          staggerChildren
          stagger={80}
          className="mt-14 grid gap-5 md:grid-cols-3"
        >
          {groupPackages.map((pkg) => (
            <RevealItem key={pkg.slug}>
              <PackageCard pkg={pkg} />
            </RevealItem>
          ))}
        </Reveal>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink
            href={`mailto:${groupBookingContact.email}?subject=${encodeURIComponent("Group booking enquiry")}`}
            variant="primary"
            size="lg"
          >
            <Mail aria-hidden className="h-4 w-4" />
            Enquire about a group
          </ButtonLink>
          <p className="text-sm text-bone-dim">
            or call{" "}
            <a
              href={`tel:${groupBookingContact.phone.e164}`}
              className="text-bone hover:text-brass"
            >
              {groupBookingContact.phone.display}
            </a>
          </p>
        </div>

        {/* Which branches can host a group is not published anywhere on the
            current site, and exclusive venue use implies not all eleven can.
            That is an open question for the client, not a caveat to print under
            the packages — it lives in PITCH-NOTES.md, alongside the case for
            replacing this mailto with a real enquiry form. */}
      </Container>
    </Section>
  );
}

function PackageCard({ pkg }: { pkg: GroupPackage }) {
  return (
    <article className="relative flex h-full flex-col">
      {/* The most-booked package gets a slow brass glow behind the card.
          Reserved for exactly one card — a glow on all three would signal
          nothing. */}
      {pkg.highlight ? (
        <GlowEffect
          colors={["#c8a35a", "#8e733e", "#b4302b", "#c8a35a"]}
          mode="breathe"
          blur="soft"
          scale={0.96}
          duration={7}
        />
      ) : null}
      <div
        className={cn(
          "relative flex h-full flex-col rounded border bg-ink-raised p-6 transition-colors",
          pkg.highlight ? "border-brass/50" : "border-line hover:border-bone/25"
        )}
      >
      {pkg.highlight ? (
        <p className="mb-3 self-start rounded-sm bg-brass px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink">
          Most booked
        </p>
      ) : null}

      <h3 className="font-display text-3xl tracking-wide">{pkg.name}</h3>

      <p className="mt-2 text-brass">
        {pkg.pricePerPerson !== null ? (
          <>
            <span className="text-2xl">{formatZar(pkg.pricePerPerson)}</span>
            <span className="text-sm text-bone-dim"> per person</span>
          </>
        ) : (
          <span className="text-xl">{pkg.priceNote}</span>
        )}
      </p>

      <p className="mt-2 flex items-center gap-2 text-xs text-bone-faint">
        <Users aria-hidden className="h-3.5 w-3.5" />
        Minimum {pkg.minimumPeople} people
      </p>

      <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-5 text-sm text-bone-dim">
        {pkg.includes.map((item) => (
          <li key={item} className="flex gap-2.5">
            <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brass-dim" />
            <span className="leading-snug">{item}</span>
          </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
