"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { getOpenState, type OpenState } from "@/lib/hours";
import type { DayKey, OpeningHours } from "@/content/site";

/**
 * "Open until 17:30" — live, client-only, per branch.
 *
 * Implemented with useSyncExternalStore rather than useEffect + setState: the
 * shop's opening state is genuinely external (it depends on the wall clock, not
 * on React), and this handles it without a cascading render on mount.
 *
 * Hydration: the server snapshot is `null`, so SSR emits a fixed-height
 * placeholder and the real label appears on the client. Rendering it on the
 * server would bake build-time truth into a cached page — "open until 17:30"
 * frozen forever.
 *
 * Snapshots are cached per hours-object so the value is referentially stable
 * between ticks (React loops otherwise). Branches sharing a schedule share the
 * same object identity, so they share one computation for free.
 */

type Schedule = Record<DayKey, OpeningHours>;

const listeners = new Set<() => void>();
let snapshots = new WeakMap<Schedule, OpenState>();
let timer: number | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  if (timer === null) {
    // One shared minute-tick for every branch badge on the page.
    timer = window.setInterval(() => {
      snapshots = new WeakMap();
      listeners.forEach((l) => l());
    }, 60_000);
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

function snapshotFor(hours: Schedule): OpenState {
  let s = snapshots.get(hours);
  if (!s) {
    s = getOpenState(hours);
    snapshots.set(hours, s);
  }
  return s;
}

export function OpenNow({ hours, className }: { hours: Schedule; className?: string }) {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshotFor(hours),
    () => null
  );

  // Reserve the line height so the badge appearing does not shift layout.
  if (!state) return <span className={cn("inline-block h-4", className)} aria-hidden />;

  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          state.isOpen ? "bg-emerald-400" : "bg-bone-faint"
        )}
      />
      <span className={state.isOpen ? "text-bone" : "text-bone-dim"}>{state.label}</span>
    </span>
  );
}
