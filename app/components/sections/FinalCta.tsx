import { site, booking } from "@/content/site";
import { branches } from "@/content/branches";
import { Container } from "@/components/ui/Section";
import { BlurryGradient } from "@/components/backgrounds/Haikei";
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
    <section className="relative overflow-hidden border-y border-line bg-ink-sunken py-24 md:py-32">
      {/* Haikei-family blurry gradient. Replaces a flat CSS radial — three
          overlapping blurred ellipses read as depth rather than a vignette, and
          it is still a single inline SVG with no network request. */}
      <BlurryGradient />
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
