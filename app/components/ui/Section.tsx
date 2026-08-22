import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>
  );
}

/**
 * Every section on this site answers one objection and ends with a CTA.
 * No section exists purely to look good — if you add one that does not move a
 * visitor closer to booking, delete it.
 */
export function Section({
  id,
  children,
  className,
  tone = "base",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "base" | "raised" | "sunken";
}) {
  const tones = {
    base: "bg-ink",
    raised: "bg-ink-raised",
    sunken: "bg-ink-sunken",
  } as const;

  return (
    <section id={id} className={cn("scroll-mt-20 py-20 md:py-28", tones[tone], className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-brass-dim">
      <span aria-hidden className="h-px w-8 bg-brass-dim" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-4xl leading-[0.95] sm:text-5xl md:text-6xl">{title}</h2>
      {intro ? (
        <p className="mt-5 text-base leading-relaxed text-bone-dim md:text-lg">{intro}</p>
      ) : null}
    </div>
  );
}
