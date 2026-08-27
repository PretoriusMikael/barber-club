/**
 * FAQ, rendered as visible copy AND as FAQPage JSON-LD so these can win
 * long-tail local search on their own.
 *
 * Answers are built from what barberclub.co.za actually publishes. Four
 * questions cannot be answered from the current site at all, and they are the
 * four customers most want answered — which is exactly why they stay in this
 * file rather than being deleted. They carry `pending: true`, and `answered`
 * below is what the page and the schema both render.
 *
 * A pending question renders NOWHERE. It used to render its own CONFIRM note,
 * which meant a customer opening "How do I pay?" was shown a message addressed
 * to the client. The asks are collected in PITCH-NOTES.md; supply an answer,
 * drop the flag, and the question appears in the accordion and in the FAQPage
 * markup on the same deploy.
 */

export interface FaqItem {
  question: string;
  answer: string;
  /**
   * The current site does not publish this, so `answer` is the question we need
   * to put to the client rather than something a customer may read. Filtered
   * out of both the rendered accordion and the JSON-LD.
   */
  pending?: boolean;
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
      "Not published on the current site. Needed before launch — it also decides booking routing and the tier badge on every branch card.",
    pending: true,
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
      "Durations are not published anywhere on the current site. A booking engine cannot build a slot calendar without them.",
    pending: true,
  },
  {
    question: "How do I cancel or reschedule?",
    answer:
      "No cancellation policy is published on the current site. Must be agreed before online booking goes live, and must match the vendor's configuration.",
    pending: true,
  },
  {
    question: "How do I pay?",
    answer: "Accepted payment methods are not published on the current site.",
    pending: true,
  },
  {
    question: "What is Barber Club, exactly?",
    answer:
      "Barber Club opened its first doors in December 2017 and has grown to eleven branches. It started when a group of friends decided to build a business that would have a positive impact on the community — great coffee, music, Wi-Fi and experienced barbers. More than a cut.",
  },
];

/**
 * What actually renders — on the page and in the FAQPage schema alike.
 *
 * Publishing a policy you have not agreed is worse than publishing none, and in
 * structured data it is worse still: a wrong answer in FAQPage markup is a
 * wrong answer shown directly in Google's results.
 */
export const answeredFaqs = faqs.filter((f) => !f.pending);
