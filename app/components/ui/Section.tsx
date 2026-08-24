import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

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
 *
 * Vertical rhythm: `pt` is larger than `pb`. Two neighbours each contributing a
 * symmetric `py-28` produced a 224px dead band at every seam, which on a page
 * this long reads as the site having run out of things to say. Space belongs
 * above a heading, where it announces a new subject — not below the last line
 * of the previous one, where it is just a gap.
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
    <section
      id={id}
      className={cn("scroll-mt-20 pb-16 pt-20 md:pb-20 md:pt-28", tones[tone], className)}
    >
      {children}
    </section>
  );
}

/**
 * A label for a group of content — a branch's town, a menu category.
 *
 * NOT a kicker. This used to sit above every `<h2>` on the site as a small
 * uppercase category tag, which is decoration pretending to be information: the
 * heading underneath already said the same thing, one line later and ten times
 * louder. Those are gone. What remains is the case where the label names a set
 * that the following content belongs to and no heading repeats it.
 */
export function Eyebrow({ children, as = "p" }: { children: ReactNode; as?: "p" | "h3" }) {
  const Tag = as;
  return (
    <Tag className="mb-4 flex items-center gap-3 font-sans text-xs font-normal uppercase tracking-[0.28em] text-brass-dim">
      <span aria-hidden className="h-px w-8 bg-brass-rule" />
      {children}
    </Tag>
  );
}

/**
 * The standard section opener: headline, then an optional line of intro.
 *
 * The headline wipes up under a moving edge; the intro rises a beat later. That
 * ordering is the whole point — the eye is given the promise first and the
 * qualification second, in the order you would say them out loud. Doing both at
 * once is what made the old version feel like a slide deck advancing.
 */
export function SectionHeading({
  title,
  intro,
  className,
}: {
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Reveal as="h2" variant="mask" className="text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
        {title}
      </Reveal>
      {intro ? (
        <Reveal
          as="p"
          delay={140}
          className="mt-5 text-base leading-relaxed text-bone-dim md:text-lg"
        >
          {intro}
        </Reveal>
      ) : null}
    </div>
  );
}
