# Barber Club — website

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Motion · React Three Fiber

Design system: [Watermelon UI](https://ui.watermelon.sh/) · [Motion Primitives](https://motion-primitives.com/) · Haikei-family SVG backgrounds

A rebuild of [barberclub.co.za](https://www.barberclub.co.za) with one job: **get the visitor
into a chair.**

- [FINDINGS.md](./FINDINGS.md) — full audit of the live site, and the ten gaps needing client input
- [BLUEPRINT.md](./BLUEPRINT.md) — strategy, copy, CTA and technical rationale

---

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type errors fail the build on purpose
npm run lint
```

Runs today with **no accounts, no API keys and no database.** Missing photography renders as
labelled placeholder tiles carrying the shot brief, so the asset gap stays visible in the
running site.

---

## What this is modelling

**Not** a single neighbourhood shop — an **11-branch Cape Winelands group**, trading since
December 2017, with two service tiers:

- **Classic** — walk-in, no appointment, sharper price
- **Premier** — appointment only, the complete grooming experience

Plus a group/groomsmen events business (Johnnie Red / Black / Blue).

### Routes

```
/                      Home — 10-section scroll
/services              Tiered menu, Classic ↔ Premier toggle, FAQ
/branches              All 11, filterable by town
/branches/[slug]       ×11, prerendered — the local-SEO workhorses
/groups                Groomsmen & group packages
/gallery               Filterable portfolio
/book                  Booking (single-purpose page)
/legal/{privacy,terms} POPIA + booking terms (drafts)
```

---

## Where the content lives

Typed TS under `app/content/`. One source of truth, no CMS needed to run it, shaped so a
Sanity swap is a data-layer change only.

| File | Holds |
|---|---|
| `content/site.ts` | Brand facts, story copy, contacts, socials, booking vendor config |
| `content/branches.ts` | All 11 branches: address, phone, per-day hours, tier |
| `content/services.ts` | Tiered menu with real published prices |
| `content/packages.ts` | Group/groomsmen packages |
| `content/gallery.ts` | Portfolio + hero video briefs |
| `content/barbers.ts` | **Empty by design** — see below |
| `content/reviews.ts` | **Empty by design** — see below |
| `content/faq.ts` | FAQ, rendered as copy *and* FAQPage JSON-LD |

### Real data vs. gaps

Everything scraped from the live site is **real and verbatim** — prices, addresses, hours,
phone numbers, brand story. Anything the site does not publish is marked `CONFIRM:` and
rendered honestly rather than invented:

- **`barbers.ts` is empty.** The live site names not one barber across 17 pages. The Team
  section renders a gap panel explaining the missed opportunity instead of fake people.
- **`reviews.ts` is empty.** `AggregateRating` JSON-LD is gated behind `site.rating.verified`.
  Marking up invented ratings risks a Search manual action.
- **Branch tiers are all `"unconfirmed"`** and render a visible "Tier TBC" badge — the site
  describes Classic and Premier but never maps branches to them.
- **`geo` is `null` everywhere.** Maps fall back to address search and schema omits `geo`
  rather than emitting `0,0`, which is a real location in the Atlantic.
- **WhatsApp is disabled.** No number is published; the UI hides the channel entirely rather
  than guessing the main line accepts it.

---

## Architecture notes

**Booking is abstracted.** The live site has *no online booking at all* despite advertising
appointment-only Premier service — the biggest conversion gap found. Every CTA routes through
`lib/booking.ts`, so contracting a vendor is an edit to the `booking` object in
`content/site.ts` and nothing else. Until then `/book` shows a real working path (phone, per
branch), not a "coming soon" box.

Pattern is **deep-link, don't iframe**. The only embed is on `/book`, lazily mounted with
reserved height. A vendor iframe in the hero would wreck LCP and INP.

**Multi-location schema.** One `Organization` for the brand, one `HairSalon` per branch linked
back to it via `@id`. Emitting a single `LocalBusiness` for a chain gives Google one entity to
rank instead of eleven — a common and costly mistake.

### The hero scissor

A small polished-steel-and-brass hair scissor sits in the top right of the hero. It holds one
pose, **snaps shut exactly once** as the user starts scrolling away, and is then completely
static — scrolling out of frame with the rest of the hero. It is the only 3D on the site.

`app/components/three/`:

- `ScissorModel.tsx` — fully procedural geometry. Blades are bevelled `ExtrudeGeometry` from a
  2D profile (the bevel is what makes it read as ground steel rather than a flat cutout),
  shanks are `TubeGeometry` along a Catmull-Rom curve, brass rings are tori placed on the
  shank's exit tangent so they join flush. No glTF, no Draco, no textures, nothing to commission.
- `scissorPose.ts` — the single rest pose plus the cut constants. Tune position, scale and cut
  timing here.
- `ScissorScene.tsx` — lighting, the cut animation, and a procedural `RoomEnvironment` PMREM.
  Polished metal needs something to reflect: at `metalness: 1` with no environment it renders
  **black**.
- `HeroScissor.tsx` — the mount gate.

**It renders on demand, not continuously.** `frameloop` is `"demand"` except for the ~0.8s the
cut is actually moving, so across a whole visit the GPU does roughly thirty frames of work
instead of running a 60fps loop forever. The cut trigger arrives as a **prop**, not a ref polled
inside `useFrame` — in demand mode `useFrame` is not called unless a render is requested, so a
self-polled ref would never fire.

**This is the one place WebGL could hurt LCP.** Mitigations:

1. The hero's LCP element is the poster image — the canvas is transparent and additive, and the
   hero renders complete with no 3D at all.
2. The scene mounts on `requestIdleCallback` **after first paint**.
3. `canRender3D()` still applies — nothing on low-end devices, `saveData`, 2G/3G, or
   `prefers-reduced-motion`.
4. `aria-hidden`, `pointer-events: none` — never an obstacle for keyboard or AT users.
5. Landing below the hero (refresh mid-page, `#anchor` link) starts the blades already closed
   rather than replaying a cut nobody saw.

Verified: three.js is **not** in the first load, the server HTML contains no canvas, and no
scissor code ships on any route but `/`.

The story section's old barber-pole canvas was removed — a second WebGL context for a
decorative pole was not worth its cost. Its pure-CSS replacement is permanent, not a fallback.

**Content is never hidden behind JS.** Motion writes `opacity: 0` inline during SSR, so a
failed hydration would otherwise leave a blank page. The `.no-js [data-reveal]` rule in
`globals.css` uses `!important`, which beats a non-important inline style and forces every
revealed block visible. Reduced motion is guarded in JS too (`useReducedMotion`), because
motion animates via rAF and the CSS media query alone cannot stop it.

---

## Design system

Three open-source libraries, integrated from real source — nothing reimplemented from
screenshots.

### Watermelon UI — `app/components/watermelon/`

shadcn-registry components (React 19 + Tailwind v4 + Radix). Pulled from the real registry
at `https://registry.watermelon.sh/r/<name>.json`.

- **Accordion** → the `/services` FAQ, replacing a `<dl>` that showed all twelve answers at
  once. The reason to take the dependency rather than hand-roll a toggle is that Radix gets
  the semantics right for free: button/region association, `aria-expanded`, and full keyboard
  support.

Watermelon components reference shadcn's token names (`text-muted-foreground`, `ring`), which
do not exist in this project's Tailwind v4 theme — those classes would simply not be generated
and the component would render unstyled. `globals.css` now carries a **shadcn-registry bridge**
in `@theme` mapping those names onto the Barber Club palette, so registry components drop in
and inherit the brand instead of being forked.

### Motion Primitives — `app/components/motion-primitives/`

Copy-paste components pulled from the upstream repo (`ibelick/motion-primitives`). `motion`
replaces GSAP as the single animation engine — gsap was removed rather than ship two libraries
that do the same job.

| Component | Used for |
|---|---|
| `in-view` | Every scroll reveal (via `ui/Reveal`) |
| `text-effect` | Hero headline, revealed per word |
| `animated-number` | Prices — they count when you toggle Classic ↔ Premier |
| `infinite-slider` | Trust bar marquee |
| `morphing-dialog` | Gallery lightbox |
| `glow-effect` | The one highlighted group package |

**Two upstream defects had to be fixed**, not worked around:

1. Upstream targets Framer Motion **v11 on React 18**. On motion v13 + React 19, `motion[tag]`
   dynamic indexing is gone and the global `JSX` namespace moved to `React.JSX`, so
   `keyof JSX.IntrinsicElements` no longer resolves.
2. More seriously, several components called `motion.create()` **during render**. That returns
   a new component type every call, and React treats a new type as a different component — so
   the subtree unmounts and remounts, losing state and restarting animations. `useMemo` only
   papers over it.

Both are fixed by `create-motion.ts`, which builds the motion components **once at module
scope** and turns the call sites into plain registry lookups. `morphing-dialog` also had a
`setState`-inside-`useEffect` portal guard, replaced with `useSyncExternalStore`.

The gallery lightbox swap fixed two **real accessibility bugs** in the hand-rolled modal it
replaced: no Escape handler, and no focus trap or focus restore, so keyboard users tabbed
straight out of the open dialog and could not get back.

### Haikei — `app/components/backgrounds/Haikei.tsx`

⚠️ **Provenance, stated plainly:** Haikei is a browser-only GUI generator. No npm package, no
API, no programmatic export — you download SVGs from its web app by hand. These are therefore
**not Haikei exports**. They are hand-authored SVGs in the same generator families Haikei
offers, coloured from the brand palette, and built as drop-in replacement targets: generate the
real thing in Haikei and paste it over the `<svg>` body.

`LayeredWaves` (hero → trust bar seam) · `BlurryGradient` (final CTA) · `LowPolyGrid` (story
stage) · `BlobScene` (group packages). All inline, all decorative (`aria-hidden`), no network
requests, and all geometry static — the low-poly mesh uses a fixed jitter table rather than
`Math.random()`, which would differ between server and client render.

---

## Measured

Production build (`next build` + `next start`), gzipped:

| Route | Initial JS | |
|---|---|---|
| `/` | **256 KB** | ⚠️ over |
| `/services` | **240 KB** | ⚠️ over |
| `/gallery` | **236 KB** | ⚠️ over |
| `/groups` | **228 KB** | ⚠️ over |
| `/branches` | **185 KB** | ✅ |

| Other | Target | Result |
|---|---|---|
| three.js on first load | none | **not loaded** (225 KB deferred) ✅ |
| Routes prerendered | — | **23/23 static** ✅ |
| ESLint | clean | **clean** ✅ |
| TypeScript | clean | **clean** ✅ |
| Invented data in JSON-LD | none | **none** ✅ |

### ⚠️ The animation libraries broke the 200 KB budget

Home went **198 KB → 256 KB**. Attributed precisely: **`motion` is 64 KB gz** across three
chunks. That is the entire overage — nothing else regressed.

This is a genuine conflict, not an oversight. The 200 KB budget was set for a lean brochure
site on South African mobile data. Adopting a Framer-Motion-based component library puts a
64 KB animation engine on the critical path of any page that animates above the fold — here,
the hero headline and the trust-bar marquee. Both goals cannot be met at once.

**The lever, if the budget matters more than the motion:** Framer's `LazyMotion` + `m`
components cut the core to roughly 15 KB and load the feature bundle after first paint. The
catch is that motion-primitives components import `motion.*` directly, which throws under
`LazyMotion strict` — so taking it means forking every component to use `m.*`, and re-forking
on every upstream update.

Cheaper partial options, in order of value for effort:

1. Drop `TextEffect` from the hero and the marquee from the trust bar. That pulls motion off
   the *above-the-fold* path, though it stays in the page bundle.
2. Defer the gallery lightbox until first click, so the layout-projection engine is never in
   the first load.
3. Accept 256 KB on animated routes and keep `/branches`-style pages lean.

**Not yet measured:** LCP, INP, CLS — those need a real deployment with real images.

## Before launch

Client input needed (see [FINDINGS.md §7](./FINDINGS.md)):

- [ ] **Which branches are Classic vs Premier**
- [ ] Service durations (a booking engine cannot build a calendar without them)
- [ ] Barber roster: names, home branch, speciality, one quote each, portraits
- [ ] Branch coordinates (Maps → right-click pin → copy coordinates)
- [ ] Cancellation / no-show policy, payment methods, legal entity name
- [ ] Google Place ID per branch
- [ ] Whether 073 050 6637 accepts WhatsApp
- [ ] Which branches can host group bookings
- [ ] Resolve the Johnnie Blue / Black Label discrepancy

Build work:

- [ ] Choose a booking vendor — **multi-location support is non-negotiable**
- [ ] Lock the `postMessage` origin check in `BookingEmbed.tsx`
- [ ] Photo + video shoot **across multiple branches** (critical path)
- [ ] Wire Google Places per branch, then flip `site.rating.verified`
- [ ] Add `/public/og.jpg` (1200×630)
- [ ] Legal review of both `/legal` pages; register an Information Officer (POPIA)
- [ ] Cookie consent gating GA4
- [ ] Optimise all 11 Google Business Profiles; enable Reserve with Google
- [ ] 301 map from the current Wix URLs (`/paarl-central-276main-road` →
      `/branches/paarl-central`, etc.)
- [ ] Spot-check directory listings for NAP drift (see FINDINGS §8)
