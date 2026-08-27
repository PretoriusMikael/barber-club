/**
 * The service menu, in both tiers.
 *
 * SOURCE: /barber-club-classic and /barber-club-premier on barberclub.co.za,
 * fetched 2026-08-17. Every name and price is verbatim. Nothing invented.
 *
 * ⚠️  DURATIONS ARE NOT PUBLISHED ANYWHERE on the current site, so `minutes` is
 *     null throughout. Get them from the shop before launch — stated durations
 *     set expectations, reduce no-shows, and are required by most booking
 *     engines to build a slot calendar at all.
 */

export type ServiceCategory = "cuts" | "beards" | "shaves" | "extras";
export type Tier = "classic" | "premier";

/** Describes a photograph. `src` is null until the shoot lands; nothing renders
 *  in the meantime (see components/ui/AssetFrame.tsx) and the outstanding briefs
 *  are collected for the client in PITCH-NOTES.md. */
export interface AssetBrief {
  src: string | null;
  alt: string;
  brief: string;
}

export interface Service {
  slug: string;
  /** Exact name as published. */
  name: string;
  /** Our copy — the current site publishes prices with no descriptions at all. */
  blurb: string;
  category: ServiceCategory;
  /** ZAR. null = not offered in that tier. */
  classicPrice: number | null;
  premierPrice: number | null;
  /** Not published on the current site — see PITCH-NOTES.md. */
  minutes: number | null;
  featured: boolean;
  /** Vendor-side service id, for deep-linking into the booking flow. */
  bookingId?: string;
  image: AssetBrief;
}

export const tierInfo: Record<Tier, { label: string; tagline: string; description: string }> = {
  classic: {
    label: "Classic",
    tagline: "Walk in. Sit down. Done.",
    // Verbatim from the current site.
    description:
      "Enjoy a great haircut or shave without the need for an appointment. Simply walk in and experience top-notch service at an unbeatable price.",
  },
  premier: {
    label: "Premier",
    tagline: "The complete grooming experience.",
    // Verbatim from the current site.
    description:
      "For those who value the complete grooming experience, our Premier shops offer services by appointment only.",
  },
};

export const categoryLabels: Record<ServiceCategory, string> = {
  cuts: "Cuts",
  beards: "Beards & shaves",
  shaves: "Shaves",
  extras: "Extras",
};

