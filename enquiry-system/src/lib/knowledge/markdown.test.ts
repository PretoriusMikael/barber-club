import { test } from "node:test";
import assert from "node:assert/strict";
import { parseKnowledgeMarkdown, replaceOrigin, toSql } from "./markdown.ts";

const doc = `# Studio — Web developer

> A studio in Stellenbosch.

Contact: hello@example.com

## Services

Each in full: https://example.com/services

### Landing website

One page. From R6,700.

- A contact form

### Care

R500 a month.

## Selected work

### Barber Club rebuild

Eleven shops.

#### A page for every shop

Each shop has a page.

Page: https://example.com/work/barber-club
Preview address: https://barber-club.vercel.app

## Questions and answers

### How do we start?

Send a message.

## Opening note

A section with no children.
`;

test("splits a llms.txt-style document into entries", () => {
  const { entries, warnings } = parseKnowledgeMarkdown(doc);
  assert.deepEqual(warnings, []);
  assert.deepEqual(
    entries.map((e) => [e.kind, e.title]),
    [
      ["about", "Studio — Web developer"],
      ["service", "Landing website"],
      ["service", "Care"],
      ["page", "Barber Club rebuild"],
      ["faq", "How do we start?"],
      ["about", "Opening note"],
    ],
  );
});

test("pages: explicit Page: line wins, else the section intro's URL, else none", () => {
  const { entries } = parseKnowledgeMarkdown(doc);
  const byTitle = Object.fromEntries(entries.map((e) => [e.title, e]));
  assert.equal(byTitle["Landing website"]!.url, "https://example.com/services");
  assert.equal(byTitle["Barber Club rebuild"]!.url, "https://example.com/work/barber-club");
  assert.equal(byTitle["How do we start?"]!.url, null);
  // The Page: line is metadata, not content; other lines (including other URLs) stay.
  assert.ok(!byTitle["Barber Club rebuild"]!.body.includes("Page:"));
  assert.ok(byTitle["Barber Club rebuild"]!.body.includes("A page for every shop:"));
  assert.ok(byTitle["Barber Club rebuild"]!.body.includes("Preview address"));
});

test("Kind: line overrides the inferred kind", () => {
  const { entries } = parseKnowledgeMarkdown("## Guide\n\n### Estimate\n\nKind: service\nPage: https://x.com/estimate\n\nGet a price range.");
  assert.equal(entries[0]!.kind, "service");
  assert.equal(entries[0]!.url, "https://x.com/estimate");
});

test("over-long sections are truncated with a warning", () => {
  const { entries, warnings } = parseKnowledgeMarkdown(`## FAQ\n\n### Long\n\n${"x".repeat(5000)}`);
  assert.equal(entries[0]!.body.length, 4000);
  assert.equal(warnings.length, 1);
});

test("replaceOrigin rewrites URLs and bodies", () => {
  const [entry] = replaceOrigin([{ kind: "page", title: "t", body: "see http://localhost:3000/x", url: "http://localhost:3000/x" }], "http://localhost:3000", "https://site.co.za");
  assert.equal(entry!.url, "https://site.co.za/x");
  assert.equal(entry!.body, "see https://site.co.za/x");
});

test("toSql escapes quotes and only replaces imported rows", () => {
  const sql = toSql("my-tenant", [{ kind: "faq", title: "What's the price?", body: "It's R500.", url: null }]);
  assert.ok(sql.includes("'What''s the price?'"));
  assert.ok(sql.includes("where source = 'import'"));
  assert.throws(() => toSql("Bad Slug'; drop", []));
});
