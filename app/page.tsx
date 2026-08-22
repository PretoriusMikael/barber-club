import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { Services } from "@/components/sections/Services";
import { TierScroll } from "@/components/sections/TierScroll";
import { StoryBento } from "@/components/sections/StoryBento";
import { Gallery } from "@/components/sections/Gallery";
import { Team } from "@/components/sections/Team";
import { Groups } from "@/components/sections/Groups";
import { Reviews } from "@/components/sections/Reviews";
import { Branches } from "@/components/sections/Branches";
import { FinalCta } from "@/components/sections/FinalCta";

/**
 * HOME — the primary conversion surface.
 *
 * Section order is the user journey from BLUEPRINT.md, adjusted for what Barber
 * Club actually is: an 11-branch group with two tiers, not one shop.
 *
 *   Hero      who, where, since when, book — inside 6 seconds
 *   TrustBar  five objections killed in one viewport height
 *   Services  the tiered menu with real prices
 *   TierScroll  pinned comparison — which chair is for you, not just what it costs
 *   Story     "Our Story" as a bento grid of real facts
 *   Gallery   proof of skill (the strongest asset on the site)
 *   Team      currently an honest gap panel — no invented barbers
 *   Groups    the highest-value product, surfaced instead of buried
 *   Reviews   third-party proof, gated on real Google data
 *   Branches  friction elimination: which of the eleven, and is it open now
 *   FinalCta  last ask, split walk-in vs appointment
 *
 * Every section ends with a path to booking or a branch. If you add one that
 * does not, it does not belong on this page.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Services />
      <TierScroll />
      <StoryBento />
      <Gallery />
      <Team />
      <Groups compact />
      <Reviews />
      <Branches limit={6} />
      <FinalCta />
    </>
  );
}
