import Link from "next/link";
import { Instagram, Facebook, Youtube, Phone, Mail } from "lucide-react";
import { site } from "@/content/site";
import { branchesByTown } from "@/content/branches";
import { Container } from "@/components/ui/Section";

/**
 * The footer carries the group's NAP-level facts and a full branch index.
 *
 * For a multi-branch business the footer is a genuine local-SEO asset: linking
 * every branch page from every page distributes crawl equity to all eleven
 * instead of concentrating it on the home page.
 *
 * Name, phone and addresses must match each branch's Google Business Profile
 * character-for-character.
 */
export function Footer() {
  const year = new Date().getFullYear();

  const social = [
    { href: site.social.instagram, label: "Instagram", Icon: Instagram },
    { href: site.social.facebook, label: "Facebook", Icon: Facebook },
    { href: site.social.youtube, label: "YouTube", Icon: Youtube },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-line bg-ink-sunken pb-28 pt-16 lg:pb-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-display text-3xl tracking-wider">{site.name}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-bone-dim">
              {site.motto}. Eleven branches across the Cape Winelands since{" "}
              {site.established}.
            </p>

            <div className="mt-6 space-y-2 text-sm text-bone-dim">
              <a
                href={`tel:${site.phone.e164}`}
                className="flex items-center gap-2.5 hover:text-bone"
              >
                <Phone aria-hidden className="h-4 w-4 shrink-0 text-brass-dim" />
                {site.phone.display}
              </a>
              <a
                href={`mailto:${site.email.general}`}
                className="flex items-center gap-2.5 hover:text-bone"
              >
                <Mail aria-hidden className="h-4 w-4 shrink-0 text-brass-dim" />
                {site.email.general}
              </a>
            </div>

            {social.length > 0 ? (
              <div className="mt-6 flex gap-3">
                {social.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center border border-line text-bone-dim transition-colors hover:border-bone/40 hover:text-bone"
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Full branch index — every branch linked from every page. */}
            <nav className="sm:col-span-2 lg:col-span-2" aria-label="Branches">
              <h2 className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-brass-dim">
                Branches
              </h2>
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {branchesByTown().map(({ town, list }) => (
                  <div key={town}>
                    <p className="mb-1.5 text-xs uppercase tracking-wider text-bone-faint">
                      {town}
                    </p>
                    <ul className="space-y-1 text-sm text-bone-dim">
                      {list.map((b) => (
                        <li key={b.slug}>
                          <Link
                            href={`/branches/${b.slug}`}
                            className="transition-colors hover:text-bone"
                          >
                            {b.name.split("—")[1]?.trim() ?? b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>

            <nav aria-label="Footer">
              <h2 className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-brass-dim">
                Explore
              </h2>
              <ul className="space-y-2.5 text-sm text-bone-dim">
                {[
                  { href: "/services", label: "Services & pricing" },
                  { href: "/branches", label: "All branches" },
                  { href: "/groups", label: "Groups & groomsmen" },
                  { href: "/gallery", label: "Gallery" },
                  { href: "/book", label: "Book a chair" },
                  { href: "/legal/privacy", label: "Privacy (POPIA)" },
                  { href: "/legal/terms", label: "Booking terms" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-bone">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-xs text-bone-faint sm:flex-row sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>
            Group bookings:{" "}
            <a href={`mailto:${site.email.groupBookings}`} className="hover:text-bone-dim">
              {site.email.groupBookings}
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
