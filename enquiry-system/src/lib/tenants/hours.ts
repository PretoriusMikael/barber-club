import type { TenantConfig, Weekday } from "./schema.ts";

/**
 * Opening hours, computed in code — never by the model.
 *
 * "Are you open now?" is a question an LLM gets wrong confidently: it does not
 * know the time, and it does arithmetic on time zones badly. The server works
 * out the answer and hands the model a sentence it only has to repeat.
 */

type Hours = TenantConfig["hours"];

const DAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_NAMES: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function localNow(timezone: string, now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday").slice(0, 3).toLowerCase() as Weekday;
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return {
    weekday,
    minutes: hour * 60 + minute,
    label: `${DAY_NAMES[weekday]} ${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`,
  };
}

export interface OpenStatus {
  isOpen: boolean;
  /** One sentence, safe to quote to a customer. */
  summary: string;
}

export function openStatus(hours: Hours, timezone: string, now: Date = new Date()): OpenStatus {
  const { weekday, minutes } = localNow(timezone, now);

  const openRange = hours[weekday].find(([from, to]) => minutes >= toMinutes(from) && minutes < toMinutes(to));
  if (openRange) {
    return { isOpen: true, summary: `We are open now, until ${openRange[1]} today.` };
  }

  // Later today?
  const laterToday = hours[weekday].find(([from]) => toMinutes(from) > minutes);
  if (laterToday) {
    return { isOpen: false, summary: `We are closed right now and open again today at ${laterToday[0]}.` };
  }

  // Next day with hours, up to a week ahead.
  const startIndex = DAYS.indexOf(weekday);
  for (let offset = 1; offset <= 7; offset++) {
    const day = DAYS[(startIndex + offset) % 7]!;
    const first = hours[day][0];
    if (first) {
      const when = offset === 1 ? "tomorrow" : `on ${DAY_NAMES[day]}`;
      return { isOpen: false, summary: `We are closed right now and open again ${when} at ${first[0]}.` };
    }
  }
  return { isOpen: false, summary: "We are closed right now." };
}

/** Human-readable weekly hours for the prompt and the knowledge base. */
export function describeHours(hours: Hours): string {
  const order: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order
    .map((day) => {
      const ranges = hours[day];
      const text = ranges.length ? ranges.map(([a, b]) => `${a}–${b}`).join(", ") : "closed";
      return `${DAY_NAMES[day]}: ${text}`;
    })
    .join("\n");
}
