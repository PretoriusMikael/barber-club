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
    <div ref={containerRef} className="relative min-h-[640px] border border-line bg-ink-raised">
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
 */
function NoBookingSystem() {
  return (
    <div className="space-y-8">
      <div className="border border-brass/40 bg-brass/5 p-6 md:p-8">
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
            className="inline-flex h-12 items-center justify-center gap-2 bg-brass px-6 text-sm font-medium uppercase tracking-wide text-ink hover:bg-brass-hi"
          >
            <Phone aria-hidden className="h-4 w-4" />
            {site.phone.display}
          </a>
          <Link
            href="/branches"
            className="inline-flex h-12 items-center justify-center border border-bone/25 px-6 text-sm uppercase tracking-wide hover:border-bone/60"
          >
            Branch numbers
          </Link>
        </div>
      </div>

      <div className="border border-dashed border-bone/20 bg-ink-raised p-6 md:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-brass-dim">
          Biggest open opportunity
        </p>
        <h2 className="text-2xl leading-tight md:text-3xl">
          Barber Club advertises &ldquo;by appointment only&rdquo; with no way to make an
          appointment.
        </h2>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-bone-dim">
          <p>
            Premier is sold on the current site as appointment-only, but the sole
            mechanism offered anywhere across its 17 pages is a phone number. Every
            enquiry outside trading hours is lost. For {branches.length} branches, that is
            a lot of lost chairs.
          </p>

          <div>
            <p className="mb-2 font-medium text-bone">Score vendors against these:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong className="text-bone">Multi-location support</strong> — non-negotiable
                at {branches.length} branches; customers must not book the wrong town
              </li>
              <li>Confirmed availability and support in South Africa</li>
              <li>
                Staff-level deep links (<code>?employee=…</code>) — powers &ldquo;Book with
                [name]&rdquo;, the best CTA for returning customers
              </li>
              <li>ZAR support and a local gateway for deposits (Payfast, Yoco, Peach)</li>
              <li>Automated WhatsApp or SMS reminders — the biggest no-show lever there is</li>
              <li>Reserve with Google — captures demand that never reaches the website</li>
              <li>A conversion webhook or postMessage, so bookings land in GA4</li>
            </ul>
          </div>

          <p className="text-bone-faint">
            Shortlist: Fresha, Setmore, Acuity, Timely, Booksy (verify SA coverage). Squire
            is US-focused and likely a poor fit. Confirm current regional availability and
            pricing with each vendor directly.
          </p>
          <p className="text-bone-faint">
            Once chosen, set <code className="text-bone">booking.vendor</code>,{" "}
            <code className="text-bone">baseUrl</code> and{" "}
            <code className="text-bone">embedUrl</code> in{" "}
            <code className="text-bone">app/content/site.ts</code>. Every CTA on the site
            routes through <code className="text-bone">lib/booking.ts</code>, so nothing
            else changes.
          </p>
        </div>
      </div>
    </div>
  );
}
