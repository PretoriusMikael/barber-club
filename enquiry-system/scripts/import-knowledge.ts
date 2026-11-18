/**
 * Import a tenant's knowledge base from Markdown (a URL or a file), as SQL.
 *
 *   npm run kb:import -- --tenant elevate \
 *     --source https://elevate-web.co.za/llms-full.txt \
 *     --source tenants/elevate/site-guide.md \
 *     > kb.sql
 *
 * Options:
 *   --tenant <slug>          required
 *   --source <url|path>      one or more; entries keep their order
 *   --replace-origin a=b     rewrite URLs, e.g. http://localhost:3000=https://elevate-web.co.za
 *
 * Writes SQL to stdout and a summary to stderr. It does not touch the database:
 * read the SQL, then run it in the Supabase SQL editor (or psql). Re-running
 * replaces only the entries a previous import created.
 */
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { parseKnowledgeMarkdown, replaceOrigin, toSql, type ParsedEntry } from "../src/lib/knowledge/markdown.ts";

const { values } = parseArgs({
  options: {
    tenant: { type: "string" },
    source: { type: "string", multiple: true },
    "replace-origin": { type: "string", multiple: true },
  },
});

if (!values.tenant || !values.source?.length) {
  console.error("Usage: npm run kb:import -- --tenant <slug> --source <url|path> [--source …] [--replace-origin from=to]");
  process.exit(1);
}

let entries: ParsedEntry[] = [];
for (const source of values.source) {
  const text = /^https?:\/\//.test(source)
    ? await fetch(source).then((r) => {
        if (!r.ok) throw new Error(`${source}: HTTP ${r.status}`);
        return r.text();
      })
    : await readFile(source, "utf8");
  const parsed = parseKnowledgeMarkdown(text);
  for (const w of parsed.warnings) console.error(`warning (${source}): ${w}`);
  entries.push(...parsed.entries);
}

for (const pair of values["replace-origin"] ?? []) {
  const [from, to] = pair.split("=");
  if (!from || !to) throw new Error(`--replace-origin expects from=to, got ${pair}`);
  entries = replaceOrigin(entries, from, to);
}

const chars = entries.reduce((n, e) => n + e.title.length + e.body.length, 0);
console.error(`${entries.length} entries, ~${Math.round(chars / 4)} tokens:`);
for (const e of entries) console.error(`  [${e.kind.padEnd(7)}] ${e.title}${e.url ? `  ->  ${e.url}` : ""}`);

process.stdout.write(toSql(values.tenant, entries));
