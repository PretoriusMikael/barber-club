# Tenant: Elevate

The assistant on elevate-web.co.za. It is the first real tenant and the place where every change
is tested before a client sees it.

## Set up / update

```bash
# 1. The tenant row (config, allowed sites, daily cap). Run in the Supabase SQL editor.
#    Re-runnable.
tenants/elevate/tenant.sql

# 2. The knowledge base, from the live site plus the hand-written page guide:
npm run kb:import -- --tenant elevate \
  --source https://elevate-web.co.za/llms-full.txt \
  --source tenants/elevate/site-guide.md \
  > tenants/elevate/knowledge.sql
#    Read knowledge.sql, then run it in the SQL editor. It replaces the
#    previous import and leaves anything added by hand untouched.
```

**When the site's content changes** (prices, packages, a new case study, FAQ), re-run step 2.
The site builds `/llms-full.txt` from the same `lib/content.ts` as its pages, so the assistant
and the site can't disagree for longer than it takes to re-import.

Importing from a local build of the site (`npm run dev` in the portfolio repo) needs
`--source http://localhost:3000/llms-full.txt --replace-origin http://localhost:3000=https://elevate-web.co.za`.

## Things to know about this tenant

- **No opening hours.** Elevate is a sole trader, so `hours` is left out of the config and the
  assistant never says "open" or "closed".
- **Prices.** The site has a South African list (rand) and an international list (US dollars),
  plus a founding-client discount. The assistant only repeats the figures written in
  `/llms-full.txt` and sends anyone wanting a figure for their own project to the estimate page.
  The price check rejects any amount, in any currency, that isn't in a cited entry.
- **Voice.** The site speaks as Mikael in the first person. The assistant speaks *about* Mikael,
  in the third person, so a visitor is never misled about who they are talking to.
- **Testing on a Vercel preview.** Add the portfolio branch's preview origin to `allowed_origins`
  in `tenant.sql` and re-run it. A branch's preview URL is stable, so you only add it once.
