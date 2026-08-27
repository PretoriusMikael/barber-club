import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AssetBrief } from "@/content/services";

/**
 * Renders a photograph — and renders NOTHING while `src` is still null.
 *
 * This component used to draw a dashed "SHOT NEEDED" tile carrying the brief for
 * the frame, so the outstanding shot list stayed visible in the running site
 * rather than hiding in a spreadsheet. That was the right call while the build
 * was the audience. It is the wrong call now that the site is shown to the
 * client: a service card that is 55% production note is a card that argues the
 * business has not been photographed, and a visitor cannot tell the difference
 * between "mid-project" and "broken".
 *
 * The briefs have not been deleted — they still live beside every asset in
 * content/services.ts, content/gallery.ts and content/branches.ts, and they are
 * collected for the client in PITCH-NOTES.md. They simply do not render. The
 * moment a `src` lands, the picture appears with no other change.
 *
 * Callers must therefore treat the frame as optional and lay out without it (see
 * ServiceCard, which drops to a typographic card when there is no photograph).
 *
 * Aspect ratios are always explicit → CLS stays at 0.
 */
export function AssetFrame({
  asset,
  ratio = "4/5",
  className,
  focus,
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority = false,
  radius = "md",
}: {
  asset: AssetBrief;
  ratio?: "3/4" | "4/5" | "1/1" | "6/7" | "16/9";
  /** CSS object-position, for a crop whose subject is not in the middle. */
  focus?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** `lg` for frames big enough that the house 12px reads as a square corner. */
  radius?: "md" | "lg";
}) {
  if (!asset.src) return null;

  const ratioClass = {
    "3/4": "aspect-[3/4]",
    "4/5": "aspect-[4/5]",
    // The supplied photographs are 456x532. Showing them at their own ratio is
    // the difference between a crop and a shave off both sides of a file that
    // has no resolution to spare.
    "6/7": "aspect-[6/7]",
    "1/1": "aspect-square",
    "16/9": "aspect-video",
  }[ratio];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-ink-raised",
        radius === "lg" ? "rounded-lg" : "rounded",
        ratioClass,
        className
      )}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        style={focus ? { objectPosition: focus } : undefined}
        className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
      />
    </div>
  );
}
