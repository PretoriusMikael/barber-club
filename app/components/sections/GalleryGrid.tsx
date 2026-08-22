'use client';

import { useMemo, useState } from 'react';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { AssetFrame } from '@/components/ui/AssetFrame';
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
}: {
  items: GalleryItem[];
  filterable?: boolean;
}) {
  const [active, setActive] = useState<GalleryTag | 'all'>('all');

  const tags = useMemo(() => {
    const present = new Set<GalleryTag>();
    items.forEach((i) => i.tags.forEach((t) => present.add(t)));
    return Array.from(present);
  }, [items]);

  const visible = active === 'all' ? items : items.filter((i) => i.tags.includes(active));

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
                'h-9 border px-4 text-xs uppercase tracking-wider transition-colors',
                active === tag
                  ? 'border-brass bg-brass text-ink'
                  : 'border-line text-bone-dim hover:border-bone/40 hover:text-bone'
              )}
            >
              {tag === 'all' ? 'All' : galleryTagLabels[tag]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
        {visible.map((item, i) => (
          <div key={item.id} className="break-inside-avoid">
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
                  <AssetFrame
                    asset={item}
                    ratio={item.ratio}
                    index={i + 1}
                    sizes="(min-width: 768px) 33vw, 50vw"
                  />
                </span>
              </MorphingDialogTrigger>

              <MorphingDialogContainer>
                <MorphingDialogContent className="relative w-[min(92vw,32rem)]">
                  <AssetFrame asset={item} ratio={item.ratio} sizes="92vw" />
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
          </div>
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
