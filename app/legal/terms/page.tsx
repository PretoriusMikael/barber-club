import type { Metadata } from "next";
import { site, booking } from "@/content/site";
import { groupPackages } from "@/content/packages";
import { Container } from "@/components/ui/Section";
import { bookingReady } from "@/lib/booking";
import { LEGAL_LAST_UPDATED } from "@/content/legal";

export const metadata: Metadata = {
  title: "Booking Terms",
  description: `Booking, cancellation and no-show policy for ${site.name}.`,
  alternates: { canonical: "/legal/terms" },
};

/**
 * Booking terms — PROPOSED POLICY, NOT LEGAL ADVICE.
 *
 * The current barberclub.co.za publishes no booking or cancellation policy at
 * all, so there is nothing to transcribe here: every clause below is an industry
 * -standard default written so the page reads as a finished document, and every
 * one of them needs the client's sign-off. The list of what to confirm is in
 * PITCH-NOTES.md — it is not printed on the page, because a customer reading a
 * cancellation policy should not be reading our notes to the client instead.
 *
 * Critical once it is agreed: the cancellation window stated here MUST match
 * `booking.cancellationWindowHours`, the copy in the final CTA, and the policy
 * configured in the booking vendor. A mismatch turns a conversion aid into a
 * customer complaint.
 */
export default function TermsPage() {
  const minGroup = Math.min(...groupPackages.map((p) => p.minimumPeople));

  return (
    <section className="pb-24 pt-32 md:pt-40">
      <Container className="max-w-2xl">
        <h1 className="text-4xl leading-tight md:text-5xl">Booking Terms</h1>
        <p className="mt-4 text-sm text-bone-faint">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-bone-dim [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-wide [&_h2]:text-bone">
          <section>
            <h2>Classic and Premier</h2>
            <p className="mt-2">
              Classic branches are walk-in and need no appointment — turn up whenever suits
              you. Premier branches are by appointment only. Each branch page says which it
              is, along with that branch&rsquo;s hours and its own phone number.
            </p>
          </section>

          <section>
            <h2>Booking</h2>
            <p className="mt-2">
              {bookingReady
                ? "Bookings are made through our booking provider. You will get a confirmation immediately, and a reminder before your appointment."
                : "Online booking is not live yet. Premier appointments are currently taken by phone, on the branch's own number."}
            </p>
          </section>

          <section>
            <h2>Cancellation</h2>
            <p className="mt-2">
              You can cancel or move an appointment free of charge up to{" "}
              {booking.cancellationWindowHours} hours beforehand. Inside that window, please
              phone the branch so the chair can be offered to someone else.
            </p>
          </section>

          <section>
            <h2>Late arrival</h2>
            <p className="mt-2">
              If you are more than ten minutes late we may need to shorten the service or
              move you to a later slot, because the chair after yours is already booked.
              Phone ahead if you are running late and we will do what we can.
            </p>
          </section>

          <section>
            <h2>No-shows</h2>
            <p className="mt-2">
              {booking.depositRequired
                ? "A deposit is taken at booking and is forfeited on a no-show."
                : "No deposit is taken. A missed appointment costs the barber a chair for that slot, so please cancel if your plans change — even at short notice."}
            </p>
          </section>

          <section>
            <h2>Group bookings</h2>
            <p className="mt-2">
              Group packages start at a minimum of {minGroup} people and are arranged by
              email at {site.email.groupBookings}. Dates, party size and which branch can
              host you are confirmed by return email before the day.
            </p>
          </section>

          <section>
            <h2>Payment</h2>
            <p className="mt-2">
              Prices shown online are the published prices for each tier and are the price
              at the counter. Payment is taken in the shop at the end of your appointment.
            </p>
          </section>

          <section>
            <h2>Not happy with your cut?</h2>
            <p className="mt-2">
              Tell us. Come back within seven days and we will put it right at no charge —
              speak to the branch you were cut at, or email {site.email.general}.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
