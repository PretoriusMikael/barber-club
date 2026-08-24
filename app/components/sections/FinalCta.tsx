import Image from "next/image";
import { site, booking } from "@/content/site";
import { branches } from "@/content/branches";
import { Container } from "@/components/ui/Section";
import { BlurryGradient } from "@/components/backgrounds/Haikei";
import { shaveBand } from "@/content/photography";
import { BookButton, ButtonLink } from "@/components/ui/Button";
import { bookingReady } from "@/lib/booking";

/**
 * SECTION 09 — FINAL CTA.
 *
 * Two paths on purpose, because Barber Club genuinely has two: Classic is
 * walk-in (so the useful action is "find your branch") and Premier is
 * appointment-only (so the useful action is "book"). Forcing everyone down one
 * funnel would misrepresent the business.
 *
 * The reassurance line under the buttons changes depending on whether a booking
 * vendor is live — it never promises online booking that does not exist yet.
 */
export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden border-y border-line bg-ink-sunken py-24 md:py-32">
      {/* A real photograph, replacing the Haikei blurry-gradient SVG that stood
          in while there was none. The blob was a decent answer to "this block
          needs visual weight and we have no assets"; it is not a better answer
          than a picture of the thing being sold. The gradient component stays in
          the library for surfaces that still have no photography.

          Scrim is heavier here than on PhotoBand because the copy is CENTRED and
          therefore crosses the subject rather than sitting beside it — this
          frame has to work as a texture, not as a photograph you read. */}
      <Image
        src={shaveBand.src}
        alt=""
        aria-hidden
        fill
        unoptimized
        sizes="100vw"
        style={{ objectPosition: shaveBand.focus }}
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-ink/78" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_0%,var(--color-ink)_78%)]"
      />
      {/* Kept over the photograph at low strength: it is where the brass warmth
          in this block comes from, and the picture alone is cool. */}
      <BlurryGradient className="opacity-60" />
      <Container className="relative text-center">
        <h2 className="mx-auto max-w-3xl text-[clamp(2.5rem,8vw,5rem)] leading-[0.9]">
          The chair&rsquo;s ready
          <br />
          <span className="text-brass">when you are.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-md text-base text-bone-dim">
          {branches.length} branches across the Winelands. Walk into Classic, or book
          Premier.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <BookButton location="final" size="lg">
            Book your chair
          </BookButton>
          <ButtonLink href="/branches" variant="outline" size="lg">
            Find your branch
          </ButtonLink>
        </div>

        <p className="mt-6 text-xs text-bone-faint">
          {bookingReady
            ? `Free cancellation up to ${booking.cancellationWindowHours} hours before.`
            : `Online booking is not live yet — call ${site.phone.display} to book Premier.`}
        </p>
      </Container>
    </section>
  );
}
