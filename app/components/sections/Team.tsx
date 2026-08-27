import Image from "next/image";
import { Instagram } from "lucide-react";
import { barbers, rosterSupplied, type Barber } from "@/content/barbers";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { AssetFrame } from "@/components/ui/AssetFrame";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { BookButton } from "@/components/ui/Button";
import { getBranch } from "@/content/branches";
import { teamPhoto } from "@/content/photography";

/**
 * SECTION 06 — THE BARBERS.
 *
 * "Book with [name]" is the highest-converting CTA on a barber site for
 * returning customers, and it is completely absent from the current
 * barberclub.co.za — which names not one barber across all 17 pages, despite
 * selling "a legendary team of experienced barbers".
 *
 * Until a real roster is supplied (content/barbers.ts is deliberately empty —
 * inventing names and quotes for real staff would be both false and unfair to
 * them) this renders the supplied team photograph and the brand's own claim
 * about its people. No invented cards, and no production note either: the ask
 * for the roster belongs in PITCH-NOTES.md, not printed on the customer's
 * screen.
 *
 * The moment `rosterSupplied` flips true, the bookable card grid takes over and
 * this section becomes the strongest returning-customer CTA on the site.
 */
export function Team({ full = false }: { full?: boolean }) {
  if (!rosterSupplied) {
    return (
      <Section id="team">
        <Container>
          <TeamPhoto />
        </Container>
      </Section>
    );
  }

  return (
    <Section id="team">
      <Container>
        <SectionHeading
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-bone-dim hover:text-bone"
            >
              <Instagram aria-hidden className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * The supplied team photograph, carrying the section on its own.
 *
 * A picture of four barbers is a real answer to "who will be cutting my hair",
 * and it was the single biggest thing this page was missing. It is not an
 * answer to "which one, and can I book them" — that is what the roster is for,
 * and it is the top item on the content list in PITCH-NOTES.md.
 *
 * 950x689 is the largest supplied file and still modest, so it is shown at a
 * contained width rather than full-bleed. Pushed edge to edge on a wide monitor
 * it would be upscaled past two times and look it.
 *
 * The copy is the brand's own — "a legendary team of experienced barbers" is
 * published on the current site and is the claim this photograph evidences.
 */
function TeamPhoto() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <Reveal variant="frame" className="relative overflow-hidden rounded-lg border border-line">
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={teamPhoto.src}
            alt={teamPhoto.alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 640px, 100vw"
            style={{ objectPosition: teamPhoto.focus }}
            className="object-cover"
          />
        </div>
      </Reveal>

      <div>
        <SectionHeading
          title="A legendary team of experienced barbers."
          intro="Eleven branches, one standard. Whichever chair you end up in, it is the same training, the same finish and the same amount of time taken over it."
        />
        <Reveal delay={220} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <BookButton location="barber_card" size="lg">
            Book your chair
          </BookButton>
        </Reveal>
      </div>
    </div>
  );
}
