import type { Metadata } from "next";
import { site, booking } from "@/content/site";
import { groupPackages } from "@/content/packages";
import { Container } from "@/components/ui/Section";
import { bookingReady } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Booking Terms",
  description: `Booking, cancellation and no-show policy for ${site.name}.`,
  alternates: { canonical: "/legal/terms" },
};

/**
 * Booking terms — DRAFT SCAFFOLD, NOT LEGAL ADVICE.
 *
 * Critical: the cancellation window stated here MUST match
 * `booking.cancellationWindowHours`, the copy in the final CTA, and the policy
 * configured in the booking vendor. A mismatch turns a conversion aid into a
 * customer complaint.
 */
export default function TermsPage() {
  const minGroup = Math.min(...groupPackages.map((p) => p.minimumPeople));

  return (
    <section className="pb-24 pt-32 md:pt-40">
      <Container className="max-w-2xl">
        <p className="mb-4 border border-brass-dim/40 bg-brass-dim/10 p-4 text-xs leading-relaxed text-brass-hi">
          <strong>Draft — requires review.</strong> The current barberclub.co.za publishes no
          booking or cancellation policy at all. Confirm every clause below with the
          client, then configure the booking vendor to match.
        </p>

        <h1 className="text-4xl leading-tight md:text-5xl">Booking Terms</h1>
        <p className="mt-4 text-sm text-bone-faint">Last updated: [DATE]</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-bone-dim [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-wide [&_h2]:text-bone">
          <section>
            <h2>Classic and Premier</h2>
            <p className="mt-2">
              Classic branches are walk-in and need no appointment. Premier branches are by
              appointment only. [CONFIRM: which branches are which — this is not currently
              published anywhere.]
            </p>
          </section>

          <section>
            <h2>Booking</h2>
            <p className="mt-2">
              {bookingReady
                ? "Bookings are made through our booking provider. You will get a confirmation by [SMS / WhatsApp / email] immediately, and a reminder [X] hours before."
                : "Online booking is not live yet. Premier appointments are currently taken by phone on the branch's own number."}
            </p>
          </section>

          <section>
            <h2>Cancellation</h2>
            <p className="mt-2">
              [CONFIRM: proposed — free cancellation up to{" "}
              {booking.cancellationWindowHours} hours before your appointment. Inside that
              window, please phone the branch so we can offer the chair to someone else.]
            </p>
          </section>

          <section>
            <h2>Late arrival</h2>
            <p className="mt-2">
              [CONFIRM: e.g. more than 10 minutes late and we may need to shorten the
              service or rebook you, because the chair after yours is already booked.]
            </p>
          </section>

          <section>
            <h2>No-shows</h2>
            <p className="mt-2">
              [CONFIRM.{" "}
              {booking.depositRequired
                ? "A deposit is taken at booking and is forfeited on a no-show."
                : "No deposit is currently taken. If no-shows become a problem, enabling deposits in the booking vendor is the standard remedy."}
              ]
            </p>
          </section>

          <section>
            <h2>Group bookings</h2>
            <p className="mt-2">
              Group packages start at a minimum of {minGroup} people and are arranged by
              email at {site.email.groupBookings}. [CONFIRM: deposit, cancellation window
              and which branches can host groups — exclusive venue use implies not all of
              them can.]
            </p>
          </section>

          <section>
            <h2>Payment</h2>
            <p className="mt-2">
              Prices shown online are the published prices for each tier. [CONFIRM:
              accepted payment methods — these are not published on the current site.]
            </p>
          </section>

          <section>
            <h2>Not happy with your cut?</h2>
            <p className="mt-2">
              [CONFIRM: e.g. come back within 7 days and we will put it right at no charge.
              A stated fix-it policy is a genuine conversion aid, so it is worth having one.]
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
