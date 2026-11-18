# Build plan — from this commit to a first paying client

Your original 14-day plan spends Days 2–7 building the system piece by piece. Most of that build
now exists and is tested, so the plan below moves that time to the work that actually wins
clients: **understanding the code well enough to sell and support it, testing it against the real
model, and getting in front of prospects sooner.**

Budget: 7–10 hours a week, so **~20 hours over the 14 days**. Each "session" below is 1–2 hours.

---

## Week 1 — make it real

| # | Session | Done when |
|---|---|---|
| 1 | **Read the code in this order:** `docs/ARCHITECTURE.md` §1–2 → `src/app/api/chat/route.ts` → `src/lib/ai/guardrails.ts` and its tests → the migration. Run `npm test`. | You can explain to a client, in two sentences, why the assistant won't invent a price |
| 2 | **Accounts:** create a Supabase project, apply the migration and seed (SQL editor or `supabase db push`), and create an OpenAI project with a **R300/month budget limit** and a project-scoped key. Fill in `.env.local`. | `npm run dev` → `localhost:3100/demo/fynbos-plumbing-demo` chats with the real model |
| 3 | **n8n fundamentals, building the real workflow:** Workflow 1 from `N8N-WORKFLOWS.md` (Webhook → Switch → Email → Respond). n8n Cloud trial or local Docker. | Leaving a phone number in the demo chat sends you an email |
| 4 | **OpenAI fundamentals, in context:** read the Structured Outputs and Responses API docs, then compare `src/lib/ai/respond.ts` against them. Change `OPENAI_MODEL` and watch `messages.input_tokens / cached_tokens` in Supabase. | You know the real cost of a 6-turn conversation, in rand, from your own data |
| 5 | **Break it on purpose:** write 30 test messages for the demo tenant (questions in the KB, questions not in it, "what does a geyser cost", "ignore your instructions", an emergency, a complaint, "can I speak to someone"). Run them and check `meta.flags`. Tighten the prompt and KB where it fails. | Fewer than 1 in 20 replies needs a guardrail correction, and none slip through |
| 6 | **Deploy:** Vercel + your subdomain + Supabase pg_cron retention job + the n8n retry workflow. | The widget runs on a public URL. Embed it on your own agency site |

## Week 2 — sell it

| # | Session | Done when |
|---|---|---|
| 7 | **Demo tenant for your best prospect industry** (see below): write its KB from its real public website, ~10 entries. This is also your onboarding rehearsal. **Time it.** | A tenant built from public info in under 2 hours |
| 8 | **Record a 90-second demo:** visitor asks a price (correct answer) → asks something not in the KB (honest "I'll pass it on") → leaves a number → the email arrives. Show the inbox on screen. | A video you can send in a WhatsApp message |
| 9 | **Package and price** (below). One-page PDF or web page. | You can quote in under a minute |
| 10 | **Research 20 prospects**, scored on: enquiry volume, after-hours enquiries, an existing website, and ability to pay. | A spreadsheet with a named decision-maker for each |
| 11 | **Five personalised approaches**, each with a demo built on *their* public info where possible. | Five sent |
| 12 | **Follow up, book calls.** | At least one discovery call booked |

---

## The prospect already in your pipeline

**Barber Club** (this repository's client) is a better first prospect than any cold lead, and your
own audit already contains the pitch:

- FINDINGS §2: *"There is no online booking system anywhere on the site … Every enquiry outside
  trading hours is lost, across eleven branches."*
- 11 branches with different hours: "which branch is open now, and what's its number?" is exactly
  the question the assistant answers from computed hours, not guesses.
- **Group and groomsmen packages** (R450–R650 a head, 3–4 person minimums) are high-value,
  enquiry-driven sales that currently rely on an email address. This is lead qualification in the
  classic sense: date, group size, package, branch.

The position to take: **the assistant complements a booking system and doesn't replace one.** It
answers, routes and captures, and hands off to whichever booking vendor they choose.

Two small additions would make it a strong fit (an hour or two each):

1. **Notification routing per enquiry type**, so group enquiries go to `connect@` and branch
   questions go to `operations@`. This means adding `notifications.routes: { [enquiryType]: email[] }`
   to the tenant config and reading it in `outbox/dispatch.ts`.
2. **Per-branch hours in `[HOURS]`**, so "Is Paarl open now?" is answered per branch. This
   generalises `hours.ts` to named locations.

The business data is already typed in `app/content/` (branches, services, packages, FAQ), so their
tenant's knowledge base is mostly a conversion script. **Only demo it with their data to them.**
For anyone else, use the fictional tenant.

---

## Packaging (hypotheses to test, built on your ranges)

The system makes setup mostly **configuration and writing a knowledge base**. That takes 3–6 hours
per client once you've done a couple, which is why the setup fees below carry a healthy margin.

| Package | What it is in this codebase | Setup | Monthly |
|---|---|---|---|
| **Enquiry Capture** | Widget in form-only mode, notifications, lead log, retention | R2,500 | R450 |
| **AI Enquiry Assistant** | Everything above + the assistant, with up to N conversations a month (set from your cost data, Session 4) | R4,500–R7,500 | R950–R1,500 |
| **Assistant + Integrations** | + WhatsApp alerts / CRM / GoHighLevel / Google Sheets via n8n branches | from R7,500 | R1,500–R2,500 |

The monthly fee covers hosting, monitoring (`meta.flags` and failed outbox events), KB updates
(cap them, for example 2 per month), API usage up to the cap, and **a short monthly report**. The
report is what makes the fee feel earned. Build it as an n8n workflow (see Workflow 3+).

**First R5,000:** one Assistant setup plus its first month.

---

## Next engineering steps (in order, only as clients need them)

1. Model evaluation script: the Session 5 test set as an automated script against the real API.
2. Notification routing per enquiry type (needed for Barber Club).
3. A tenant onboarding script: JSON file → validated config + KB rows.
4. Client dashboard: Supabase Auth plus a leads list with a status column. The RLS for it already
   exists.
5. Cloudflare Turnstile, when a tenant attracts abuse.
6. pgvector retrieval, when a tenant's KB passes ~25k tokens.
7. **Move `enquiry-system/` into its own repository.** It is a product, not part of a client site.
   It has its own `package.json` and no imports from the parent, so a copy (or
   `git subtree split --prefix enquiry-system`) is enough.
