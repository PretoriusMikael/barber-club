/**
 * Brand-level facts. Branch-specific data lives in content/branches.ts.
 *
 * SOURCE: everything here was extracted verbatim from barberclub.co.za
 * (scanned 2026-08-17, 17 pages via sitemap). Nothing in this file is invented.
 * Anything the current site does not publish is left empty or disabled rather
 * than guessed, and the full list of what we need from the client is collected
 * in PITCH-NOTES.md.
 */

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface OpeningHours {
  /** 24h "HH:MM", or null for closed. */
  open: string | null;
  close: string | null;
}

export const site = {
  name: "Barber Club",

  /** Verbatim from the current homepage hero. */
  tagline: "More than a cut. Welcome to the Club.",
  /** Verbatim, used as a secondary line. */
  motto: "It is the place where you belong",

  description:
    "Barber Club is an 11-branch barber shop group across the Cape Winelands — Paarl, Stellenbosch, Wellington, Malmesbury, Durbanville and Franschhoek. Walk in for a Classic cut, or book the Premier grooming experience.",

  /** Trading since December 2017 (verbatim from "Our Story"). */
  established: "December 2017",

  url: "https://www.barberclub.co.za",

  /** --- Brand story, verbatim from the current site ---------------------- */
  story: {
    origin:
      "Barber Club was born when a group of friends decided to start a business that would have a positive impact on the community.",
    growth:
      "Barber Club first opened its doors in December 2017 and has rapidly established itself as not just another barbershop where you come and go. It is the place where you belong.",
    experience:
      "It is a unique experience with great coffee, music, Wi-Fi and a legendary team of experienced barbers to look after your grooming needs.",
    promise: "From a quick cut to the complete grooming experience, we have got you covered.",
  },

  /** --- Contact ----------------------------------------------------------
   * The group runs several addresses for different purposes — keep them
   * separate so enquiries land with the right person. */
  phone: { e164: "+27730506637", display: "073 050 6637" },
  email: {
    general: "hello@barberclub.co.za",
    operations: "operations@barberclub.co.za",
    groupBookings: "connect@barberclub.co.za",
    advertising: "john.mostert@barberclub.co.za",
  },

  /** No WhatsApp number is published on the current site. WhatsApp is a primary
   *  contact channel in SA and this is a cheap conversion win — confirm whether
   *  073 050 6637 accepts WhatsApp, then flip `enabled` and every WhatsApp CTA
   *  on the site appears. Until then the UI hides the channel entirely rather
   *  than sending customers into a dead one. See PITCH-NOTES.md. */
  whatsapp: {
    enabled: false,
    number: "27730506637",
    prefill: "Hi Barber Club, I'd like to book a ",
  },

  timezone: "Africa/Johannesburg",

  /** Not published on the current site — needs confirming before the booking
   *  terms can state it. Nothing renders this list today. */
  paymentMethods: [] as readonly string[],

  /** --- Social (all verified live on the current site) -------------------- */
  social: {
    facebook: "https://www.facebook.com/barberclubsa",
    instagram: "https://www.instagram.com/the_barberclub_sa",
    tiktok: "https://www.tiktok.com/@.barber_club",
    youtube: "https://www.youtube.com/@the_Barber_Club",
    googleBusiness: "",
  },
  instagramHandle: "@the_barberclub_sa",

  /** Group-wide rating. Populate from the Google Places API per branch — see
   *  content/reviews.ts. Never hand-type these. */
  rating: { value: 0, count: 0, verified: false },
} as const;

/**
 * Booking vendor config.
 *
 * ⚠️  THE CURRENT SITE HAS NO ONLINE BOOKING AT ALL. Premier branches are
 *     advertised as "by appointment only", but the only mechanism offered is a
 *     phone number. That is the single biggest conversion gap in the rebuild
 *     and the highest-value thing to fix.
 *
 * Every CTA routes through lib/booking.ts, so switching vendor is a change to
 * this object only. Evaluation criteria are in BLUEPRINT.md §4.
 */
export const booking = {
  vendor: "unset" as "fresha" | "setmore" | "acuity" | "booksy" | "timely" | "custom" | "unset",
  baseUrl: "",
  /** Vendor deep-link params — verify against their docs before relying on them. */
  params: { service: "service", staff: "employee", location: "location" },
  embedUrl: "",
  /** No cancellation policy is published on the current site. 4 hours is the
   *  proposed default stated on /legal/terms — this value, that page and the
   *  vendor's own configuration must agree before booking goes live. */
  cancellationWindowHours: 4,
  depositRequired: false,
} as const;

export const nav = [
  { label: "Services", href: "/services" },
  { label: "Branches", href: "/branches" },
  { label: "Groups", href: "/groups" },
  { label: "Our Story", href: "/#story" },
] as const;
