# Barber Club — planning blueprint

The strategy the code implements. Section numbers are the ones referenced from code comments.

**Superseded assumptions:** this document originally assumed a single neighbourhood shop. The
audit in [FINDINGS.md](./FINDINGS.md) established that Barber Club is an **11-branch Cape
Winelands group** with two service tiers and a group-events business, trading since December
2017. Everything below reflects that. Business facts are real and sourced; anything the live
site does not publish is listed in FINDINGS §7 as a gap, not filled in with a guess.

---

## §1 The core argument

A barber website is a **transactional utility disguised as a brand site**. Most visitors arrive
already intending to book, on a phone, often on mobile data, and want four things confirmed in
under 15 seconds: *are you good, where are you, what does it cost, can I book right now.*

For an eleven-branch group there is a fifth: **which one is nearest me.**

Visual ambition belongs **around** that path, never in front of it. Where speed and spectacle
conflict, **speed wins** — enforced in code (`lib/motion.ts`), not just stated here.

### What visitors look for, in priority order

1. **Proof of skill** — photos of real cuts on real clients. Stock is detected instantly.
2. **"Is this for people like me?"** — hair type and style range in the gallery.
3. **Which branch, and is it open now** — the multi-location tax.
4. **Price certainty** — Barber Club already publishes prices; keep that.
5. **Availability** — "there is a 14:30 on Thursday" beats a phone number.
6. **Social proof** — a rating shown as a number.

### The journey

```
Google / Instagram / Maps
   ↓ Hero (0–6s)     who, where, since when, book
   ↓ Proof (6–20s)   tier comparison + real prices, gallery
   ↓ Trust (20–40s)  story, barbers, reviews
   ↓ Friction kill   which branch, open now, directions, phone
   ↓ BOOK            walk in (Classic) or appointment (Premier)
```

Two rules fall out:

- **The booking CTA is never more than one thumb-reach away** at any scroll position.
- **Every section answers one objection and ends with a CTA.** No section exists purely to look
  good.

---

## §2 Sitemap

```
/                       Home — long-form scroll (primary conversion surface)
/services               Tiered menu with Classic ↔ Premier toggle + FAQ
/branches               All 11, filterable by town
/branches/[slug]        ×11, prerendered — the local-SEO workhorses
/groups                 Groomsmen, groups & special events
/gallery                Filterable portfolio
/book                   Booking only (noindex)
/legal/privacy          POPIA notice
/legal/terms            Booking, cancellation, no-show policy
```

**Dropped from the original plan:** `/contact` (superseded by `/branches` — with eleven
locations a single contact page is actively unhelpful) and `/team` (a thin page while the
roster is empty; the Team section still renders on Home).

**Phase 2:** `/advertise` for Barber Club TV — real B2B revenue currently behind a link most
visitors never see (FINDINGS §6).

---

## §3 Copy and assets

Voice: **confident, plain, unfussy.** Short declaratives. Craft language, not luxury language.

The brand's own copy is kept verbatim where it already works — "MORE THAN A CUT. WELCOME TO THE
CLUB.", "It is the place where you belong", and the founding story. It is good, it is in
market, and it carries recognition. Rewriting working brand language for its own sake is
vandalism.

| # | Section | Headline | Job |
|---|---|---|---|
| 01 | Hero | *More than a cut. Welcome to the Club.* | Who, where, 11 branches, book |
| 02 | Trust bar | walk-in · 11 branches · coffee · Wi-Fi · schoolboy cuts | Kill 5 objections in one viewport |
| 03 | Services | *Two ways to sit down.* | The tier comparison the current site cannot do |
| 04 | Our Story | *It is the place where you belong.* | Differentiate + the 3D moment |
| 05 | Gallery | *The work speaks. Scroll it.* | **Proof of skill** |
| 06 | Team | *Book a barber, not a slot.* | Currently an honest gap panel |
| 07 | Groups | *Bring the whole wedding party.* | Highest-value product, surfaced |
| 08 | Reviews | — | Third-party proof, gated on real data |
| 09 | Branches | *Eleven chairs' worth of Winelands.* | Friction elimination |
| 10 | Final CTA | *The chair's ready when you are.* | Split: walk-in vs appointment |

### The photography is the project

Commission a **half-day photo shoot (60+ usable frames)** and a **half-day video shoot**,
**across multiple branches** — an eleven-branch group photographed entirely in one shop looks
like one shop. Casting must cover a genuine range of hair textures and skin tones. Shoot the
coffee, music and Wi-Fi too: the brand's own copy sells them.

> A technically flawless site with weak photography will underperform a mediocre site with
> excellent photography, every time.

---

## §4 CTA strategy

| Tier | Action | Placement |
|---|---|---|
| Primary | **Book** | Hero, header, sticky bar, after most sections, final CTA |
| Primary | **Find your branch** | Hero, story, final CTA — the walk-in equivalent of booking |
| Secondary | Call | Sticky bar, every branch card and page |
| Secondary | Directions | Branch cards and pages — high intent, precedes a walk-in |
| Secondary | Group enquiry | Groups section and page |
| Tertiary | Instagram | Gallery, footer |

`brass` (`#c8a35a`) is **reserved for booking**. Nothing else may use it, or the eye stops
treating it as "the button that books".

### Booking integration

**The live site has no online booking at all**, while advertising appointment-only Premier
service (FINDINGS §2). This is the highest-value fix in the project.

