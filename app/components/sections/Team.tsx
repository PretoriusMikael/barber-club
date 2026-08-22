import { Instagram } from "lucide-react";
import { barbers, rosterSupplied, type Barber } from "@/content/barbers";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { AssetFrame } from "@/components/ui/AssetFrame";
import { BookButton } from "@/components/ui/Button";
import { getBranch } from "@/content/branches";

/**
 * SECTION 06 — THE BARBERS.
 *
 * "Book with [name]" is the highest-converting CTA on a barber site for
 * returning customers, and it is completely absent from the current
 * barberclub.co.za — which names not one barber across all 17 pages, despite
 * selling "a legendary team of experienced barbers".
 *
 * Until a real roster is supplied this renders an honest gap panel rather than
 * invented people. See content/barbers.ts.
 */
export function Team({ full = false }: { full?: boolean }) {
  if (!rosterSupplied) {
    return (
      <Section id="team">
        <Container>
          <RosterPending />
        </Container>
      </Section>
    );
  }

  return (
    <Section id="team">
      <Container>
        <SectionHeading
          eyebrow="The chairs"
          title="Book a barber, not a slot."
          intro="Everyone here can cut. Most customers still end up with a favourite — book them by name and skip the explanation."
        />

        <Reveal
          staggerChildren
          stagger={70}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {barbers.map((barber) => (
            <RevealItem key={barber.slug}>
              <BarberCard barber={barber} full={full} />
            </RevealItem>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

function BarberCard({ barber, full }: { barber: Barber; full: boolean }) {
  const branch = getBranch(barber.branchSlug);
  const hasIg = Boolean(barber.instagram);

  return (
    <article className="group flex h-full flex-col">
      <AssetFrame
        asset={barber.portrait}
        ratio="3/4"
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      />

      <div className="flex flex-1 flex-col pt-5">
        <h3 className="font-display text-2xl tracking-wide">{barber.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-brass-dim">
          {barber.speciality}
        </p>
        {branch ? <p className="mt-1 text-xs text-bone-faint">{branch.name}</p> : null}

        <blockquote className="mt-4 flex-1 border-l border-line pl-4 text-sm italic leading-relaxed text-bone-dim">
          &ldquo;{barber.quote}&rdquo;
        </blockquote>

        <div className="mt-4 flex items-center gap-3">
          <BookButton
            location="barber_card"
            staffId={barber.bookingId}
            branch={branch}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            Book {barber.name.split(" ")[0]}
          </BookButton>
          {full && hasIg ? (
            <a
              href={barber.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${barber.name} on Instagram`}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-bone-dim hover:text-bone"
            >
              <Instagram aria-hidden className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function RosterPending() {
  return (
    <div className="border border-dashed border-bone/20 bg-ink-raised p-8 md:p-12">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-brass-dim">
        Missed opportunity
      </p>
      <h2 className="max-w-2xl text-3xl leading-tight md:text-4xl">
        Your barbers are the brand, and right now not one of them is named.
      </h2>
      <div className="mt-6 max-w-2xl space-y-3 text-sm leading-relaxed text-bone-dim">
        <p>
          The current site sells &ldquo;a legendary team of experienced barbers&rdquo; across all
          eleven branches, but does not name a single one. No placeholder people are
          rendered here — inventing names and quotes for real staff would be both false
          and unfair to them.
        </p>
        <p>
          This is worth fixing before launch. &ldquo;Book with [name]&rdquo; is the strongest CTA a
          barber site has for returning customers, and a chain this size almost
          certainly has barbers with personal followings walking in the door.
        </p>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>Name, home branch, speciality and years behind the chair, per barber.</li>
          <li>One sentence in their own words — collect it, do not write it for them.</li>
          <li>A 3:4 portrait at their own station, consistent lighting across branches.</li>
          <li>
            A vendor staff id per barber, so the booking deep link pre-selects them.
          </li>
        </ol>
      </div>
    </div>
  );
}
