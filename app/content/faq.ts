/**
 * FAQ, rendered as visible copy AND as FAQPage JSON-LD so these can win
 * long-tail local search on their own.
 *
 * Answers are built from what barberclub.co.za actually publishes. Anything the
 * site does not answer is marked `CONFIRM:` — and lib/schema.tsx filters those
 * out of the structured data, because publishing a wrong policy in schema is
 * worse than publishing nothing.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: "What is the difference between Classic and Premier?",
    answer:
      "Classic is walk-in: no appointment needed, great cut, sharper price. Premier is by appointment only and is the complete grooming experience — more time in the chair, and the full finish. Premier pricing runs roughly R60 to R100 above Classic on the same service.",
  },
  {
    question: "Do I need to book?",
    answer:
      "Not for Classic — walk in whenever suits you. Premier branches are appointment only, so book ahead for those.",
  },
  {
    question: "Which branches are Classic and which are Premier?",
    answer:
      "CONFIRM: this mapping is not published on the current site and must be supplied by the client before launch.",
  },
  {
    question: "Where are you?",
    answer:
      "Eleven branches across the Cape Winelands: four in Paarl (Val de Vie Estate, Paarl Central, Paarl North and Rivo Quarters), three in Stellenbosch (7 Bird Street, Neelsie Student Centre and Stelmark Centre), plus Wellington, Malmesbury, Durbanville and Franschhoek.",
  },
  {
    question: "What does a haircut cost?",
    answer:
      "Classic runs from R140 for a Schoolboy or Pensioner Cut to R290 for The Club Cut. Premier runs from R160 to R490 for The Godfather Cut. Extras like a wash and style or nose and ear wax are R70 in both. The full menu is published — no surprises at the counter.",
  },
  {
    question: "Do you cut children's hair?",
    answer:
      "Yes. The Schoolboy Cut is for under 13s — R140 at Classic branches, R160 at Premier.",
  },
  {
    question: "Is there a pensioner rate?",
    answer: "Yes. The Pensioner Cut is R140 at Classic branches and R160 at Premier.",
  },
  {
    question: "Can I book for a wedding party or a group?",
    answer:
      "Yes. The Johnnie Red package is R450 per person for a minimum of three; Johnnie Black is R650 per person for a minimum of four and includes exclusive use of the venue for two hours. Johnnie Blue extends that to five hours, priced on request. Email connect@barberclub.co.za.",
  },
  {
    question: "How long does a cut take?",
    answer:
      "CONFIRM: durations are not published anywhere on the current site and need to come from the shop.",
  },
  {
    question: "How do I cancel or reschedule?",
    answer:
      "CONFIRM: no cancellation policy is published on the current site. This needs to be agreed before the booking system goes live.",
  },
  {
    question: "How do I pay?",
    answer: "CONFIRM: accepted payment methods are not published on the current site.",
  },
  {
    question: "What is Barber Club, exactly?",
    answer:
      "Barber Club opened its first doors in December 2017 and has grown to eleven branches. It started when a group of friends decided to build a business that would have a positive impact on the community — great coffee, music, Wi-Fi and experienced barbers. More than a cut.",
  },
];