export const services: Service[] = [
  {
    slug: "the-godfather-cut",
    name: "The Godfather Cut",
    blurb:
      "The full Premier experience, start to finish. Our most complete service — and the one to book before a big week.",
    category: "cuts",
    classicPrice: null, // Premier only
    premierPrice: 490,
    minutes: null,
    featured: true,
    image: {
      src: null,
      alt: "The Godfather Cut, finished",
      brief: "Hero service shot — finished cut, styled, three-quarter angle, warm key light, 4:5",
    },
  },
  {
    slug: "the-club-cut",
    name: "The Club Cut",
    blurb:
      "The signature. A proper cut, taken at the right pace, finished the way you will actually wear it.",
    category: "cuts",
    classicPrice: 290,
    premierPrice: 390,
    minutes: null,
    featured: true,
    image: {
      src: null,
      alt: "The Club Cut, clean side profile",
      brief: "Side profile of a finished Club Cut, warm key light, dark background, 4:5",
    },
  },
  {
    slug: "blade-fade-cut",
    name: "Blade Fade Cut",
    blurb: "Zero to blended, done properly. The line stays sharp for weeks, not days.",
    category: "cuts",
    classicPrice: 180,
    premierPrice: 260,
    minutes: null,
    featured: true,
    image: {
      src: null,
      alt: "Back of head showing a clean blade fade gradient",
      brief: "Back-of-head fade gradient, raking light to show the blend, 4:5",
    },
  },
  {
    slug: "gents-cut",
    name: "Gent's Cut",
    blurb: "The straightforward one. In, cut, tidied at the edges, out.",
    category: "cuts",
    classicPrice: 160,
    premierPrice: 220,
    minutes: null,
    featured: true,
    image: {
      src: null,
      alt: "Gent's Cut, finished",
      brief: "Front three-quarter of a finished Gent's Cut, 4:5",
    },
  },
  {
    slug: "hot-towel-shave",
    name: "Hot-Towel Shave",
    blurb: "Straight razor, hot towels, no rush. The reason barber shops exist.",
    category: "shaves",
    classicPrice: 160,
    premierPrice: 220,
    minutes: null,
    featured: true,
    image: {
      src: null,
      alt: "Straight razor and lather during a hot-towel shave",
      brief: "Lather + straight razor, steam catching the light, shallow DOF, 4:5",
    },
  },
  {
    slug: "cut-wash-and-style",
    name: "Cut, Wash and Style",
    blurb: "Cut, washed, dried and styled — and shown how to do it yourself on Monday.",
    category: "cuts",
    classicPrice: 190,
    premierPrice: 260,
    minutes: null,
    featured: true,
    image: {
      src: null,
      alt: "Wash and style at the basin",
      brief: "Basin wash, overhead angle, water and light, 4:5",
    },
  },

  /* --- Full menu (not featured on home) ---------------------------------- */
  {
    slug: "schoolboy-cut",
    name: "Schoolboy Cut",
    blurb: "Under 13s. Patient barbers and a chair that goes up.",
    category: "cuts",
    classicPrice: 140,
    premierPrice: 160,
    minutes: null,
    featured: false,
    image: {
      src: null,
      alt: "Child having a haircut in the barber chair",
      brief: "Genuine candid mid-cut, child relaxed — needs signed parental release",
    },
  },
  {
    slug: "pensioner-cut",
    name: "Pensioner Cut",
    blurb: "Same cut, same care, kinder price.",
    category: "cuts",
    classicPrice: 140,
    premierPrice: 160,
    minutes: null,
    featured: false,
    image: { src: null, alt: "Pensioner Cut, finished", brief: "Warm portrait, finished cut, 4:5" },
  },
  {
    slug: "beard-trim-shave",
    name: "Beard Trim / Shave",
    blurb: "Shaped with a trimmer, finished with a razor. Cheek line and neckline both squared off.",
    category: "beards",
    classicPrice: 100,
    premierPrice: 120,
    minutes: null,
    featured: false,
    image: {
      src: null,
      alt: "Close-up of a freshly lined-up beard",
      brief: "Beard line-up close-up, cheek line and neckline visible, 4:5",
    },
  },
  {
    slug: "wash-and-style",
    name: "Wash and Style",
    blurb: "No cut. Washed, dried, and set up with the right product.",
    category: "extras",
    classicPrice: 70,
    premierPrice: 70,
    minutes: null,
    featured: false,
    image: { src: null, alt: "Wash and style", brief: "Basin wash, overhead angle" },
  },
  {
    slug: "nose-or-ear-wax",
    name: "Nose or Ear Wax",
    blurb: "Quick, and over faster than you expect.",
    category: "extras",
    classicPrice: 70,
    premierPrice: 70,
    minutes: null,
    featured: false,
    image: { src: null, alt: "Grooming detail", brief: "Detail shot, tools on the counter" },
  },
];

export const featuredServices = services.filter((s) => s.featured);

/** Services available in a given tier, cheapest-last ordering preserved. */
export function servicesForTier(tier: Tier): Service[] {
  return services.filter((s) => priceFor(s, tier) !== null);
}

export function priceFor(service: Service, tier: Tier): number | null {
  return tier === "classic" ? service.classicPrice : service.premierPrice;
}

export function servicesByCategory(tier: Tier): [ServiceCategory, Service[]][] {
  const order: ServiceCategory[] = ["cuts", "beards", "shaves", "extras"];
  return order
    .map(
      (c) =>
        [c, servicesForTier(tier).filter((s) => s.category === c)] as [ServiceCategory, Service[]]
    )
    .filter(([, list]) => list.length > 0);
}

/** Cheapest published price across both tiers — used for "from R…" copy. */
export const lowestPrice = Math.min(
  ...services.flatMap((s) => [s.classicPrice, s.premierPrice].filter((p): p is number => p !== null))
);
