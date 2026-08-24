"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Star, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, nav } from "@/content/site";
import { branches } from "@/content/branches";
import { BookButton } from "@/components/ui/Button";
import { ScrollProgress } from "@/components/layout/ScrollProgress";

/**
 * Transparent over the hero, solid once scrolled. The BOOK button is present at
 * every scroll position on desktop — the visitor must never scroll up to book.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // /book is a single-purpose page: nothing in the chrome may compete with it.
  const minimal = pathname === "/book";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The drawer is closed from each link's onClick rather than from an effect on
  // `pathname` — a setState inside an effect triggers a cascading render, and
  // the click is the real event anyway.

  // Lock the page behind the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (minimal) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-2xl leading-none tracking-wider"
            aria-label={`${site.name} home`}
          >
            {site.name}
          </Link>
          <a
            href={`tel:${site.phone.e164}`}
            className="flex items-center gap-2 text-sm text-bone-dim hover:text-bone"
          >
            <Phone aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">{site.phone.display}</span>
          </a>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-ink/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      {/* Only once the header has a solid background to sit on — over the hero
          it would be a brass line floating across the video. */}
      {scrolled ? <ScrollProgress /> : null}

      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8 md:h-20">
        <Link
          href="/"
          className="font-display text-2xl leading-none tracking-wider md:text-3xl"
          aria-label={`${site.name} home`}
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-bone-dim transition-colors hover:text-bone"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Rating chip renders only once real Google data is wired up. */}
          {site.rating.verified && site.rating.count > 0 ? (
            <span className="hidden items-center gap-1.5 text-sm text-bone-dim xl:flex">
              <Star aria-hidden className="h-3.5 w-3.5 fill-brass text-brass" />
              {site.rating.value} · {site.rating.count} reviews
            </span>
          ) : null}

          <BookButton location="header" size="sm" className="hidden sm:inline-flex">
            Book now
          </BookButton>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="p-2 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer. For an 11-branch group the most useful thing it can
          carry is a fast route to the branch list, not one shop's address. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-ink px-5 pb-24 pt-8 lg:hidden"
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-4 font-display text-3xl tracking-wide"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="border-b border-line py-4 font-display text-3xl tracking-wide text-brass"
          >
            Book
          </Link>
        </nav>

        <Link
          href="/branches"
          onClick={() => setOpen(false)}
          className="mt-8 flex items-center gap-3 border border-line p-4 text-sm text-bone-dim"
        >
          <MapPin aria-hidden className="h-5 w-5 shrink-0 text-brass" />
          <span>
            <strong className="block text-bone">{branches.length} branches</strong>
            Paarl · Stellenbosch · Wellington · Malmesbury · Durbanville · Franschhoek
          </span>
        </Link>

        <a
          href={`tel:${site.phone.e164}`}
          className="mt-3 flex items-center gap-3 border border-line p-4 text-sm"
        >
          <Phone aria-hidden className="h-5 w-5 shrink-0 text-brass" />
          <span className="text-bone">{site.phone.display}</span>
        </a>
      </div>
    </header>
  );
}
