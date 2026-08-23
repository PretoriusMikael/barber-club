import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BandPhotograph } from "@/content/photography";
import { Reveal } from "@/components/ui/Reveal";

/**
 * A full-bleed photographic band with copy set into the dark half.
 *
 * This component exists because of what the supplied assets actually are. Three
 * of them are 2.3:1 to 2.9:1 strips with a dark gradient already burned into one
 * side — banners, cropped and treated for text, not photographs that happen to
 * be wide. Two things follow from that:
 *
 *   The copy goes on the side away from the subject, and the component takes
 *   `subject` rather than guessing. Put text over the subject and you have
 *   covered the only part of the frame with anything in it.
 *
 *   The scrim is light. The file already darkens its own dead half, so the
 *   usual full-frame black overlay would stack on top of that and flatten the
 *   band to a grey rectangle. What is here is a directional gradient at low
 *   opacity, doing just enough to guarantee contrast at the text's edge without
 *   killing the picture.
 *
 * ASPECT: the band is shown at 21:9 on desktop, tighter than the source so a
 * sliver is cropped top and bottom rather than the sides — the subjects are
 * horizontally placed, so vertical crop is the cheap direction. On phones it
 * opens up to 4:3 and the copy moves below the picture: a 2.9:1 strip inside a
 * 390px viewport is 134px tall, which is a letterbox, not an image.
 */
export function PhotoBand({
  photo,
  eyebrow,
  children,
  tone = "sunken",
  className,
}: {
  photo: BandPhotograph;
  /** Small line above the statement. Optional, and usually not needed. */
  eyebrow?: string;
  /** The statement itself. Keep it to one sentence — this is a band, not a section. */
  children: ReactNode;
  tone?: "base" | "sunken";
  className?: string;
}) {
  const copyOnLeft = photo.subject === "right";

  return (
    <section
      aria-label="Barber Club at work"
      className={cn(
        "relative isolate overflow-hidden border-y border-line",
        tone === "sunken" ? "bg-ink-sunken" : "bg-ink",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          // Already AVIF, already heavily compressed — see the note in Hero.tsx.
          unoptimized
          style={{ objectPosition: photo.focus }}
          className="object-cover"
        />

        {/* Directional scrim only, and only on the copy side. */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0",
            copyOnLeft
              ? "bg-gradient-to-r from-ink via-ink/70 to-transparent"
              : "bg-gradient-to-l from-ink via-ink/70 to-transparent"
          )}
        />
        {/* Below the copy on phones, where the text sits under the picture and
            needs the seam softened rather than the frame darkened. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent lg:hidden"
        />

        <div className="absolute inset-0 flex items-end lg:items-center">
          <div className="mx-auto w-full max-w-6xl px-5 pb-6 sm:px-8 lg:pb-0">
            <div
              className={cn(
                "max-w-md lg:max-w-lg",
                copyOnLeft ? "lg:mr-auto" : "lg:ml-auto lg:text-right"
              )}
            >
              {eyebrow ? (
                <p className="mb-3 text-xs uppercase tracking-[0.28em] text-brass-dim">
                  {eyebrow}
                </p>
              ) : null}
              {/* Sized for a SENTENCE, not a two-word slogan. The copy these
                  bands carry is the brand's own prose, and at true display
                  scale a 140-character sentence either wraps to five lines or
                  runs off the dark half into the subject. */}
              <Reveal
                as="p"
                variant="mask"
                className="font-display text-[clamp(1.3rem,2.7vw,2.05rem)] leading-[1.14] tracking-wide text-bone"
              >
                {children}
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
