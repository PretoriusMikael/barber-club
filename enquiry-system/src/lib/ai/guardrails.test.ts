import { test } from "node:test";
import assert from "node:assert/strict";
import { applyGuardrails, moneyAmounts } from "./guardrails.ts";
import type { ModelTurn } from "./turn-schema.ts";

const refBodies = new Map([
  ["K1", "Call-out fee is R650 during business hours. After-hours call-out is R1,200."],
  ["K2", "We work in Bellville and Durbanville."],
]);
const FALLBACK = "I don't have that information.";

function turn(overrides: Partial<ModelTurn> = {}): ModelTurn {
  return {
    reply: "Our call-out fee is R650 during business hours.",
    intent: "question",
    enquiry_type: "repair",
    priority: "low",
    grounded: true,
    used_refs: ["K1"],
    links: [],
    contact: { name: null, email: null, phone: null },
    enquiry_summary: null,
    handover: { needed: false, reason: null },
    ...overrides,
  };
}

const refUrls = new Map([["K2", "https://example.com/areas"]]);

const run = (t: ModelTurn, latestUserMessage = "How much is a call-out?") =>
  applyGuardrails({ turn: t, refBodies, refUrls, latestUserMessage, enquiryTypeKeys: ["repair", "emergency", "other"], fallbackMessage: FALLBACK });

test("moneyAmounts parses rand formats and ignores trailing numbers", () => {
  assert.deepEqual(moneyAmounts("R650, 30 minutes and R1,200.00 or R 1 950"), ["650", "1200", "1950"]);
  assert.deepEqual(moneyAmounts("ZAR 900 or 450 rand"), ["900", "450"]);
  assert.deepEqual(moneyAmounts("We have 3 vans and 12 staff"), []);
});

test("grounded answer with a cited price passes through", () => {
  const r = run(turn());
  assert.equal(r.reply, "Our call-out fee is R650 during business hours.");
  assert.equal(r.handover, false);
  assert.deepEqual(r.flags, []);
});

test("price not present in any cited entry is replaced", () => {
  const r = run(turn({ reply: "A geyser replacement is about R8,500." }));
  assert.equal(r.reply, FALLBACK);
  assert.equal(r.handover, true);
  assert.ok(r.flags.includes("unsupported_price"));
});

test("price from an uncited entry is still replaced: citations must be honest", () => {
  const r = run(turn({ reply: "After hours it's R1,200.", used_refs: ["K2"] }));
  assert.equal(r.reply, FALLBACK);
});

test("self-reported ungrounded answer is never shown", () => {
  const r = run(turn({ reply: "We probably work in Somerset West.", grounded: false, used_refs: [] }));
  assert.equal(r.reply, FALLBACK);
  assert.equal(r.handover, true);
});

test("fabricated refs are dropped and flagged", () => {
  const r = run(turn({ used_refs: ["K1", "K99"] }));
  assert.deepEqual(r.usedRefs, ["K1"]);
  assert.ok(r.flags.includes("unknown_ref"));
});

test("asking for a person forces handover even if the model did not", () => {
  const r = run(turn({ reply: "Sure, what can I help with?", used_refs: [] }), "Can I speak to a real person please");
  assert.equal(r.handover, true);
  assert.ok(r.flags.includes("forced_handover_human_request"));
});

test("emergencies are urgent and handed over", () => {
  const r = run(turn({ intent: "emergency", priority: "medium", reply: "Please switch off the mains and phone us now.", used_refs: [] }));
  assert.equal(r.priority, "urgent");
  assert.equal(r.handover, true);
});

test("unknown enquiry type becomes 'other'", () => {
  const r = run(turn({ enquiry_type: "solar" }));
  assert.equal(r.enquiryType, "other");
});

test("moneyAmounts reads other currencies, and not words that merely start with R", () => {
  assert.deepEqual(moneyAmounts("$1,200 or US$900, €750, £600 and 500 USD"), ["1200", "900", "750", "600", "500"]);
  assert.deepEqual(moneyAmounts("Room 12 and PR650"), []);
});

test("a dollar price not in the cited entry is replaced", () => {
  const r = run(turn({ reply: "Internationally it's from $2,400." }));
  assert.equal(r.reply, FALLBACK);
});

test("page links: only real refs that have a page, at most two", () => {
  const r = run(turn({ reply: "We work in Bellville; the areas page below lists the rest.", used_refs: ["K2"], links: ["K2", "K1", "K9"] }));
  assert.deepEqual(r.linkRefs, ["K2"]);
  assert.ok(r.flags.includes("invalid_link_ref"));
});

test("URLs typed into the reply are stripped", () => {
  const r = run(turn({ reply: "See https://evil.example/x for details.", used_refs: [] }));
  assert.equal(r.reply, "See for details.");
  assert.ok(r.flags.includes("url_in_reply"));
});

test("a corrected reply loses its page suggestions", () => {
  const r = run(turn({ reply: "It's about R9,999.", used_refs: ["K2"], links: ["K2"] }));
  assert.equal(r.reply, FALLBACK);
  assert.deepEqual(r.linkRefs, []);
});
