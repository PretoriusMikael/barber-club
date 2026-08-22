import { booking, site } from "@/content/site";
import type { Branch } from "@/content/branches";

/**
 * Every booking CTA in the app routes through here, so switching vendor is a
 * change to the `booking` object in content/site.ts only.
 *
 * Context: the CURRENT barberclub.co.za has no online booking at all. Premier
 * branches are advertised as "by appointment only" with nothing but a phone
 * number to act on. Closing that gap is the highest-value change in the rebuild,
 * which is why this module exists before a vendor has even been chosen —
 * `bookingReady` is false until one is, and the UI degrades to phone/WhatsApp
 * instead of rendering dead buttons.
 */

export interface BookingTarget {
  serviceId?: string;
  staffId?: string;
  /** Branch slug → vendor location id. An 11-branch group needs this on
   *  every deep link, or the customer books the wrong town. */
  branch?: Branch;
}

export const bookingReady = Boolean(booking.baseUrl) && booking.vendor !== "unset";

export function buildBookingUrl({ serviceId, staffId, branch }: BookingTarget = {}): string {
  // Until a vendor is contracted, send people to /book, which explains how to
  // book today (phone) rather than 404-ing into a vendor that does not exist.
  if (!bookingReady) return "/book";

  try {
    const url = new URL(booking.baseUrl);
    if (serviceId) url.searchParams.set(booking.params.service, serviceId);
    if (staffId) url.searchParams.set(booking.params.staff, staffId);
    if (branch) url.searchParams.set(booking.params.location, branch.slug);
    return url.toString();
  } catch {
    return "/book";
  }
}

/** True when the CTA leaves our origin — controls target/rel and event naming. */
export function isExternalBooking(): boolean {
  return bookingReady;
}

/**
 * Pre-filled WhatsApp deep link.
 *
 * Returns null while `site.whatsapp.enabled` is false: no WhatsApp number is
 * published on the current site, and guessing that the main line accepts
 * WhatsApp would send customers into a dead channel. Callers must handle null.
 */
export function whatsappUrl(message?: string): string | null {
  if (!site.whatsapp.enabled) return null;
  const text = encodeURIComponent(message ?? site.whatsapp.prefill);
  return `https://wa.me/${site.whatsapp.number}?text=${text}`;
}

/** Group-wide line. Prefer branchTelUrl when a branch is in context — two
 *  branches (Val de Vie, Franschhoek) have their own numbers. */
export const telUrl = `tel:${site.phone.e164}`;

export function branchTelUrl(branch: Branch): string {
  return `tel:${branch.phone.e164}`;
}

/** Google Maps directions link built from the published address. */
export function mapsUrlFor(branch: Branch): string {
  const query = branch.geo
    ? `${branch.geo.lat},${branch.geo.lng}`
    : `Barber Club, ${branch.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Embeddable map iframe src. No API key or billing account required. */
export function mapEmbedFor(branch: Branch): string {
  const query = branch.geo
    ? `${branch.geo.lat},${branch.geo.lng}`
    : `Barber Club, ${branch.address}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
