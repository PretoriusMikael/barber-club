/**
 * Markdown -> knowledge entries.
 *
 * Built for llms.txt-style documents (one Markdown file describing a site),
 * which is what onboarding a client whose website you built should look like:
 * the site already states its facts once, so the assistant reads the same
 * source instead of a hand-copied version that drifts.
 *
 * Rules:
 *   # Title + text before the first ##   -> one "about" entry
 *   ## Section with ### children        -> one entry per ###
 *   ## Section without ### children     -> one entry for the section
 *   #### and deeper                     -> folded into the entry's body
 *   "Page: <url>" / "URL: <url>" line   -> the entry's page (line removed)
 *   otherwise the first URL in the ## section's intro -> the entry's page
 *   "Kind: page" line                   -> overrides the inferred kind
 *
 * Pure: no I/O, unit-tested in markdown.test.ts.
 */

export type Kind = "about" | "service" | "faq" | "policy" | "location" | "page";

export interface ParsedEntry {
  kind: Kind;
  title: string;
  body: string;
  url: string | null;
}

const MAX_BODY = 4000; // matches the knowledge_entries.body check
const URL_LINE = /^(?:page|url):\s*(https?:\/\/\S+)\s*$/i;
const KIND_LINE = /^kind:\s*(about|service|faq|policy|location|page)\s*$/i;
const FIRST_URL = /https?:\/\/[^\s,)]+/;

function inferKind(section: string): Kind {
  if (/service|package|pricing|price/i.test(section)) return "service";
  if (/question|faq|answers/i.test(section)) return "faq";
  if (/work|project|portfolio|case/i.test(section)) return "page";
  if (/polic|terms|privacy/i.test(section)) return "policy";
  if (/location|area|branch/i.test(section)) return "location";
  if (/page|guide|site/i.test(section)) return "page";
  return "about";
}

interface Draft {
  title: string;
  lines: string[];
  section: string;
  sectionIntroUrl: string | null;
}

function finish(draft: Draft, warnings: string[]): ParsedEntry | null {
  let url: string | null = null;
  let kind: Kind = inferKind(draft.section || draft.title);
  const kept: string[] = [];
  for (const line of draft.lines) {
    const urlMatch = line.trim().match(URL_LINE);
    const kindMatch = line.trim().match(KIND_LINE);
    if (urlMatch) url = urlMatch[1]!;
    else if (kindMatch) kind = kindMatch[1]!.toLowerCase() as Kind;
    else kept.push(line);
  }
  url ??= draft.sectionIntroUrl;

  let body = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!body) return null;
  if (body.length > MAX_BODY) {
    warnings.push(`"${draft.title}" is ${body.length} characters; truncated to ${MAX_BODY}. Split it into smaller sections.`);
    body = body.slice(0, MAX_BODY - 1) + "…";
  }
  return { kind, title: draft.title.slice(0, 200), body, url };
}

export function parseKnowledgeMarkdown(markdown: string): { entries: ParsedEntry[]; warnings: string[] } {
  const entries: ParsedEntry[] = [];
  const warnings: string[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  let current: Draft | null = null;
  let section = "";
  let sectionIntro: string[] = [];
  let sectionHasChildren = false;
  let sectionIntroUrl: string | null = null;

  const push = (draft: Draft | null) => {
    if (!draft) return;
    const entry = finish(draft, warnings);
    if (entry) entries.push(entry);
  };
  // A ## with no ### becomes one entry from its intro text.
  const closeSection = () => {
    if (section && !sectionHasChildren) {
      push({ title: section, lines: sectionIntro, section, sectionIntroUrl: null });
    }
  };

  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.*\S)\s*$/);
    const level = h ? h[1]!.length : 0;

    if (level === 1) {
      push(current);
      current = { title: h![2]!, lines: [], section: "about", sectionIntroUrl: null };
    } else if (level === 2) {
      push(current);
      current = null;
      closeSection();
      section = h![2]!;
      sectionIntro = [];
      sectionHasChildren = false;
      sectionIntroUrl = null;
    } else if (level === 3) {
      push(current);
      sectionHasChildren = true;
      current = { title: h![2]!, lines: [], section, sectionIntroUrl };
    } else if (level >= 4 && current) {
      current.lines.push("", `${h![2]}:`);
    } else if (current) {
      current.lines.push(line.replace(/^>\s?/, ""));
    } else if (section) {
      sectionIntro.push(line);
      sectionIntroUrl ??= line.match(FIRST_URL)?.[0] ?? null;
    }
  }
  push(current);
  closeSection();

  return { entries, warnings };
}

/** Rewrite one origin to another in every URL and body, e.g. a local build's localhost to the live domain. */
export function replaceOrigin(entries: ParsedEntry[], from: string, to: string): ParsedEntry[] {
  const swap = (text: string) => text.split(from).join(to);
  return entries.map((e) => ({ ...e, body: swap(e.body), url: e.url ? swap(e.url) : null }));
}

/** SQL that replaces a tenant's imported entries and leaves hand-written ones alone. */
export function toSql(tenantSlug: string, entries: ParsedEntry[]): string {
  if (!/^[a-z0-9][a-z0-9-]{2,47}$/.test(tenantSlug)) throw new Error(`invalid tenant slug: ${tenantSlug}`);
  const lit = (v: string | null) => (v === null ? "null" : `'${v.replace(/'/g, "''")}'`);
  const rows = entries
    .map((e, i) => `  (${lit(e.kind)}, ${lit(e.title)}, ${lit(e.body)}, ${lit(e.url)}, ${100 + i})`)
    .join(",\n");

  return `-- Generated by scripts/import-knowledge.ts. Review before applying.
begin;

delete from public.knowledge_entries
where source = 'import'
  and tenant_id = (select id from public.tenants where slug = ${lit(tenantSlug)});

insert into public.knowledge_entries (tenant_id, kind, title, body, url, source, sort_order)
select t.id, v.kind::public.knowledge_kind, v.title, v.body, v.url, 'import', v.sort_order
from public.tenants t
cross join (values
${rows}
) as v(kind, title, body, url, sort_order)
where t.slug = ${lit(tenantSlug)};

commit;
`;
}
