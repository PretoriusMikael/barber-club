import type { DayKey, OpeningHours } from "./site";
import type { AssetBrief } from "./services";

/**
 * The 11 Cape Winelands branches.
 *
 * SOURCE: each branch's own page on barberclub.co.za, fetched individually
 * 2026-08-17. Addresses, phone numbers and hours are verbatim. Nothing invented.
 *
 * Two things could not be established from the site and must come from the client:
 *
 *  1. `tier` — the site describes Classic (walk-in) and Premier (appointment
 *     only) as concepts but never maps branches to them. All are "unconfirmed".
 *  2. `geo` — no coordinates are published anywhere. Needed for LocalBusiness
 *     schema and map embeds. Get them from Google Maps: right-click the pin →
 *     copy coordinates.
 */

export type BranchTier = "classic" | "premier" | "unconfirmed";

export interface Branch {
  slug: string;
  /** Display name, matching how the current site labels the branch. */
  name: string;
  /** Town, used for grouping and for local-SEO title tags. */
  town: string;
  /** Full address exactly as published. */
  address: string;
  /** Short form for cards and the branch picker. */
  shortAddress: string;
  postalCode: string;
  phone: { e164: string; display: string };
  email: string;
  tier: BranchTier;
  hours: Record<DayKey, OpeningHours>;
  /** Published separately from weekday hours on every branch page. */
  publicHolidays: OpeningHours;
  /** No coordinates are published on the current site. */
  geo: { lat: number; lng: number } | null;
  image: AssetBrief;
}

/** Most branches share the group's main line. */
const MAIN_PHONE = { e164: "+27730506637", display: "073 050 6637" };
const OPS_EMAIL = "operations@barberclub.co.za";

/** The most common pattern: Mon–Fri 08:00–17:30, Sat 08:00–14:00, Sun closed. */
const standardHours: Record<DayKey, OpeningHours> = {
  mon: { open: "08:00", close: "17:30" },
  tue: { open: "08:00", close: "17:30" },
  wed: { open: "08:00", close: "17:30" },
  thu: { open: "08:00", close: "17:30" },
  fri: { open: "08:00", close: "17:30" },
  sat: { open: "08:00", close: "14:00" },
  sun: { open: null, close: null },
};

/** Same as standard, but trading on Sundays 08:00–14:00. */
const standardPlusSunday: Record<DayKey, OpeningHours> = {
  ...standardHours,
  sun: { open: "08:00", close: "14:00" },
};

/** Paarl North is the outlier — later start, later finish, open 7 days. */
const optenhorstHours: Record<DayKey, OpeningHours> = {
  mon: { open: "09:00", close: "18:00" },
  tue: { open: "09:00", close: "18:00" },
  wed: { open: "09:00", close: "18:00" },
  thu: { open: "09:00", close: "18:00" },
  fri: { open: "09:00", close: "18:00" },
  sat: { open: "09:00", close: "17:00" },
  sun: { open: "09:00", close: "14:00" },
};

const PH_STANDARD: OpeningHours = { open: "08:00", close: "14:00" };
const PH_OPTENHORST: OpeningHours = { open: "09:00", close: "14:00" };

const shopfront = (name: string): AssetBrief => ({
  src: null,
  alt: `Barber Club ${name} shopfront`,
  brief: `FRONTAGE — ${name}, shot from the pavement, signage legible, daylight. This is how customers recognise the door.`,
});

