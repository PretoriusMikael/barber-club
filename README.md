# Barber Club — website

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Motion · React Three Fiber

Design system: [Watermelon UI](https://ui.watermelon.sh/) · [Motion Primitives](https://motion-primitives.com/) · Haikei-family SVG backgrounds

A rebuild of [barberclub.co.za](https://www.barberclub.co.za) with one job: **get the visitor
into a chair.**

- [FINDINGS.md](./FINDINGS.md) — full audit of the live site, and the ten gaps needing client input
- [BLUEPRINT.md](./BLUEPRINT.md) — strategy, copy, CTA and technical rationale
- [PITCH-NOTES.md](./PITCH-NOTES.md) — **client-facing.** What was taken off the screen before the
  preview went out, the full photography and video shot list, and everything we still need from
  Barber Club. This is the document that goes in the email

---

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type errors fail the build on purpose
npm run lint
```

Runs today with **no accounts, no API keys and no database.**

**Missing photography renders nothing.** `AssetFrame` returns `null` without a `src`, and every
layout is built to stand up without its picture (see `ServiceCard`). The dashed "SHOT NEEDED"
tiles that used to advertise the asset gap in the running site are gone — they were a build tool,
and the site is now shown to the client. The briefs themselves are untouched, still sitting beside
every asset in `app/content/`, and collected for the client in
[PITCH-NOTES.md](./PITCH-NOTES.md). Fill in a `src` and the picture appears; nothing else changes.

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

- `ScissorModel.tsx` — fully procedural geometry and `MeshPhysicalMaterial` with anisotropy.
  Blades are bevelled `ExtrudeGeometry` from a 2D profile; a separate near-mirror ribbon along
  the cutting edge is the honed bevel, and it is what makes the blade read as sharp rather than
  as a flat metal leaf. Shanks are `TubeGeometry` along a Catmull-Rom curve, brass rings are
  tori placed on the shank's exit tangent, plus a finger tang and a slotted screw. No glTF, no
  Draco, no downloaded textures, nothing to commission.
- `scissorTextures.ts` — canvas-generated brushed-metal roughness and normal maps, from a
  seeded PRNG so they are deterministic. Constant roughness gives a featureless mirror;
  directional grind marks are most of what tells the eye "metal".
- `scissorEnvironment.ts` — a purpose-built studio lightbox (two tall strip softboxes, a broad
  key, a brass kicker, a floor bounce) PMREM'd once at startup. This is the single biggest
  factor in how the model reads: at `metalness: 1` a surface is a mirror, so the environment
  does nearly all the work and direct lights barely register. three's stock `RoomEnvironment`
  is a generic grey room, and metal lit by it looks like generic grey metal.
- `scissorPose.ts` — the single rest pose plus the cut constants. Tune position, scale and cut
  timing here.
- `ScissorScene.tsx` — lighting and the cut animation.
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

### Corner radius

The site was square-cornered throughout. It is now built on **one number: 12px**, defined in
`globals.css` `@theme` as `--radius` and used as the bare `rounded` utility — cards, buttons,
inputs, media frames, panels, the mobile thumb bar, the lightbox trigger.

Two supporting steps exist for nesting maths, not for variety:

| Token | Utility | Value | For |
|---|---|---|---|
| `--radius-sm` | `rounded-sm` | 8px | drawn INSIDE a 12px box — a badge on a card, a tab in a segmented control. A child that repeats its parent's radius looks concentric and wrong; the inner curve wants to be tighter |
| `--radius` | `rounded` | **12px** | the house standard. Everything, unless there is a reason |
| `--radius-lg` | `rounded-lg` | 20px | surfaces big enough that 12px reads as a square corner — full-bleed photographic frames, the branch map, dialogs |

`--radius-md` is pointed at 12px too, so the shadcn-registry accordion stays in step without
being forked. Anything genuinely circular (the open/closed dot, the progress rail) keeps
`rounded-full`. **Nothing else may invent a radius.**

Two things deliberately keep square corners: **full-bleed bands** (`PhotoBand`, `FinalCta`,
`TrustBar`, the sticky bar's outer edge), because a rounded corner needs a gap outside it to
read as a corner at all; and the **focus ring**, which now inherits each element's own shape
instead of forcing `border-radius: 2px` and visibly reshaping every card the moment it was
tabbed to.

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

### Two Framer-style sections

**`StoryBento.tsx`** — the Our Story section as a bento grid. It replaced a two-column text
block sitting beside a decorative barber pole, which was the weakest-looking part of the page:
prose on the left, dead space on the right. Six tiles, every one a real fact from
barberclub.co.za — trading since December 2017, eleven branches, coffee/music/Wi-Fi,
walk-in friendly, Instagram. Three of them are links, so the grid does navigational work too.
12px corners, like everything else — see **Corner radius** below. A bento grid is the one
layout where the radius does structural work: it is what separates nine adjacent panels into
nine objects rather than one gridded surface with lines drawn on it.

**`TierScroll.tsx`** — Classic vs Premier as a pinned scroll comparison. The Services grid
answers *what does it cost*; it cannot answer *which one is for me*, because the real
difference is walk-in versus appointment and time in the chair. The live site never explains
that anywhere.

Two decisions worth keeping:

- **The desktop/mobile split is CSS, not JavaScript.** Pinning needs a viewport tall enough to
  hold a panel, which a phone does not have. A JS media query was tried and rejected: the
  server cannot know the viewport, so the page would render one layout and swap on hydration —
  a large, avoidable layout shift. Both layouts are in the markup and CSS picks one.
  `display: none` removes the hidden branch from the accessibility tree as well, so screen
  readers never hear the content twice.
- **The price range is computed over the showcased services, not the whole menu.** Over the
  full menu Classic would read "R70 to R290" — R70 being a nose wax. True, and misleading as a
  headline for a haircut.

Under `prefers-reduced-motion` the pinned branch is not rendered at all: a section that only
advances when you scroll is a trap for anyone who asked for less movement.

---

## Measured

Production build (`next build` + `next start`), encoded transfer size, measured over CDP on a
390px mobile viewport. **Initial JS** is parser-inserted script only — Next's link prefetching
adds another 40–90 KB per route *after* load, at low priority, and is excluded here because it
is not on anyone's critical path.

| Route | Initial JS | Was | |
|---|---|---|---|
| `/legal/*` | **151 KB** | 199 KB | −48 KB |
| `/book` | **153 KB** | 201 KB | −48 KB |
| `/branches` | **160 KB** | 207 KB | −47 KB |
| `/services` | **211 KB** | 213 KB | motion still needed |
| `/gallery` | **212 KB** | 210 KB | motion still needed |
| `/` | **234 KB** | 230 KB | motion still needed; +2 KB for `CutSequence` |

| Other | Target | Result |
|---|---|---|
| three.js on first load | none | **not loaded on mobile** (228 KB, desktop only, deferred) ✅ |
| Routes prerendered | — | **25/25 static** ✅ |
| ESLint | clean | **clean** ✅ |
| TypeScript | clean | **clean** ✅ |
| Invented data in JSON-LD | none | **none** ✅ |

### Where the bytes actually are

The instructive number is `/legal/terms`: a page with **no client components of its own** was
loading 199 KB. Almost none of the weight belongs to any individual page — the home page's own
client code is about 30 KB on top of a shared floor, and `/branches`'s is about 8 KB. So
"server-render the branch cards" was investigated and **rejected**: the measurable saving was
low single-digit KB against a CSS-filtering hack, because `BranchCard` needs the client anyway
for its live open/closed badge and its click tracking.

The floor was the whole story, and `motion` was ~49 KB of it — on **every** route, because two
things reached it from the shared layout:

1. **`ui/Section.tsx` imports `Reveal`**, so anything using `<Container>` — including both
   legal pages — pulled the animation library in for a `<div>` with padding.
2. **`Header` renders `ScrollProgress`**, a 1px decorative hairline, and the header is in the
   root layout.

Both are fixed. `Reveal` is now CSS transitions plus one shared IntersectionObserver (see
`components/ui/Reveal.tsx` and the `[data-reveal]` block in `globals.css`), and
`ScrollProgress` is `next/dynamic({ ssr: false })`. Pages that genuinely animate — the hero
parallax, the pinned tier comparison, the gallery lightbox, the price count-up — still load
motion and always will. Pages that only ever wanted a fade no longer do.

### What is left on the animated routes

Home is 232 KB and the remaining consumers all earn it: hero parallax and the word-by-word
headline, `TierScroll`'s pinned comparison, the gallery's column parallax and morphing
lightbox, the trust-bar marquee. If the budget ever has to win outright, the lever is Motion's
`LazyMotion` + `m` components (~15 KB core, features loaded after first paint) — the catch
being that motion-primitives components import `motion.*` directly and throw under
`LazyMotion strict`, so it means forking each one and re-forking on every upstream update.

### The video layer, and what it costs whom

Two decorative motion moments, both opt-in per device (`lib/motion.ts`,
`canPlayHeroLoop` / `canScrubSequence`). Total page transfer on `/`, measured over CDP:

| Context | Hero loop | Scroll frames | Page total |
|---|---|---|---|
| Desktop 1440 | 87 KB | 568 KB | **1,289 KB** |
| Tablet 800 | 87 KB | — | **787 KB** |
| Phone 390 | — | — | **628 KB** |
| `prefers-reduced-motion` | — | — | **691 KB** |
| Data Saver, or 2G/3G | — | — | **493 KB** |

The gates are the design, not a safety net bolted on afterwards. A phone downloads none of
it and sees the photograph, which is the same thing it saw before any of this existed.

Two decisions worth keeping:

- **The hero photograph stays the LCP element on every device.** The loop layers *over* it
  and crossfades in on `canplay`. The obvious build — `video ? <video/> : <Image/>` — makes
  the video the LCP element wherever there is one, which is exactly the trade the hero's
  performance contract forbids. It also means the photograph is the poster, so there is no
  second file and no chance of the two drifting out of grade.
- **The scrub is a frame sequence, not a video.** Scroll-scrubbing `currentTime` seeks to
  the nearest keyframe and stalls on mobile Safari. All-intra H.264 fixes the seeking and
  measured **1,956 KB** against **568 KB** for 48 WebP frames. Frames also decode
  independently, so a half-loaded sequence still scrubs.

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
- [x] ~~Add `/public/og.jpg` (1200×630)~~ — replaced by `app/opengraph-image.tsx`, generated at
      build time from the brand tokens. `app/icon.tsx` does the same for the favicon, which was
      a 404
- [ ] Legal review of both `/legal` pages; register an Information Officer (POPIA)
- [ ] Cookie consent gating GA4
- [ ] Optimise all 11 Google Business Profiles; enable Reserve with Google
- [ ] 301 map from the current Wix URLs (`/paarl-central-276main-road` →
      `/branches/paarl-central`, etc.)
- [ ] Spot-check directory listings for NAP drift (see FINDINGS §8)
