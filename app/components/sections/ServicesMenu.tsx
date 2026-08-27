"use client";

import { useState } from "react";
import { servicesByCategory, categoryLabels, priceFor, type Tier } from "@/content/services";
import { Eyebrow } from "@/components/ui/Section";
import { BookButton } from "@/components/ui/Button";
import { TierToggle, TierBlurb } from "@/components/sections/TierToggle";
import { priceLabel, durationLabel } from "@/lib/utils";
import { Price } from "@/components/ui/Price";

/**
 * The full menu on /services, switchable between tiers.
 *
 * Shows the other tier's price inline on every row. That single comparison is
 * the thing the current site makes impossible — Classic and Premier live on two
 * separate pages, so nobody can see that a Club Cut is R290 or R390 without
 * opening two tabs.
 */
export function ServicesMenu() {
  const [tier, setTier] = useState<Tier>("classic");
  const otherTier: Tier = tier === "classic" ? "premier" : "classic";

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <TierToggle value={tier} onChange={setTier} />
        <TierBlurb tier={tier} className="max-w-xl" />
      </div>

      <div className="mt-14 space-y-16">
        {servicesByCategory(tier).map(([category, list]) => (
          <div key={category}>
            <Eyebrow as="h3">{categoryLabels[category]}</Eyebrow>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {list.map((service) => {
                const price = priceFor(service, tier);
                const other = priceFor(service, otherTier);
                const duration = durationLabel(service.minutes);

                return (
                  <li
                    key={service.slug}
                    id={service.slug}
                    className="flex scroll-mt-28 flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="max-w-xl">
                      <h2 className="font-display text-2xl tracking-wide">{service.name}</h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-bone-dim">
                        {service.blurb}
                      </p>
                      {/* The same labelled cross-tier price the home cards use.
                          It was one undifferentiated grey string here and a
                          structured label-and-value there, which meant the
                          identical fact looked like two different facts
                          depending on which page you read it on. */}
                      <p className="mt-2 flex flex-wrap items-baseline gap-2 text-xs">
                        {other === null ? (
                          <span className="text-[10px] uppercase tracking-[0.18em] text-brass-dim">
                            Premier only
                          </span>
                        ) : (
                          <>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-brass-dim">
                              {otherTier === "classic" ? "Classic" : "Premier"}
                            </span>
                            <span className="tnum text-bone-dim">{priceLabel(other)}</span>
                          </>
                        )}
                        {duration ? <span className="text-bone-faint">· {duration}</span> : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                      <Price value={price} className="tnum font-display text-2xl leading-none text-bone" />
                      <BookButton
                        location="service_card"
                        serviceId={service.bookingId}
                        size="sm"
                        variant="outline"
                      >
                        Book
                      </BookButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Service durations are not published anywhere on the current site and
          a booking engine cannot build a slot calendar without them. That is a
          question for the client (PITCH-NOTES.md), not a footnote for the
          customer — so this line states the price promise and nothing else. */}
      <p className="mt-8 text-xs leading-relaxed text-bone-faint">
        Every price on this menu is the price at the counter. Classic is walk-in; Premier
        is by appointment.
      </p>
    </>
  );
}
