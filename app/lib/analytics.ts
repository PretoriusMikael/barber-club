/**
 * Thin GA4 wrapper.
 *
 * Primary KPI: booking_complete / unique sessions.
 *
 * For an 11-branch group, `branch` is on almost every event — the question
 * "which branches convert online and which do not" is the one that decides
 * where marketing spend goes, and it cannot be answered retrospectively.
 */

export type AnalyticsEvent =
  | "book_cta_click"
  | "booking_widget_load"
  | "booking_complete"
  | "whatsapp_click"
  | "phone_click"
  | "directions_click"
  | "gallery_open"
  | "service_card_click"
  | "barber_book_click"
  | "craft_section_view"
  | "scroll_depth_75"
  | "tier_toggle"
  | "branch_view"
  | "branch_select"
  | "group_enquiry_click";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Params) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, params: Params = {}): void {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${event}`, params);
  }

  window.gtag?.("event", event, params);
}

/**
 * Where a booking CTA lives. Passed on every `book_cta_click` so you can see
 * which placement actually earns the bookings — and delete the ones that do not.
 */
export type CtaLocation =
  | "hero"
  | "sticky_bar"
  | "header"
  | "services"
  | "service_card"
  | "tier_card"
  | "barber_card"
  | "craft"
  | "gallery"
  | "branches"
  | "branch_page"
  | "groups"
  | "final"
  | "footer"
  | "book_page";
