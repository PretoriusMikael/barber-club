import { Star, ExternalLink } from "lucide-react";
import { site } from "@/content/site";
import { branches } from "@/content/branches";
import { reviews } from "@/content/reviews";
import { Section, Container, SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";

/**
 * SECTION 07 — REVIEWS.
 *
 * Renders real Google reviews or an honest "not wired up yet" panel. There is
 * deliberately no path here that displays an invented testimonial or a made-up
 * star count.
 *
 * For an 11-branch group this needs a PER-BRANCH fetch — each branch has its own
 * Google Business Profile, Place ID and rating. A single group-wide star count
 * would be both wrong and unrankable.
 */
export function Reviews() {
  const live = site.rating.verified && reviews.length > 0;

  return (
    <Section id="reviews" tone="sunken">
      <Container>
        {live ? (
          <>
            <SectionHeading
              title={`${site.rating.count} reviews. ${site.rating.value} stars. Zero stock photos.`}
            />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {reviews.slice(0, 3).map((review) => (
                <figure
                  key={review.id}
                  className="flex h-full flex-col border border-line bg-ink-raised p-6"
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
          </>
        ) : (
          <PendingReviews />
        )}
      </Container>
    </Section>
  );
}

function PendingReviews() {
  return (
    <div className="border border-dashed border-bone/20 bg-ink-raised p-8 md:p-12">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-brass-dim">Build step</p>
      <h2 className="max-w-2xl text-3xl leading-tight md:text-4xl">
        Reviews stay empty until Google is connected.
      </h2>
      <div className="mt-6 max-w-2xl space-y-3 text-sm leading-relaxed text-bone-dim">
        <p>
          No placeholder testimonials are rendered. Marking up an invented
          AggregateRating is a structured-data violation and can earn a manual action in
          Search — which costs far more than an empty section.
        </p>
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>
            Get a Place ID for <strong className="text-bone">each of the {branches.length} branches</strong> — they
            have separate Google Business Profiles and separate ratings.
          </li>
          <li>
            Fetch Place Details server-side (<code className="text-bone">rating</code>,{" "}
            <code className="text-bone">user_ratings_total</code>,{" "}
            <code className="text-bone">reviews</code>).
          </li>
          <li>
            Cache with ISR: <code className="text-bone">export const revalidate = 86400</code>.
          </li>
          <li>
            Populate <code className="text-bone">content/reviews.ts</code> and set{" "}
            <code className="text-bone">site.rating.verified = true</code>.
          </li>
        </ol>
        <p className="text-bone-faint">
          The star rows in the header and hero, and the AggregateRating JSON-LD on every
          branch page, all unlock from that one flag.
        </p>
      </div>
    </div>
  );
}
