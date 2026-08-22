# Audit of barberclub.co.za — 2026-08-17

Full scan of the live site: `robots.txt` → `sitemap.xml` → `pages-sitemap.xml` → all 17 pages
fetched individually. Everything below is quoted or derived from the site itself. Where the
site says nothing, this document says so rather than guessing.

Platform: **Wix**.

---

## 1. What Barber Club actually is

An **11-branch Cape Winelands group**, trading since **December 2017**, with **two service
tiers** and a group-events business. The original brief assumed a single neighbourhood shop;
that was wrong, and the build was restructured accordingly.

| Fact | Value |
|---|---|
| Branches | 11 — Paarl ×4, Stellenbosch ×3, Wellington, Malmesbury, Durbanville, Franschhoek |
| Founded | December 2017 |
| Tiers | **Classic** (walk-in) · **Premier** (appointment only) |
| Main phone | 073 050 6637 |
| Dedicated branch lines | Val de Vie 079 561 8850 · Franschhoek 061 171 9901 |
| Emails | `hello@` general · `operations@` branches · `connect@` groups · `john.mostert@` advertising |
| Social | FB `/barberclubsa` · IG `@the_barberclub_sa` · TikTok `@.barber_club` · YouTube `@the_Barber_Club` |

### Brand copy worth keeping (verbatim)

> "MORE THAN A CUT — WELCOME TO THE CLUB"
> "It is the place where you belong"
> "Barber Club was born when a group of friends decided to start a business that would have a
> positive impact on the community."
> "It is a unique experience with great coffee, music, Wi-Fi and a legendary team of
> experienced barbers to look after your grooming needs."

This copy is already good and already in market. The rebuild keeps it. Replacing working brand
language for the sake of a rewrite is vandalism, not design.

---

## 2. The single biggest finding

**There is no online booking system anywhere on the site.**

Premier is sold as *"by appointment only"* — and the only mechanism offered across all 17
pages is a phone number. Every enquiry outside trading hours is lost, across eleven branches.

This is the highest-value fix available, and it is why `lib/booking.ts` exists as a vendor
abstraction before a vendor has even been chosen. Until one is contracted, `/book` shows a
real working path (phone, per branch) rather than a "coming soon" box.

---

## 3. Real service menu

Both tiers, verbatim. Previously all placeholders in this repo.

| Service | Classic | Premier |
|---|---|---|
| The Godfather Cut | — | R490 |
| The Club Cut | R290 | R390 |
| Blade Fade Cut | R180 | R260 |
| Cut, Wash & Style | R190 | R260 |
| Gent's Cut | R160 | R220 |
| Hot-Towel Shave | R160 | R220 |
| Schoolboy Cut (under 13) | R140 | R160 |
| Pensioner Cut | R140 | R160 |
| Beard Trim / Shave | R100 | R120 |
| Wash & Style | R70 | R70 |
| Nose or Ear Wax | R70 | R70 |

The current site puts Classic and Premier on **two separate, unlinked pages** — you cannot
compare R290 against R390 without opening two tabs. The rebuild's tier toggle is the single
biggest UX win on the menu.

---

## 4. Group packages (Johnnie Walker tie-in)

| Package | Price | Min | Exclusive use |
|---|---|---|---|
| Johnnie Red | R450 pp | 3 | — |
| Johnnie Black | R650 pp | 4 | 2 hours |
| Johnnie Blue | On request | 4 | 5 hours |

At R450–R650 a head against R160 for a walk-in Gent's Cut, this is the highest-value product
Barber Club sells — and it is buried on a sub-menu page whose entire conversion mechanism is
an email address. It now gets a home-page block and its own route.

**⚠️ Discrepancy to resolve:** the site lists a Johnnie Walker **Black** Label bottle under the
**Johnnie Blue** package, identical to Johnnie Black. The only stated difference is 5 hours of
exclusive use instead of 2. Reproduced verbatim in `content/packages.ts`, but it reads like a
copy-paste error on the existing site.

---

## 5. Branch data

All 11 captured with full address, phone, email and per-day hours. Hours are **not** uniform:

- **Most branches:** Mon–Fri 08:00–17:30, Sat 08:00–14:00, Sun closed
- **Sunday trading:** Neelsie, Stelmark, Wellington, Malmesbury (08:00–14:00)
- **Paarl North Optenhorst is the outlier:** Mon–Fri 09:00–18:00, Sat 09:00–17:00, Sun 09:00–14:00

Every branch also publishes separate public-holiday hours.

---

## 6. Barber Club TV — a revenue line the site half-hides

An advertising product selling screen time in the shops.

| Term | Price (ex VAT) |
|---|---|
| 1 month | R3,000 |
| 3 months | R7,000 |
| 6 months | R12,000 |
| 12 months | R20,000 |

Claims: *"Exposure to 10 000 + clients monthly"*, *"15–20 minutes captive viewing time"*,
*"Only 20 advertisers max"*. Contact `john.mostert@barberclub.co.za`.

Out of scope for this build per the agreed scope, but worth a proper advertiser-facing page
later — it is B2B revenue sitting behind a link most visitors never see.

---

## 7. What the site does NOT say — client input required

These are gaps, not oversights on our side. Nothing has been invented to fill them.

| # | Gap | Why it matters |
|---|---|---|
| 1 | **Which branches are Classic vs Premier** | The tiers are described as concepts and never mapped. All 11 are `tier: "unconfirmed"` and render a visible "Tier TBC" badge. |
| 2 | **Service durations** | Not published anywhere. A booking engine cannot build a slot calendar without them. |
| 3 | **Barber names** | Not one named across 17 pages, despite selling "a legendary team". `content/barbers.ts` is deliberately empty. |
| 4 | **Branch coordinates** | None published. Maps fall back to address search; `geo` is omitted from schema rather than sent as `0,0` (a real place in the Atlantic). |
| 5 | **Cancellation / no-show policy** | None published. Needed before booking goes live. |
| 6 | **Payment methods** | Not published. |
| 7 | **Google Place IDs** | Needed per branch — each has its own profile and rating. |
| 8 | **WhatsApp number** | None published. `site.whatsapp.enabled` is `false`; the UI hides WhatsApp entirely rather than guessing the main line accepts it. |
| 9 | **Which branches can host groups** | Exclusive venue use implies not all 11 can. |
| 10 | **Legal entity name** | Needed for the POPIA notice. |

---

## 8. Conflicting source noted

A third-party aggregator listed Paarl Central (276 Main Road) with `john.mostert@` and
09:00–18:00 hours. The branch's own page says `operations@` and 08:00–17:30. **The branch page
was trusted.** Worth a spot-check — it may indicate a stale directory listing hurting NAP
consistency, which is a real local-ranking factor.

---

## 9. Structural problems with the current site

1. **No online booking**, while advertising appointment-only service. (§2)
2. **Tiers split across two unlinked pages** — no price comparison possible. (§3)
3. **No structured data on branch pages** — eleven local-SEO assets left on the table.
4. **No barbers named** — the strongest returning-customer CTA is entirely absent.
5. **Group bookings buried** — highest-value product, weakest funnel.
6. **No published policies** — cancellation, payment, or complaints.
7. **Branch pages are near-identical stubs** — no per-branch photography, schema, or reviews.
