'use client';

import { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { AssetFrame } from '@/components/ui/AssetFrame';
import { Reveal } from '@/components/ui/Reveal';
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogTrigger,
} from '@/components/motion-primitives/morphing-dialog';
import { galleryTagLabels, type GalleryItem, type GalleryTag } from '@/content/gallery';

/**
 * Shared portfolio grid. Unfiltered on the home page, filterable on /gallery.
 *
 * The lightbox is motion-primitives' MorphingDialog, replacing a hand-rolled
 * modal. That fixes two real accessibility bugs in the old version, not just the
 * look of it:
 *
 *   - No Escape key handler — the only way out was a mouse click.
 *   - No focus trap and no focus restore, so keyboard users tabbed straight out
 *     of the open dialog into the page behind it and never got back.
 *
 * MorphingDialog handles Escape, traps Tab within the dialog, returns focus to
 * the trigger on close, and carries role="dialog" / aria-modal. It also morphs
 * the thumbnail into the full image via a shared layout animation, so the
 * dialog visibly comes from the tile you clicked.
 *
 * CSS columns rather than a JS masonry library: no layout thrash, no extra
 * bundle, and every tile has an explicit aspect ratio so CLS stays at 0.
 */
export function GalleryGrid({
  items,
  filterable = false,
  layout: layoutProp = "auto",
}: {
  items: GalleryItem[];
  filterable?: boolean;
  /**
   * "masonry" — CSS multi-column, for a mixed-ratio set where a shared row
   *   baseline would either crop everything to a common shape or leave gaps.
   * "grid" — equal cells, for a set that already shares one aspect ratio.
   *   Multi-column BALANCES by height, so four identical tiles across three
   *   columns come out 2-1-1 and the section reads as though a tile is missing.
   *   With one ratio there is nothing for masonry to solve.
   * "auto" — decide from the pictures. Default, and the only one worth passing
   *   explicitly against.
   */
  layout?: "masonry" | "grid" | "auto";
}) {
  const [active, setActive] = useState<GalleryTag | 'all'>('all');

  const tags = useMemo(() => {
    const present = new Set<GalleryTag>();
    items.filter((i) => i.src).forEach((i) => i.tags.forEach((t) => present.add(t)));
    return Array.from(present);
  }, [items]);

  /* Only photographs that exist. AssetFrame renders nothing without a `src`,
     so an unshot item would otherwise contribute an empty, clickable tile — and
     a lightbox that opens onto nothing. Filtering here also keeps the tag pills
     honest: a category with no photographs yet does not offer a filter that
     leads to an empty grid. */
  const shot = useMemo(() => items.filter((i) => Boolean(i.src)), [items]);
  const visible = active === 'all' ? shot : shot.filter((i) => i.tags.includes(active));

  /* Masonry solves ONE problem: mixed aspect ratios with no shared row baseline.
     Handed a set that shares a ratio it does the opposite — CSS columns balance
     by height, so four identical tiles across three columns come out 2-1-1 and
     leave a third of the section empty, which reads as a picture that failed to
     load rather than as a layout. The four supplied photographs all share 6/7,
     so the honest answer today is equal cells; when the shoot lands with mixed
     ratios this flips back to masonry on its own. */
  const layout =
    layoutProp !== "auto"
      ? layoutProp
      : new Set(visible.map((i) => i.ratio)).size > 1
        ? "masonry"
        : "grid";

  /* --- Column parallax ----------------------------------------------------
   * The three columns drift at slightly different rates as the section passes.
   * This is the one place on the site where scroll-linked motion earns its
   * keep rather than decorating: a portfolio grid is a wall of same-sized
   * rectangles on a flat dark field, and the differing rates are what give it
   * depth — the middle column reads as nearer, the outer two as further back.
   *
   * The amounts are small (±26px over a whole section) on purpose. Enough to
   * register as parallax, not enough to break the grid's alignment or to make
   * anyone feel the page is sliding around under them.
   *
   * `columns-*` is a CSS multi-column layout, so the columns are not addressable
   * as elements — the offset is applied per TILE from its index modulo three,
   * which lands on the same visual columns because CSS columns fill by balanced
   * order and every tile here carries an explicit aspect ratio.
   * --------------------------------------------------------------------- */
  const grid = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: grid,
    offset: ['start end', 'end start'],
  });
  // Masonry can take a big offset because its columns have no shared baseline
  // to violate. A grid does: four equal cells in a row read as one line, so the
  // same amount stops looking like depth and starts looking like a tile that
  // failed to align. A third of the travel keeps the parallax and loses the
  // impression of a bug.
  const strong = layout === "grid" ? 9 : 26;
  const weak = layout === "grid" ? 6 : 18;
  const lift = useTransform(scrollYProgress, [0, 1], [strong, -strong]);
  const sink = useTransform(scrollYProgress, [0, 1], [-weak, weak]);
  const columnOffset =
    layout === "grid" ? [sink, lift, lift, sink] : [sink, lift, sink];

  return (
    <>
      {filterable && tags.length > 1 ? (
        <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter gallery">
          {(['all', ...tags] as const).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActive(tag)}
              aria-pressed={active === tag}
              className={cn(
                'h-9 rounded border px-4 text-xs uppercase tracking-wider transition-colors',
                // Same selection language as the branch filters and the tier
                // toggle — see TierToggle for why it is not brass.
                active === tag
                  ? 'border-bone/40 bg-bone/10 text-bone'
                  : 'border-line text-bone-dim hover:border-bone/40 hover:text-bone'
              )}
            >
              {tag === 'all' ? 'All' : galleryTagLabels[tag]}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={grid}
        className={cn(
          layout === "grid"
            ? "grid grid-cols-2 gap-4 lg:grid-cols-4"
            : "columns-2 gap-4 md:columns-3 [&>*]:mb-4"
        )}
      >
        {visible.map((item, i) => (
          <motion.div
            key={item.id}
            className={layout === "grid" ? undefined : "break-inside-avoid"}
            style={
              reduced ? undefined : { y: columnOffset[i % columnOffset.length] }
            }
          >
            <MorphingDialog
              transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            >
              <MorphingDialogTrigger
                className="group block w-full text-left"
                // The trigger is a <button>; the frame inside carries the alt text.
              >
                <span
                  className="block"
                  onClick={() =>
                    track('gallery_open', { id: item.id, tags: item.tags.join(',') })
                  }
                >
                  {/* `frame`, not `rise`: a photograph arrives by settling into
                      its crop, not by sliding up the page. `as="span"` because
                      the trigger is a <button>, which may only contain phrasing
                      content — a <div> here is invalid HTML and browsers repair
                      it by breaking the button out of the flow. The column
                      offset staggers the three columns against each other. */}
                  <Reveal
                    as="span"
                    variant="frame"
                    delay={(i % 3) * 90}
                    className="block overflow-hidden rounded"
                  >
                    <AssetFrame
                      asset={item}
                      ratio={item.ratio}
                      sizes="(min-width: 768px) 33vw, 50vw"
                    />
                  </Reveal>
                </span>
              </MorphingDialogTrigger>

              <MorphingDialogContainer>
                <MorphingDialogContent className="relative w-[min(92vw,32rem)]">
                  <AssetFrame asset={item} ratio={item.ratio} radius="lg" sizes="92vw" />
                  <MorphingDialogDescription
                    disableLayoutAnimation
                    variants={{
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: 8 },
                    }}
                  >
                    <p className="mt-3 text-center text-sm text-bone-dim">{item.alt}</p>
                  </MorphingDialogDescription>

                  <MorphingDialogClose className="absolute -top-10 right-0 text-bone">
                    <XIcon className="h-6 w-6" />
                  </MorphingDialogClose>
                </MorphingDialogContent>
              </MorphingDialogContainer>
            </MorphingDialog>
          </motion.div>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-bone-faint">
          No work in this category yet.
        </p>
      ) : null}
    </>
  );
}
