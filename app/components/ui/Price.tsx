'use client';

import { AnimatedNumber } from '@/components/motion-primitives/animated-number';

/**
 * A price that counts when it changes.
 *
 * This exists for one moment: toggling Classic ↔ Premier. Watching R290 climb to
 * R390 makes the difference between the tiers legible in a way a hard swap never
 * does — the eye follows the change instead of having to re-read the row. It is
 * the single best argument for putting the two tiers on one control.
 *
 * `bounce: 0` — a spring that overshoots would land on the wrong number for a
 * few frames, which on a price list looks like a bug rather than a flourish.
 */
export function Price({
  value,
  className,
  prefix = 'R',
}: {
  /** null = not offered in this tier. */
  value: number | null;
  className?: string;
  prefix?: string;
}) {
  if (value === null) return <span className={className}>—</span>;

  return (
    <span className={className}>
      {prefix}
      <AnimatedNumber value={value} springOptions={{ bounce: 0, duration: 550 }} />
    </span>
  );
}
