import { site, type DayKey, type OpeningHours } from "@/content/site";
import type { Branch } from "@/content/branches";

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const dayLabels: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/**
 * Hours are per-branch — Paarl North trades 09:00–18:00 and opens Sundays while
 * most branches run 08:00–17:30 and close them, so there is no such thing as a
 * group-wide opening time. Every function here takes the branch's own schedule.
 */

/**
 * Current wall-clock in the shop's timezone, not the visitor's. Someone
 * checking from London at 20:00 must still be told the Paarl shop is shut.
 */
function nowInShopTz(): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: site.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday").slice(0, 3).toLowerCase();
  const day = (DAY_KEYS.find((d) => d === weekday) ?? "mon") as DayKey;
  const hour = Number(get("hour"));
  // en-ZA renders midnight as "24" in some ICU versions — normalise it.
  const normalisedHour = hour === 24 ? 0 : hour;

  return { day, minutes: normalisedHour * 60 + Number(get("minute")) };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export interface OpenState {
  isOpen: boolean;
  /** "Open until 17:30" / "Closed — opens tomorrow at 08:00" */
  label: string;
  today: DayKey;
}

/**
 * MUST be called client-side only (after mount). Calling it during SSR and
 * again on hydration produces a mismatch, because build time and view time are
 * different moments.
 *
 * ⚠️  Does not model public holidays. Every branch publishes separate
 *     public-holiday hours (see Branch.publicHolidays) but there is no calendar
 *     of which dates those are. Either add a dated override list or pull hours
 *     live from each branch's Google Business Profile, which already carries
 *     holiday exceptions.
 */
export function getOpenState(hours: Record<DayKey, OpeningHours>): OpenState {
  const { day, minutes } = nowInShopTz();
  const todayHours = hours[day];

  if (todayHours.open && todayHours.close) {
    const open = toMinutes(todayHours.open);
    const close = toMinutes(todayHours.close);
    if (minutes >= open && minutes < close) {
      return { isOpen: true, label: `Open until ${todayHours.close}`, today: day };
    }
    if (minutes < open) {
      return { isOpen: false, label: `Opens today at ${todayHours.open}`, today: day };
    }
  }

  // Walk forward to the next day that has hours.
  const startIdx = DAY_KEYS.indexOf(day);
  for (let i = 1; i <= 7; i++) {
    const next = DAY_KEYS[(startIdx + i) % 7];
    const h = hours[next];
    if (h.open) {
      const when = i === 1 ? "tomorrow" : dayLabels[next];
      return { isOpen: false, label: `Closed — opens ${when} at ${h.open}`, today: day };
    }
  }

  return { isOpen: false, label: "Hours unavailable", today: day };
}

/** Ordered Mon→Sun rows for an hours table. */
export function hoursRows(hours: Record<DayKey, OpeningHours>) {
  const order: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order.map((key) => {
    const h = hours[key];
    return {
      key,
      label: dayLabels[key],
      value: h.open && h.close ? `${h.open} – ${h.close}` : "Closed",
    };
  });
}

/**
 * Collapses consecutive identical days: "Mon – Fri  08:00 – 17:30".
 * Every branch page on the current site presents hours this way.
 */
export function compactHoursRows(hours: Record<DayKey, OpeningHours>) {
  const order: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const rows: { label: string; value: string }[] = [];

  let runStart = 0;
  const valueAt = (i: number) => {
    const h = hours[order[i]];
    return h.open && h.close ? `${h.open} – ${h.close}` : "Closed";
  };

  for (let i = 1; i <= order.length; i++) {
    if (i === order.length || valueAt(i) !== valueAt(runStart)) {
      const from = dayLabels[order[runStart]].slice(0, 3);
      const to = dayLabels[order[i - 1]].slice(0, 3);
      rows.push({
        label: runStart === i - 1 ? from : `${from} – ${to}`,
        value: valueAt(runStart),
      });
      runStart = i;
    }
  }

  return rows;
}

/** schema.org openingHoursSpecification for one branch. */
export function openingHoursSpecification(branch: Branch) {
  const order: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order
    .filter((k) => branch.hours[k].open && branch.hours[k].close)
    .map((k) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayLabels[k],
      opens: branch.hours[k].open,
      closes: branch.hours[k].close,
    }));
}
