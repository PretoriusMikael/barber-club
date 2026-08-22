"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { track, type CtaLocation } from "@/lib/analytics";
import {
  buildBookingUrl,
  isExternalBooking,
  whatsappUrl,
  telUrl,
  branchTelUrl,
} from "@/lib/booking";
import type { Branch } from "@/content/branches";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide uppercase " +
  "transition-all duration-200 ease-[var(--ease-out-expo)] select-none " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // brass is reserved for booking — see globals.css @theme comment.
  primary:
    "bg-brass text-ink hover:bg-brass-hi hover:-translate-y-0.5 " +
    "shadow-[0_0_0_0_rgba(200,163,90,0.5)] hover:shadow-[0_8px_28px_-6px_rgba(200,163,90,0.55)]",
  outline: "border border-bone/25 text-bone hover:border-bone/60 hover:bg-bone/5",
  ghost: "text-bone-dim hover:text-bone",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-sm md:text-base",
};

export interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export function ButtonLink({
  href,
  children,
  variant = "outline",
  size = "md",
  className,
  external,
  onClick,
  ariaLabel,
}: ButtonLinkProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/**
 * THE primary CTA. Every instance reports its `location`, so you can see which
 * placements actually earn bookings and delete the ones that do not.
 *
 * Until a booking vendor is contracted this routes to /book, which explains how
 * to book today (phone) rather than rendering a dead button. `branch` matters
 * for an 11-branch group — without it customers book the wrong town.
 */
export function BookButton({
  location,
  serviceId,
  staffId,
  branch,
  children = "Book your chair",
  variant = "primary",
  size = "md",
  className,
}: {
  location: CtaLocation;
  serviceId?: string;
  staffId?: string;
  branch?: Branch;
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const href = buildBookingUrl({ serviceId, staffId, branch });

  return (
    <ButtonLink
      href={href}
      external={isExternalBooking()}
      variant={variant}
      size={size}
      className={className}
      onClick={() =>
        track("book_cta_click", {
          location,
          service: serviceId,
          staff: staffId,
          branch: branch?.slug,
        })
      }
    >
      {children}
    </ButtonLink>
  );
}

/**
 * Renders nothing while no WhatsApp number is published. Guessing that the main
 * line accepts WhatsApp would send customers into a dead channel — see
 * site.whatsapp.enabled.
 */
export function WhatsAppButton({
  location,
  message,
  children = "WhatsApp us",
  variant = "outline",
  size = "md",
  className,
}: {
  location: CtaLocation;
  message?: string;
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const href = whatsappUrl(message);
  if (!href) return null;

  return (
    <ButtonLink
      href={href}
      external
      variant={variant}
      size={size}
      className={className}
      onClick={() => track("whatsapp_click", { location })}
    >
      {children}
    </ButtonLink>
  );
}

/** Uses the branch's own line when one is in context — Val de Vie and
 *  Franschhoek have dedicated numbers, the rest share the group line. */
export function CallButton({
  location,
  branch,
  children,
  variant = "outline",
  size = "md",
  className,
}: {
  location: CtaLocation;
  branch?: Branch;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <a
      href={branch ? branchTelUrl(branch) : telUrl}
      className={cn(base, variants[variant], sizes[size], className)}
      onClick={() => track("phone_click", { location, branch: branch?.slug })}
    >
      {children}
    </a>
  );
}
