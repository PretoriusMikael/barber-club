/**
 * Contact normalisation and verification.
 *
 * Normalised values are what the database deduplicates on, so "082 123 4567",
 * "+27 82 123 4567" and "0821234567" must all become the same string.
 *
 * Verification is the anti-hallucination guard for lead capture: the model
 * PROPOSES contact details, and we only accept ones that literally appear in
 * what the visitor typed. A model that invents or "corrects" a phone number
 * would otherwise create a lead nobody can call back.
 */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// Phone-shaped runs: optional +, then digits with common separators.
const PHONE_RE = /\+?\d[\d\s().-]{7,18}\d/g;

export function normaliseEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const email = input.trim().toLowerCase();
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) && email.length <= 254 ? email : null;
}

/**
 * To E.164. Defaults to South Africa (+27) for local numbers starting with 0.
 * Returns null for anything that is not a plausible phone number.
 */
export function normalisePhone(input: string | null | undefined, defaultCountryCode = "27"): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  let digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = defaultCountryCode + digits.slice(1);
  } else if (!digits.startsWith(defaultCountryCode)) {
    return null; // ambiguous: no country code and no leading 0
  }

  // South African numbers are +27 followed by exactly 9 digits.
  if (digits.startsWith("27") && digits.length !== 11) return null;
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
  return `+${digits}`;
}

export function extractEmails(text: string): Set<string> {
  const out = new Set<string>();
  for (const match of text.matchAll(EMAIL_RE)) {
    const email = normaliseEmail(match[0]);
    if (email) out.add(email);
  }
  return out;
}

export function extractPhones(text: string): Set<string> {
  const out = new Set<string>();
  for (const match of text.matchAll(PHONE_RE)) {
    const phone = normalisePhone(match[0]);
    if (phone) out.add(phone);
  }
  return out;
}

export interface ProposedContact {
  name: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Keep only the contact details the visitor actually typed.
 * `visitorText` = every user message in the conversation, joined.
 */
export function verifyContact(proposed: ProposedContact, visitorText: string): ProposedContact {
  const email = normaliseEmail(proposed.email);
  const phone = normalisePhone(proposed.phone);
  const name = proposed.name?.trim() ?? "";
  const nameTyped = name.length > 0 && name.length <= 80 && visitorText.toLowerCase().includes(name.toLowerCase());

  return {
    name: nameTyped ? name : null,
    email: email && extractEmails(visitorText).has(email) ? email : null,
    phone: phone && extractPhones(visitorText).has(phone) ? phone : null,
  };
}
