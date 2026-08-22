import type { Metadata } from "next";
import { site, booking } from "@/content/site";
import { branches } from "@/content/branches";
import { Container } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Privacy Notice (POPIA)",
  description: `How ${site.name} collects, uses and stores your personal information.`,
  alternates: { canonical: "/legal/privacy" },
};

/**
 * POPIA privacy notice — DRAFT SCAFFOLD, NOT LEGAL ADVICE.
 *
 * The structure and the questions are right; the answers need confirming. Have
 * it reviewed by someone qualified before launch, and make sure it matches what
 * the booking vendor actually does with the data — they are the operator
 * processing it on Barber Club's behalf.
 */
export default function PrivacyPage() {
  return (
    <section className="pb-24 pt-32 md:pt-40">
      <Container className="max-w-2xl">
        <p className="mb-4 border border-brass-dim/40 bg-brass-dim/10 p-4 text-xs leading-relaxed text-brass-hi">
          <strong>Draft — requires legal review.</strong> A structural scaffold covering the
          disclosures POPIA expects. Every bracketed item must be confirmed against what
          Barber Club and its suppliers actually do before this page goes live.
        </p>

        <h1 className="text-4xl leading-tight md:text-5xl">Privacy Notice</h1>
        <p className="mt-4 text-sm text-bone-faint">
          Last updated: [DATE] · Responsible party: {site.legalName}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-bone-dim [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-wide [&_h2]:text-bone">
          <section>
            <h2>Who we are</h2>
            <p className="mt-2">
              {site.legalName}, trading as {site.name}, operating {branches.length} branches
              across the Cape Winelands. Contact: {site.email.general} /{" "}
              {site.phone.display}. [Appoint and name an Information Officer — POPIA
              requires one, and they must be registered with the Information Regulator.]
            </p>
          </section>

          <section>
            <h2>What we collect</h2>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                Booking details: name, mobile number, email, branch, service and barber
                chosen.
              </li>
              <li>Appointment history, so your barber knows what you had last time.</li>
              <li>
                Group booking enquiries sent to {site.email.groupBookings}, including event
                dates and party size.
              </li>
              <li>
                Payment information — [confirm: card details are handled by the payment
                gateway and are never stored by us].
              </li>
              <li>
                Website analytics: pages viewed, approximate location, device type. Only
                after you accept analytics cookies.
              </li>
              <li>[Anything else — loyalty programme, marketing list, in-store CCTV.]</li>
            </ul>
          </section>

          <section>
            <h2>Why we collect it</h2>
            <p className="mt-2">
              To take and confirm your booking, to send appointment reminders, to keep a
              record of the services you have had, and to meet our tax and accounting
              obligations. We only send marketing messages if you have opted in, and every
              one carries an unsubscribe link.
            </p>
          </section>

          <section>
            <h2>Who we share it with</h2>
            <p className="mt-2">
              Our booking provider [
              {booking.vendor === "unset" ? "not yet contracted" : booking.vendor}], who
              would process bookings on our behalf as an operator under POPIA; our payment
              gateway [name]; and our messaging provider for SMS or WhatsApp reminders
              [name]. [Confirm whether any of these store data outside South Africa —
              cross-border transfers need their own disclosure under section 72.] We do not
              sell your information to anyone.
            </p>
          </section>

          <section>
            <h2>How long we keep it</h2>
            <p className="mt-2">
              Booking records for [X years, to be confirmed against your accounting
              obligations]. Marketing consent until you withdraw it. Analytics data for [X
              months].
            </p>
          </section>

          <section>
            <h2>Your rights</h2>
            <p className="mt-2">
              You can ask us what we hold about you, ask us to correct or delete it, object
              to direct marketing, and withdraw consent at any time. Email{" "}
              {site.email.general} and we will respond within [X] days. If you are not
              satisfied you may complain to the Information Regulator of South Africa.
            </p>
          </section>

          <section>
            <h2>Cookies</h2>
            <p className="mt-2">
              Essential cookies keep the site working. Analytics cookies (Google Analytics
              4) only load after you accept them in the consent banner. [Wire the banner up
              before launch — GA4 must not fire until consent is given.]
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
