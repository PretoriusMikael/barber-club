import { Star, ExternalLink } from "lucide-react";
import { site } from "@/content/site";
import { reviews } from "@/content/reviews";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";

/**
 * SECTION 07 — REVIEWS.
 *
 * Renders real Google reviews, or nothing at all.
 *
 * There is deliberately no path here that displays an invented testimonial or a
 * made-up star count: marking up an AggregateRating that no one gave you is a
 * structured-data violation and can earn a manual action in Search, which costs
 * far more than a missing section. The build-step panel that used to stand in
 * its place is gone too — the wiring is a job for us, not a message for a
 * customer. It is written up in PITCH-NOTES.md instead.
 *
 * For an 11-branch group this needs a PER-BRANCH fetch — each branch has its own
 * Google Business Profile, Place ID and rating. A single group-wide star count
 * would be both wrong and unrankable. Populate content/reviews.ts and flip
 * site.rating.verified, and this section, the hero star row and the
 * AggregateRating JSON-LD on every branch page all light up together.
 */
export function Reviews() {
  const live = site.rating.verified && reviews.length > 0;
  if (!live) return null;

  return (
    <Section id="reviews" tone="sunken">
      <Container>
        <SectionHeading
          title={`${site.rating.count} reviews. ${site.rating.value} stars. Zero stock photos.`}
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <figure
              key={review.id}
              className="surface flex h-full flex-col rounded border border-line bg-ink-raised p-6"
            >
              <div className="flex" aria-label={`${review.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className={
                      i < review.rating
                        ? "h-4 w-4 fill-brass text-brass"
                        : "h-4 w-4 text-bone-faint"
                    }
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-bone-dim">
                {review.text}
              </blockquote>
              <figcaption className="mt-5 text-xs text-bone-faint">
                {review.author} ·{" "}
                {new Date(review.date).toLocaleDateString("en-ZA", {
                  month: "long",
                  year: "numeric",
                })}
              </figcaption>
            </figure>
          ))}
        </div>
        {site.social.googleBusiness ? (
          <div className="mt-10">
            <ButtonLink href={site.social.googleBusiness} external variant="outline" size="lg">
              Read all reviews on Google
              <ExternalLink aria-hidden className="h-4 w-4" />
            </ButtonLink>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
