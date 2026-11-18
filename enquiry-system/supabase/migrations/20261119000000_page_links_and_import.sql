-- =============================================================================
-- Page links + imported knowledge
--
-- 1. A knowledge entry can carry the URL of the page it describes. The
--    assistant may suggest those pages ("See the packages"), and ONLY those:
--    the server turns cited refs into links, so the model never writes a URL.
-- 2. `source` separates hand-written entries from ones imported from the
--    client's site (scripts/import-knowledge.ts). A re-import replaces the
--    imported rows and leaves the hand-written ones alone.
-- =============================================================================

alter type public.knowledge_kind add value if not exists 'page';

alter table public.knowledge_entries
  add column url text check (url is null or url ~ '^https?://[^\s]+$'),
  add column source text not null default 'manual' check (source in ('manual', 'import'));