export const branches: Branch[] = [
  {
    slug: "val-de-vie-estate",
    name: "Val de Vie Estate — The Yard",
    town: "Paarl",
    address: "The Yard at Val de Vie Estate, Paarl, Western Cape, 7646",
    shortAddress: "The Yard, Val de Vie Estate",
    postalCode: "7646",
    // One of only two branches with its own dedicated line.
    phone: { e164: "+27795618850", display: "079 561 8850" },
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardHours,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Val de Vie Estate"),
  },
  {
    slug: "paarl-central",
    name: "Paarl Central — 276 Main Road",
    town: "Paarl",
    address: "Shop 6, 276 Main Road, Paarl, Western Cape, 7646",
    shortAddress: "Shop 6, 276 Main Road",
    postalCode: "7646",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardHours,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Paarl Central"),
  },
  {
    slug: "paarl-north-optenhorst",
    name: "Paarl North — Optenhorst Centre",
    town: "Paarl",
    address: "Corner of Main Road & Optenhorst Street, Paarl, Western Cape, 7646",
    shortAddress: "Cnr Main Road & Optenhorst Street",
    postalCode: "7646",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: optenhorstHours,
    publicHolidays: PH_OPTENHORST,
    geo: null,
    image: shopfront("Paarl North"),
  },
  {
    slug: "rivo-quarters-paarl",
    name: "Rivo Quarters — Paarl",
    town: "Paarl",
    address: "Rivo Quarters Paarl, 32 Market Street, Paarl, Western Cape, 7646",
    shortAddress: "32 Market Street",
    postalCode: "7646",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardHours,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Rivo Quarters"),
  },
  {
    slug: "stellenbosch-bird-street",
    name: "Stellenbosch — 7 Bird Street",
    town: "Stellenbosch",
    address: "7 Bird St, Stellenbosch Central, Stellenbosch, 7600",
    shortAddress: "7 Bird Street",
    postalCode: "7600",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardHours,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Stellenbosch Bird Street"),
  },
  {
    slug: "stellenbosch-neelsie",
    name: "Stellenbosch — Neelsie Student Centre",
    town: "Stellenbosch",
    address:
      "Neelsie Student Centre, Langenhoven, 7 De Beer Rd, Stellenbosch Central, Stellenbosch, 7600",
    shortAddress: "Neelsie Student Centre, 7 De Beer Rd",
    postalCode: "7600",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardPlusSunday,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Stellenbosch Neelsie"),
  },
  {
    slug: "stellenbosch-stelmark",
    name: "Stellenbosch — Stelmark Shopping Centre",
    town: "Stellenbosch",
    address: "Stelmark Shopping Centre, Merriman Ave, Stellenbosch Central, Stellenbosch, 7600",
    shortAddress: "Stelmark Centre, Merriman Ave",
    postalCode: "7600",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardPlusSunday,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Stellenbosch Stelmark"),
  },
  {
    slug: "wellington-welgelee-plein",
    name: "Wellington — Welgeleë Plein",
    town: "Wellington",
    address:
      "Welgelee Plein Shopping Centre, Cnr Champagne & Piet Retief St, Wellington, 7654",
    shortAddress: "Welgeleë Plein, Cnr Champagne & Piet Retief St",
    postalCode: "7654",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardPlusSunday,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Wellington"),
  },
  {
    slug: "malmesbury-de-bron",
    name: "Malmesbury — De Bron Shopping Centre",
    town: "Malmesbury",
    address: "De Bron Shopping Centre, 55 Voortrekker Rd, Malmesbury, 7299",
    shortAddress: "De Bron Centre, 55 Voortrekker Rd",
    postalCode: "7299",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardPlusSunday,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Malmesbury"),
  },
  {
    slug: "durbanville",
    name: "Durbanville — 27 Main Road",
    town: "Durbanville",
    address: "27B Main Rd, Durbanville, Cape Town, 7550",
    shortAddress: "27B Main Road",
    postalCode: "7550",
    phone: MAIN_PHONE,
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardHours,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Durbanville"),
  },
  {
    slug: "franschhoek-place-vendome",
    name: "Franschhoek — Place Vendôme",
    town: "Franschhoek",
    address: "Place Vendome, Corner of De Wet and Main Road, Franschhoek, Western Cape, 7646",
    shortAddress: "Place Vendôme, Cnr De Wet & Main Road",
    postalCode: "7646",
    // The other branch with its own dedicated line.
    phone: { e164: "+27611719901", display: "061 171 9901" },
    email: OPS_EMAIL,
    tier: "unconfirmed",
    hours: standardHours,
    publicHolidays: PH_STANDARD,
    geo: null,
    image: shopfront("Franschhoek"),
  },
];

/** Towns in the order they should appear in the branch picker. */
export const towns = ["Paarl", "Stellenbosch", "Wellington", "Malmesbury", "Durbanville", "Franschhoek"] as const;

export function branchesByTown(): { town: string; list: Branch[] }[] {
  return towns
    .map((town) => ({ town, list: branches.filter((b) => b.town === town) }))
    .filter((g) => g.list.length > 0);
}

export function getBranch(slug: string): Branch | undefined {
  return branches.find((b) => b.slug === slug);
}

/** True while no branch has had its tier confirmed by the client. */
export const tiersUnconfirmed = branches.every((b) => b.tier === "unconfirmed");
