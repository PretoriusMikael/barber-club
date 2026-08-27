"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageCircle, CalendarDays, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { buildBookingUrl, isExternalBooking, whatsappUrl, telUrl } from "@/lib/booking";

/**
 * Mobile bottom bar. Book takes the largest share because it is the only action
 * that completes the job.
 *
 * Appears after 30% scroll so it does not fight the hero CTA, and hides on
 * /book (where the whole page is the CTA). This bar is what makes the "one
 * thumb-reach away" rule hold on mobile.
 *
 * The middle slot is WhatsApp where a number exists, and Branches otherwise —
 * with eleven locations, "which one is near me" is the second most common
 * question after "can I book".
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      setVisible(total > 0 && scrolled / total > 0.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/book") return null;

  const bookHref = buildBookingUrl();
  const external = isExternalBooking();
  const whatsapp = whatsappUrl();
  const tab =
    "flex h-12 flex-1 items-center justify-center gap-2 rounded border border-bone/20 text-xs uppercase tracking-wide text-bone";

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out-expo)] lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <div className="flex items-stretch gap-2 p-2">
        <a
          href={telUrl}
          onClick={() => track("phone_click", { location: "sticky_bar" })}
          className={tab}
          tabIndex={visible ? 0 : -1}
        >
          <Phone aria-hidden className="h-4 w-4" />
          Call
        </a>

        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { location: "sticky_bar" })}
            className={tab}
            tabIndex={visible ? 0 : -1}
          >
            <MessageCircle aria-hidden className="h-4 w-4" />
            WhatsApp
          </a>
        ) : (
          <Link
            href="/branches"
            onClick={() => track("branch_select", { location: "sticky_bar" })}
            className={tab}
            tabIndex={visible ? 0 : -1}
          >
            <MapPin aria-hidden className="h-4 w-4" />
            Branches
          </Link>
        )}

        <a
          href={bookHref}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          onClick={() => track("book_cta_click", { location: "sticky_bar" })}
          className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded bg-brass text-xs font-semibold uppercase tracking-wide text-ink"
          tabIndex={visible ? 0 : -1}
        >
          <CalendarDays aria-hidden className="h-4 w-4" />
          Book
        </a>
      </div>
    </div>
  );
}
