import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ZAR, no decimals — every published Barber Club price is a whole rand. */
export function formatZar(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** null = not offered in that tier. */
export function priceLabel(price: number | null): string {
  return price === null ? "—" : formatZar(price);
}

/** Durations are not published on the current site; render honestly until they are. */
export function durationLabel(minutes: number | null): string | null {
  return minutes === null ? null : `${minutes} min`;
}
