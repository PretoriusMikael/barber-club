import Image from "next/image";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetBrief } from "@/content/services";

/**
 * Renders a photograph — or, while `src` is still null, a labelled placeholder
 * showing the shot brief for that frame.
 *
 * This is deliberate: the photography shot list stays visible in the running
 * site instead of hiding in a spreadsheet. Phase 1 (the shoot) is the real
 * critical path on this project and the most commonly underestimated item, so
 * the gaps should be impossible to ignore.
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
  index,
}: {
  asset: AssetBrief;
  ratio?: "3/4" | "4/5" | "1/1" | "6/7" | "16/9";
  /** CSS object-position, for a crop whose subject is not in the middle. */
  focus?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Optional label shown on the placeholder, e.g. "03". */
  index?: number;
}) {
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

  if (asset.src) {
    return (
      <div className={cn("relative overflow-hidden bg-ink-raised", ratioClass, className)}>
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

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden border border-dashed border-bone/15 bg-ink-raised p-4",
        ratioClass,
        className
      )}
      role="img"
      aria-label={`Placeholder: ${asset.alt}`}
    >
      {/* Faint diagonal hatching so placeholders read as "pending", not "broken". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #f4f1ea 0 1px, transparent 1px 10px)",
        }}
      />
      <div className="relative flex items-center justify-between text-bone-faint">
        <Camera aria-hidden className="h-4 w-4" />
        {typeof index === "number" ? (
          <span className="font-mono text-[10px]">{String(index).padStart(2, "0")}</span>
        ) : null}
      </div>
      <p className="relative text-[11px] leading-snug text-bone-faint">
        <span className="mb-1 block uppercase tracking-[0.2em] text-brass-dim">Shot needed</span>
        {asset.brief}
      </p>
    </div>
  );
}
