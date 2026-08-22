import type { AssetBrief } from "./services";

/**
 * Groomsmen, group bookings and special events.
 *
 * SOURCE: /groomsmen-packages-group-bookings on barberclub.co.za, fetched
 * 2026-08-17. Package names, prices, minimums and inclusions are verbatim.
 *
 * This is a high-value, high-intent product hiding on a page most visitors will
 * never find. On the rebuild it gets its own route, its own CTA, and an enquiry
 * path that is not just an email address.
 */

export interface GroupPackage {
  slug: string;
  name: string;
  /** ZAR per person. null = price on application. */
  pricePerPerson: number | null;
  /** Shown when pricePerPerson is null. */
  priceNote?: string;
  minimumPeople: number;
  includes: string[];
  /** Visually emphasise one card. */
  highlight?: boolean;
  image: AssetBrief;
}

export const groupPackages: GroupPackage[] = [
  {
    slug: "johnnie-red",
    name: "Johnnie Red",
    pricePerPerson: 450,
    minimumPeople: 3,
    includes: [
      "Gent's cut",
      "Hot-towel trim / shave and head and neck massage",
      "Nose and ear wax",
      "A complimentary glass of Johnnie Walker Red Label per person",
      "All coffees, sparkling water and still water",
      "Snacks",
    ],
    image: {
      src: null,
      alt: "Groomsmen during a Johnnie Red package",
      brief: "Group of 3 mid-service, relaxed, glasses in hand — landscape 16:9",
    },
  },
  {
    slug: "johnnie-black",
    name: "Johnnie Black",
    pricePerPerson: 650,
    minimumPeople: 4,
    highlight: true,
    includes: [
      "Gent's cut",
      "Hot-towel trim / shave and head and neck massage",
      "Nose and ear wax",
      "One complimentary bottle of Johnnie Walker Black Label for the group",
      "All coffees, sparkling water and still water",
      "Mini facial treatment",
      "Exclusive use of the venue for up to 2 hours",
      "Snack platter",
    ],
    image: {
      src: null,
      alt: "A group with exclusive use of the shop",
      brief: "Wider room shot, exclusive-use feel, warm practical lighting — 16:9",
    },
  },
  {
    slug: "johnnie-blue",
    name: "Johnnie Blue",
    pricePerPerson: null,
    priceNote: "Price on request",
    minimumPeople: 4,
    includes: [
      "Gent's cut",
      "Hot-towel trim / shave and head and neck massage",
      "Nose and ear wax",
      "One complimentary bottle of Johnnie Walker Black Label for the group",
      "All coffees, sparkling water and still water",
      "Mini facial treatment",
      "Exclusive use of the venue for up to 5 hours",
      "Snack platter",
    ],
    image: {
      src: null,
      alt: "A full-day group event at Barber Club",
      brief: "The flagship event shot — full room, whole wedding party — 16:9",
    },
  },
];

/**
 * ⚠️  The Johnnie Blue listing on the current site includes a Johnnie Walker
 *     BLACK Label bottle, identical to the Black package — the only stated
 *     difference is 5 hours of exclusive use instead of 2. Verbatim from the
 *     source, but it reads like a copy-paste error on the existing site.
 *     CONFIRM with the client before republishing.
 */
export const johnnieBlueDiscrepancy =
  "Johnnie Blue lists a Black Label bottle on the current site — confirm whether this should be Blue Label.";

/** CONFIRM: the current site does not state which branches can host groups.
 *  Exclusive venue use implies not all 11 can. */
export const groupBookingContact = {
  email: "connect@barberclub.co.za",
  phone: { e164: "+27730506637", display: "073 050 6637" },
};
