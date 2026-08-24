'use client';

import { faqs } from '@/content/faq';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/watermelon/accordion';
import { Section, Container, SectionHeading } from '@/components/ui/Section';

/**
 * FAQ, built on Watermelon UI's accordion (a shadcn-registry component wrapping
 * Radix Accordion).
 *
 * This replaces a hand-rolled <dl> that showed all twelve answers at once. With
 * twelve questions that was a wall of text nobody scanned; collapsed, the
 * question list is readable at a glance.
 *
 * The real reason to take the dependency rather than hand-roll a toggle: Radix
 * gets the semantics right for free — button/region association, aria-expanded,
 * correct heading structure, and full keyboard support. Hand-rolled accordions
 * almost always miss at least one of those.
 *
 * `type="single" collapsible` — one open at a time, and it can be closed again.
 */
export function Faq() {
  return (
    <Section tone="raised">
      <Container>
        <SectionHeading title="Things people ask before booking." />

        <Accordion
          type="single"
          collapsible
          className="mt-12 border-y border-line"
        >
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="border-line"
            >
              <AccordionTrigger className="font-display text-lg tracking-wide text-bone no-underline hover:no-underline md:text-xl">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5 text-sm leading-relaxed text-bone-dim">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Section>
  );
}
