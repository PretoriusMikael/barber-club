import type { ModelTurn } from "./turn-schema.ts";

/**
 * Deterministic checks applied to every model turn before the visitor sees it.
 *
 * The prompt asks the model to behave; this module makes sure it did. Each
 * rule is plain code, unit-tested, and logged in messages.meta.flags so you can
 * see in the data how often the model needed correcting — that number is your
 * quality metric when you change models or prompts.
 */

export interface GuardInput {
  turn: ModelTurn;
  /** ref -> entry body, from buildRefMap(). */
  refBodies: Map<string, string>;
  /** ref -> page URL, for entries that describe a page. */
  refUrls?: Map<string, string>;
  latestUserMessage: string;
  enquiryTypeKeys: string[];
  fallbackMessage: string;
}

export interface GuardResult {
  reply: string;
  handover: boolean;
  enquiryType: string;
  priority: ModelTurn["priority"];
  usedRefs: string[];
  /** Refs of pages to link under the reply: real entries with a URL, at most 2. */
  linkRefs: string[];
  flags: string[];
}

const HUMAN_REQUEST =
  /\b((speak|talk|chat)\s+(to|with)\s+(a\s+|an\s+|the\s+|your\s+)?(human|person|someone|agent|manager|owner|staff|team)|real person|call me( back)?|callback|phone me)\b/i;

// R450 · R 1,200 · R1 200.50 · ZAR 900 · 900 rand · $1,200 · US$900 · €750 · £600 · 500 USD.
// Thousands separators must be followed by exactly three digits, so
// "R650, 30 minutes" reads as 650. Currency is ignored on purpose: an amount
// is allowed only if the same number appears in a cited entry.
const SYMBOL = String.raw`(?:R|ZAR|US\$|\$|€|£|EUR|USD|GBP)`;
const WORD = String.raw`(?:rand|ZAR|USD|EUR|GBP|dollars?|euros?|pounds?)`;
const AMOUNT = String.raw`(\d{1,3}(?:[ ,]\d{3})+|\d+)(?:\.\d{2})?`;
const MONEY = new RegExp(String.raw`(?:^|(?<=[^\w$€£]))${SYMBOL}\s?${AMOUNT}\b|\b${AMOUNT}\s?${WORD}\b`, "gi");
const URL_IN_TEXT = /\b(?:https?:\/\/|www\.)\S+/gi;

/** "R1,200.00" -> "1200", "R 650" -> "650". Cents dropped, so R650 == R650.00. */
export function moneyAmounts(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(MONEY)) {
    const digits = (match[1] ?? match[2] ?? "").replace(/[^\d]/g, "");
    if (digits) out.push(String(Number(digits)));
  }
  return out;
}

export function applyGuardrails(input: GuardInput): GuardResult {
  const { turn, refBodies, refUrls = new Map(), latestUserMessage, enquiryTypeKeys, fallbackMessage } = input;
  const flags: string[] = [];

  // Citations must point at real entries.
  const usedRefs = turn.used_refs.filter((ref) => refBodies.has(ref));
  if (usedRefs.length !== turn.used_refs.length) flags.push("unknown_ref");

  let reply = turn.reply.trim();
  let handover = turn.handover.needed;

  // 0. URLs are never typed by the model; pages are linked from refs below.
  if (URL_IN_TEXT.test(reply)) {
    flags.push("url_in_reply");
    reply = reply.replace(URL_IN_TEXT, "").replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
  }
  URL_IN_TEXT.lastIndex = 0;

  const linkRefs = [...new Set(turn.links)].filter((ref) => refUrls.has(ref)).slice(0, 2);
  if (linkRefs.length !== new Set(turn.links).size && turn.links.length > 0) flags.push("invalid_link_ref");

  // 1. Self-reported ungrounded answer -> never show it.
  if (!turn.grounded) {
    flags.push("ungrounded");
    reply = fallbackMessage;
    handover = true;
  }

  // 2. Every amount of money in the reply must appear in a cited entry.
  const amounts = moneyAmounts(reply);
  if (amounts.length > 0) {
    const citedAmounts = new Set(usedRefs.flatMap((ref) => moneyAmounts(refBodies.get(ref) ?? "")));
    const unsupported = amounts.filter((a) => !citedAmounts.has(a));
    if (unsupported.length > 0) {
      flags.push("unsupported_price");
      reply = fallbackMessage;
      handover = true;
    }
  }

  // 3. Explicit requests for a person always hand over, whatever the model decided.
  if (HUMAN_REQUEST.test(latestUserMessage) && !handover) {
    flags.push("forced_handover_human_request");
    handover = true;
  }

  // 4. Emergencies and complaints always reach a person.
  let priority = turn.priority;
  if (turn.intent === "emergency") {
    priority = "urgent";
    handover = true;
  }
  if (turn.intent === "complaint" || turn.intent === "human_request") handover = true;

  const enquiryType = enquiryTypeKeys.includes(turn.enquiry_type) ? turn.enquiry_type : "other";
  if (enquiryType !== turn.enquiry_type) flags.push("unknown_enquiry_type");

  // An ungrounded or corrected reply should not carry page suggestions made for it.
  const keepLinks = !flags.includes("ungrounded") && !flags.includes("unsupported_price");
  return { reply, handover, enquiryType, priority, usedRefs, linkRefs: keepLinks ? linkRefs : [], flags };
}
