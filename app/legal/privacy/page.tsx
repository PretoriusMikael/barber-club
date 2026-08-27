import type { Metadata } from "next";
import { site } from "@/content/site";
import { branches } from "@/content/branches";
import { Container } from "@/components/ui/Section";
import { INFORMATION_OFFICER, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Notice (POPIA)",
  description: `How ${site.name} collects, uses and stores your personal information.`,
  alternates: { canonical: "/legal/privacy" },
};

/**
 * POPIA privacy notice — PROPOSED, NOT LEGAL ADVICE.
 *
 * The structure covers the disclosures POPIA expects and the copy is written as
 * a finished document, but several specifics are standard defaults rather than
 * confirmed facts: the registered entity name, the Information Officer, the
 * retention periods, and the identity of the operators (booking vendor, payment
 * gateway, messaging provider) who will process this data. Those live in
 * content/legal.ts and PITCH-NOTES.md §5, not in brackets on the page.
 *
 * Have it reviewed by someone qualified before launch, and make sure it matches
 * what the booking vendor actually does with the data — they are the operator
 * processing it on Barber Club's behalf.
 */
export default function PrivacyPage() {
  return (
    <section className="pb-24 pt-32 md:pt-40">
      <Container className="max-w-2xl">
        <h1 className="text-4xl leading-tight md:text-5xl">Privacy Notice</h1>
        <p className="mt-4 text-sm text-bone-faint">
          Last updated: {LEGAL_LAST_UPDATED} · Responsible party: {LEGAL_ENTITY}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-bone-dim [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-wide [&_h2]:text-bone">
          <section>
            <h2>Who we are</h2>
            <p className="mt-2">
              {LEGAL_ENTITY}, trading as {site.name}, operating {branches.length} branches
              across the Cape Winelands. Questions about your information go to{" "}
              {INFORMATION_OFFICER ? `${INFORMATION_OFFICER}, our Information Officer, at ` : ""}
              {site.email.general}, or {site.phone.display}.
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
                Payment information. Card details are handled by our payment gateway and
                are never stored by us.
              </li>
              <li>
                Website analytics: pages viewed, approximate location, device type. Only
                after you accept analytics cookies.
              </li>
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
              Our booking provider, our payment gateway, and our messaging provider for SMS
              or WhatsApp reminders. Each of them processes your information on our behalf
              as an operator under POPIA, and only for the purpose we engaged them for. We
              do not sell your information to anyone.
            </p>
          </section>

          <section>
            <h2>How long we keep it</h2>
            <p className="mt-2">
              Booking and payment records for five years, in line with our accounting
              obligations. Marketing consent until you withdraw it. Analytics data for
              fourteen months.
            </p>
          </section>

          <section>
            <h2>Your rights</h2>
            <p className="mt-2">
              You can ask us what we hold about you, ask us to correct or delete it, object
              to direct marketing, and withdraw consent at any time. Email{" "}
              {site.email.general} and we will respond within 30 days. If you are not
              satisfied you may complain to the Information Regulator of South Africa.
            </p>
          </section>

          <section>
            <h2>Cookies</h2>
            <p className="mt-2">
              Essential cookies keep the site working. Analytics cookies (Google Analytics
              4) only load after you accept them in the consent banner, and you can change
              your mind at any time.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