**Deep-link, don't iframe.** The only embed is on `/book`, lazily mounted with reserved height.

Score vendors against these — do not pick on brand recognition:

- [ ] **Multi-location support** — non-negotiable at 11 branches
- [ ] Confirmed availability and support in South Africa
- [ ] **Staff-level deep links** (`?employee=…`) — powers "Book with [name]"
- [ ] ZAR support + local gateway for deposits (Payfast, Yoco, Peach)
- [ ] Automated **WhatsApp/SMS reminders** — the biggest no-show lever
- [ ] **Reserve with Google** — captures demand that never reaches the website
- [ ] Conversion webhook or `postMessage`, so bookings reach GA4

Shortlist: **Fresha**, **Setmore**, **Acuity**, **Timely**, **Booksy** (verify SA coverage).
**Squire is US-focused** and likely a poor fit. Confirm regional availability and pricing with
each vendor directly rather than trusting this document.

---

## §5 Technical decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Static shell, RSC, image pipeline |
| Hosting | Vercel | Edge network, preview deploys, ISR |
| Content | Typed TS in `app/content/` | Runs with no accounts; CMS swap is a data-layer change |
| Styling | Tailwind v4 | ⚠️ `@import "tailwindcss"`, **not** v3 `@tailwind` directives |
| Motion | GSAP + ScrollTrigger | Dynamically imported *inside* the effect, never at module scope |
| 3D | React Three Fiber | Procedural scene, triple-gated, hard CSS fallback |
| Video | Mux / Cloudflare Stream | Adaptive bitrate matters on SA mobile networks |
| Analytics | GA4 via `lib/analytics.ts` | Per-placement **and per-branch** attribution |

**Why not the `my-base-system` template:** its Prisma/NextAuth/payments/blog modules are dead
weight for a brochure site, and its `booking` module is an internal DB-backed form where this
build deep-links to an external vendor.

### Performance budget

| Metric | Target | Status |
|---|---|---|
| Initial JS on `/` | < 200 KB gz | **198 KB** ⚠️ ~2 KB headroom |
| Initial JS on `/branches`, `/services` | < 200 KB gz | **186 KB** ✅ |
| three.js on first load | none | **deferred** ✅ |
| LCP (mobile 4G) | < 2.0s | ⏳ needs a deployment with real images |
| INP | < 200ms | ⏳ |
| CLS | < 0.05 | explicit aspect ratios everywhere |
| Lighthouse mobile | ≥ 90 | ⏳ |

When home breaches 200 KB: `Branches` and `Groups` are client components only for their
filter/toggle — split the control out and server-render the cards.

The trap: award-style 3D barber sites routinely score in the 30s on mobile Lighthouse. On South
African mobile data that is a conversion catastrophe.

### Local SEO

1. **Eleven Google Business Profiles matter more than the website.** Complete every field, 20+
   photos each, messaging on, holiday hours, weekly posts.
2. **NAP consistency** — byte-for-byte across GBP, branch pages, schema and directories. See
   FINDINGS §8 for evidence of existing drift.
3. **Schema** — one `Organization` + eleven `HairSalon` blocks linked by `@id`. `OfferCatalog`
   per tier on `/services`. `FAQPage`. `BreadcrumbList`. `AggregateRating` only when verified.
4. **Title pattern** — `Barber Shop in [Town] | [Branch] | Barber Club`
5. **301 map** from the current Wix URLs to the new branch routes.

### Compliance

POPIA privacy notice, registered Information Officer, cookie consent gating GA4, published
booking terms. The legal pages in this repo are **drafts requiring review**, not legal advice.

---

## §6 Measurement

**Primary KPI:** `booking_complete ÷ unique sessions`.

Events in `lib/analytics.ts` carry `branch` on almost everything — "which branches convert
online and which do not" is the question that decides where marketing spend goes, and it cannot
be answered retrospectively.

This instrumentation also exists to answer one question honestly: **does the 3D section help or
hurt?** Compare booking rates for sessions that fired `craft_section_view` against those that
did not, and be prepared to cut it if the data says so.

---

## §7 Build phases

| Phase | Scope | Gate |
|---|---|---|
| 0 — Discovery | Close the ten gaps in FINDINGS §7; contract a booking vendor | No design work until the gap list is empty |
| 1 — **Content** | Photo + video shoot across multiple branches | **Critical path — start immediately, in parallel** |
| 2 — Design | Figma, mobile-first, motion spec per section | Mobile signed off before desktop |
| 3 — Build | Shell → content → sections → booking → schema | Lighthouse ≥ 90 mobile per merge |
| 4 — 3D layer | Story section; fallback built *first* | Must not regress Phase 3 scores |
| 5 — Launch | 11 GBPs, Reserve with Google, analytics QA, 301s from Wix | End-to-end booking test on 3 real devices |
| 6 — Iterate | A/B hero and CTA copy; monthly gallery refresh | Monthly review of booking rate per branch |

Phase 1 is the bottleneck and the most commonly underestimated item.

---

## §8 Open questions

1. Which branches are Classic and which are Premier (blocks tier UI and booking routing)
2. Booking vendor — multi-location support is the gating criterion
3. Brand assets — existing logo files, or is identity refresh in scope?
4. Who edits the site after launch, and how technical are they? (decides whether the typed-TS
   content layer should become a real CMS)
5. Is Barber Club TV in scope as a proper advertiser-facing page?
