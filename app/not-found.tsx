import { Container } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-[70svh] items-center pt-24">
      <Container className="max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass-dim">404</p>
        <h1 className="mt-4 text-[clamp(2.5rem,9vw,4.5rem)] leading-[0.9]">
          Nothing to cut here.
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-sm text-bone-dim">
          That page does not exist. The chair, however, still does.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/book" variant="primary" size="lg">
            Book your chair
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg">
            Back home
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
