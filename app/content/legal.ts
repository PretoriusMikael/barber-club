/**
 * Shared facts for the two legal pages.
 *
 * The date lives here rather than being typed twice, because a privacy notice
 * and a booking policy that claim different revision dates is the first thing
 * anyone reviewing them notices.
 *
 * ⚠️  Both pages are PROPOSED policy, not legal advice, and neither can go live
 *     as written. Every clause needs the client's sign-off, and the POPIA notice
 *     needs review by someone qualified — see PITCH-NOTES.md §5.
 */
export const LEGAL_LAST_UPDATED = "27 August 2026";

/**
 * The registered entity behind the trading name.
 *
 * ⚠️  Not published anywhere on barberclub.co.za. POPIA requires the responsible
 *     party to be named, so this MUST be the registered company name before the
 *     privacy notice goes live. Trading name until then.
 */
export const LEGAL_ENTITY = "Barber Club";

/**
 * The named Information Officer.
 *
 * ⚠️  POPIA requires one, and requires them to be registered with the
 *     Information Regulator. Null until the client appoints one; the privacy
 *     page falls back to the general contact address rather than naming nobody.
 */
export const INFORMATION_OFFICER: string | null = null;
