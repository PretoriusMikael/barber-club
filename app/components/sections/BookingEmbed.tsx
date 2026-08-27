"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { booking, site } from "@/content/site";
import { branches } from "@/content/branches";
import { track } from "@/lib/analytics";

/**
 * The ONLY embedded booking widget on the site.
 *
 * Rules it obeys:
 *  - Reserved height before load → cannot shift layout (CLS stays 0).
 *  - Mounted on IntersectionObserver → no third-party JS on first paint.
 *  - `booking_complete` fires from a postMessage listener, because the widget
 *    lives in a cross-origin iframe and we cannot read its DOM. Confirm the
 *    vendor's actual message shape against their docs and update `isSuccess`.
 *
 * Everywhere else on the site we deep-link instead of embedding — a vendor
 * iframe in a hero would wreck LCP and INP.
 */
export function BookingEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const hasEmbed = Boolean(booking.embedUrl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasEmbed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEmbed]);

  useEffect(() => {
    if (!hasEmbed) return;

    const onMessage = (event: MessageEvent) => {
      // TODO: lock this to the vendor's exact origin before launch.
      if (!booking.embedUrl.startsWith(event.origin)) return;

      const data = event.data as { type?: string; event?: string } | null;
      const isSuccess =
        data?.type === "booking:completed" || data?.event === "appointment_created";

      if (isSuccess) track("booking_complete", { vendor: booking.vendor });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [hasEmbed]);

  if (!hasEmbed) return <NoBookingSystem />;

  return (
    <div ref={containerRef} className="relative min-h-[640px] overflow-hidden rounded-lg border border-line bg-ink-raised">
      {!loaded ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm text-bone-faint">Loading available times…</span>
        </div>
      ) : null}

      {inView ? (
        <iframe
          title="Book an appointment"
          src={booking.embedUrl}
          className="h-[640px] w-full border-0"
          loading="lazy"
          onLoad={() => {
            setLoaded(true);
            track("booking_widget_load", { vendor: booking.vendor });
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Shown while no vendor is contracted — which is the situation today.
 *
 * The important part is the top half: a real, working way to book right now.
 * Shipping a "coming soon" box on the one page whose entire job is booking
 * would be worse than the current site, not better.
 *
 * When a vendor is contracted, set `booking.embedUrl` in content/site.ts and the
 * widget above replaces all of this. Nothing else on the site changes: every
 * CTA already routes through lib/booking.ts.
 */
function NoBookingSystem() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-brass/40 bg-brass/5 p-6 md:p-8">
        <h2 className="font-display text-2xl tracking-wide md:text-3xl">
          Right now, booking happens by phone.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-bone-dim">
          Classic branches are walk-in — no booking needed at all. For Premier, call the
          branch and they will put you in the diary.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={`tel:${site.phone.e164}`}
            onClick={() => track("phone_click", { location: "book_page" })}
            className="inline-flex h-12 items-center justify-center gap-2 rounded bg-brass px-6 text-sm font-medium uppercase tracking-wide text-ink hover:bg-brass-hi"
          >
            <Phone aria-hidden className="h-4 w-4" />
            {site.phone.display}
          </a>
          <Link
            href="/branches"
            className="inline-flex h-12 items-center justify-center rounded border border-bone/25 px-6 text-sm uppercase tracking-wide hover:border-bone/60"
          >
            Branch numbers
          </Link>
        </div>
      </div>

      {/* Two ways to sit down, said plainly — because on the one page whose
          entire job is booking, "which of these applies to me" is the only
          question left to answer. The vendor scorecard and the case for online
          booking that used to sit here were written for us, not for a customer;
          they now live in PITCH-NOTES.md. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface rounded border border-line bg-ink-raised p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brass-dim">Classic</p>
          <h3 className="mt-2 font-display text-2xl tracking-wide">No booking needed.</h3>
          <p className="mt-3 text-sm leading-relaxed text-bone-dim">
            Walk in whenever suits you. Find the branch nearest you, check it is open,
            and turn up.
          </p>
          <Link
            href="/branches"
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-xs uppercase tracking-wider text-bone-dim transition-colors hover:text-brass"
          >
            See all {branches.length} branches
          </Link>
        </div>

        <div className="surface rounded border border-line bg-ink-raised p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brass-dim">Premier</p>
          <h3 className="mt-2 font-display text-2xl tracking-wide">By appointment.</h3>
          <p className="mt-3 text-sm leading-relaxed text-bone-dim">
            Call the branch and they will put you in the diary. Every branch page carries
            its own number and its own hours.
          </p>
          <a
            href={`tel:${site.phone.e164}`}
            onClick={() => track("phone_click", { location: "book_page" })}
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-xs uppercase tracking-wider text-bone-dim transition-colors hover:text-brass"
          >
            {site.phone.display}
          </a>
        </div>
      </div>
    </div>
  );
}
