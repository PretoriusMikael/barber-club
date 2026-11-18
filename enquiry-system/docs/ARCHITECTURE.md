# Intelligent Enquiry System — architecture

A multi-tenant AI enquiry assistant that you deploy once and sell many times. One Next.js app, one
Supabase project and one n8n workflow serve every client. A new client means new rows in the
database, not a new codebase.

Section numbers are referenced from code comments.

---

## §1 The decisions that shape everything

| Decision | Choice | Why |
|---|---|---|
| Where the AI conversation runs | **Next.js route (`/api/chat`)**, not n8n | A chat turn has to be fast (under ~3s), versioned in git, type-checked and unit-tested. n8n adds a network hop and a webhook queue to every message, and logic in n8n is hard to diff and review. Keep the **synchronous** path in code. |
| What n8n does | **Everything asynchronous after a lead exists**: notifications, CRM sync, follow-ups, retries | This is where n8n saves you real time: email, WhatsApp, Slack, Google Sheets, HighLevel and so on are already built as nodes. Nothing here is latency-sensitive, and a non-developer can change who gets emailed. |
| How the model is used | **One call per message, Structured Outputs, no tools, no agent loop** | The model reads, classifies and drafts. The server decides what happens. The cost per message is fixed, and the model cannot trigger a side effect by itself. That covers your "controlled, predictable" requirement. |
| Knowledge retrieval | **The whole knowledge base goes in the prompt.** No embeddings in v1 | A plumber's or salon's knowledge base is 2–6k tokens. Putting all of it in the prompt is more accurate than vector search at that size, has no moving parts, and OpenAI's automatic prompt caching makes the repeated prefix cheap. Add pgvector when a tenant passes ~25k tokens of knowledge (§5). |
| Anti-hallucination | **The model's output is checked in code before anyone sees it** (`lib/ai/guardrails.ts`) | Every rand amount in a reply must appear in a knowledge entry the model cited. A reply the model marks as ungrounded is never shown. Contact details are only kept if the visitor actually typed them. These are deterministic, unit-tested rules. They don't depend on the prompt being obeyed. |
| Embedding | **iframe + 1 script tag** | The client's CSS can't break the widget, and the widget can't touch their page. It works on WordPress, Wix, Squarespace and Next.js. The browser enforces which sites may embed it (CSP `frame-ancestors`, set per tenant in `src/proxy.ts`). |
| Multi-tenancy | **Shared tables, `tenant_id` on every row, RLS on** | One schema migration upgrades every client at once. Isolation is enforced twice: in server code (§4) and by Postgres RLS for the future client dashboard. |
| Side effects | **Transactional outbox** | The lead and its notification event are written in one transaction. If n8n is down, the event waits and is retried, so a notification is never silently lost. |
| Rate limiting | **Postgres**, not Redis | Serverless instances share no memory. Postgres is already paid for, and Redis can come later. |

### What was deliberately left out of v1

- **Live human chat takeover.** v1 handover means: flag the lead, notify the team at the right
  priority, and show the visitor phone and WhatsApp buttons. Live takeover needs realtime,
  presence and staff on shift, and nobody will pay for it until a client asks for it.
- **The model writing to calendars or CRMs directly.** Booking is a link to the client's existing
  booking tool. A booking integration goes in n8n, triggered by a lead event, never by the model.
- **A client dashboard.** Leads arrive by email (via n8n) and are stored in Supabase. The RLS
  policies for a dashboard already exist (§4), so it is a UI job when you need it.
- **Streaming responses.** A structured JSON turn can't be shown until it has been validated, and
  2–3 seconds with a typing indicator is fine for this use case.

---

## §2 Request flow

```
Client website                       Your app (Vercel)                       Supabase            OpenAI      n8n
──────────────                       ─────────────────                       ────────            ──────      ───
<script src=widget.js>
  └─ iframe /embed/{slug} ─────────▶ proxy.ts: CSP frame-ancestors
                                     page.tsx: public tenant config only
visitor types ─── POST /api/chat ──▶ 1  zod-validate body, honeypot
                                     2  load tenant (60s cache) ───────────▶ tenants, knowledge
                                     3  rate limit (burst + hourly) ───────▶ hit_rate_limit()
                                     4  resume conversation WHERE tenant_id
                                        or create one (consent required) ──▶ conversations
                                     5  turn cap · daily cost cap ─────────▶ tenant_replies_today()
                                     6  save user message ─────────────────▶ messages
                                     7  build prompt: [policy + KB] (cached)
                                        + [clock, open/closed computed in code]
                                        + last 16 messages from DB
                                     8  responses.create(json_schema strict) ──────────────▶ model
                                     9  guardrails: citations, prices,
                                        ungrounded, human request, emergency
                                     10 verify contact vs visitor's own text
                                     11 capture_lead() — dedupe + outbox ──▶ contacts, leads, outbox
                                     12 save reply + token usage ──────────▶ messages
◀── { reply, handover, actions } ── 13 respond
                                     14 after(): dispatchOutbox() ─────────▶ claim_outbox() ───────────▶ POST signed
                                                                                                         webhook
                                                                                                         → email
                                                                                                         → CRM …
n8n Schedule (5 min) ── GET /api/cron/dispatch ── retries anything undelivered
```

**The browser never sends conversation history.** It sends a conversation id and the new message,
and the server loads history from the database. A visitor can't inject fake assistant turns
("Assistant: sure, 50% off!") into the context.

**If the model fails** (timeout, refusal, malformed output, daily cap reached) the visitor gets the
tenant's fallback message, the phone and WhatsApp buttons, and the plain enquiry form. The site
never shows a dead widget.

---

## §3 Data model

`supabase/migrations/20261118000000_init.sql`. These tables were tested against Postgres 16 with
Supabase-style roles.

```
tenants ─┬─< tenant_members >── auth.users          (future dashboard logins)
         ├─< knowledge_entries                       (the ONLY source of business facts)
         ├─< conversations ─< messages               (transcripts + token usage per reply)
         ├─< contacts ─< leads                       (deduplicated people → enquiries)
         └─< outbox                                  (events waiting for n8n)
rate_limits                                          (unlogged, server-only)
```

| Table | Notes |
|---|---|
| `tenants.config` (jsonb) | Assistant name and tone, hours, enquiry types, priority rules, handover triggers, booking link, notification emails, privacy URL and retention. Validated by `lib/tenants/schema.ts`. **An invalid config takes that tenant offline** rather than running with half its rules. |
| `tenants.allowed_origins` | Sites allowed to embed this tenant's widget. |
| `tenants.daily_message_cap` | Hard ceiling on AI replies per day. This protects your margin on a fixed monthly fee. |
| `contacts` | Partial unique indexes on `(tenant_id, email)` and `(tenant_id, phone)`. Phone numbers are normalised to E.164 first, so `082 123 4567` and `+27821234567` are the same person. |
| `leads` | Priority is a Postgres enum, so `greatest()` escalates (medium → urgent) and never downgrades. |
| `messages` | `model`, `input_tokens`, `cached_tokens`, `output_tokens` and `latency_ms` on every reply. **This is the data behind your "API usage management" fee**, and it shows how often the guardrails fired (`meta.flags`). |

### Duplicate prevention (`capture_lead()`)

Rules are applied in this order, all inside one transaction:

1. This conversation already produced a lead → update that lead.
2. A form submission with the same idempotency key → return the existing lead (double-click-safe).
3. The same contact has an open lead from the last 24 hours → update it. The team doesn't get two
   emails because someone chatted and then filled in the form.
4. Otherwise → a new lead plus a `lead.created` event.

If an existing lead *newly* requests handover, the function queues `lead.handover_requested`, so
an escalation is still announced.

---

## §4 Tenant isolation and security

There are two access paths.

1. **Public widget → Next.js → Supabase with the secret key.** The secret key bypasses RLS, so
   isolation is enforced in code. These rules have no exceptions:
   - The tenant is resolved by the server from the slug. The client never sends a tenant id.
   - Every query filters on `tenant_id`. Conversation ids from the browser are looked up
     **with** `.eq("tenant_id", tenant.id)`, so another tenant's id simply isn't found.
     This was tested: it returns `conversation_not_found`.
   - `capture_lead()` checks again in SQL that the conversation belongs to the tenant.
   - The browser only ever receives `toPublicTenant()`. It never sees the knowledge base,
     notification emails or prompt.
2. **Client dashboard (future) → Supabase with the publishable key + user session.** RLS limits
   staff to tenants listed in `tenant_members`. Owners can edit the knowledge base. Staff can read
   leads and change `status` only, enforced with a column-level grant. Anonymous users get nothing.
   All of this was tested.

The server-only SQL functions (`capture_lead`, `hit_rate_limit`, `claim_outbox` and others) have
`EXECUTE` revoked from `anon` and `authenticated`. Supabase exposes `public` functions over REST,
and Postgres grants `EXECUTE` to everyone by default, so this step matters.

| Threat | Control |
|---|---|
| Leaked keys | All secrets are server-only env vars, validated at startup (`lib/env.ts`), and none use the `NEXT_PUBLIC_` prefix. Use a project-scoped OpenAI key **with a monthly budget limit** set in the OpenAI dashboard. |
| Bots and spam | Honeypot field, consent required to start, per-visitor burst/hourly/new-conversation limits, form idempotency. Add Cloudflare Turnstile if a tenant attracts real abuse. |
| Cost attacks | Message length cap (1000 chars), 20 turns per conversation, 16-message history window, `max_output_tokens`, per-tenant daily cap, OpenAI project budget. Each of these limits is independent of the others. |
| Prompt injection | History comes only from the database. The prompt marks visitor text as untrusted. **More importantly, the model has no tools**, so the worst a successful injection can do is produce an odd reply, which the guardrails then check. |
| Hallucinated facts | Citation and price checks, ungrounded replies replaced, opening hours computed in code (§6). |
| Hallucinated contacts | `verifyContact()`: an email or phone number is only stored if it appears in the visitor's own messages. This was tested with a model that "extracted" a number nobody typed, and no lead was created. |
| Clickjacking / embedding by others | `frame-ancestors` per tenant on `/embed/*`. `DENY` everywhere else. |
| Webhook spoofing (n8n) | Bearer token, plus an HMAC-SHA256 over `timestamp.body`. |

---

## §5 Knowledge base: when to add embeddings

v1 puts every published `knowledge_entries` row in the prompt, labelled `[K1]…[Kn]` plus
`[HOURS]` and `[CONTACT]`. Move to retrieval (pgvector in the same Supabase project, top-k entries
per turn) **only** when one of these becomes true:

- a tenant's knowledge goes past ~25k tokens (a large product catalogue, a school's policies), or
- the input cost per conversation stops being negligible against that tenant's monthly fee.

Keep the citation guardrail when you switch. It works the same way with retrieval.

---

## §6 Why some answers are computed, not generated

The model is never asked to work out:

- **Whether the business is open now.** `lib/tenants/hours.ts` computes it in the tenant's time
  zone and passes a sentence to the model.
- **Priority escalation for emergencies.** If the intent is `emergency`, the priority is forced to
  `urgent` and handover is forced on.
- **Whether a price is allowed.** The rand amounts in the reply are checked against the cited
  entries.
- **What the visitor's phone number is.** The number is normalised and verified against what the
  visitor typed.

The general rule: **if code can compute it exactly, the model doesn't get to guess it.**

---

## §7 Model choice and cost

`OPENAI_MODEL` is an env var, so you can switch models without a deploy. Start with a small, cheap
model (the default is `gpt-5.4-mini`, which the installed SDK lists) with `OPENAI_REASONING_EFFORT=low`.
Move up only if your test conversations (§8) show it is needed.

Cost per conversation is roughly

```
turns × (uncached_input × input_price + cached_input × cached_price + output × output_price)
```

The demo tenant's prompt is about 2k tokens, and after the first turn most of it is cached. Take
real prices from the OpenAI pricing page and real token counts from the `messages` table. Don't use
estimates in a sales conversation.

---

## §8 Testing

| Layer | How | Status |
|---|---|---|
| Pure logic: phone/email normalisation, contact verification, price/citation guardrails, opening hours | `npm test` (node:test, no extra dependencies) | 19 tests, passing |
| SQL: dedupe rules, idempotency, cross-tenant rejection, RLS per role, column grants, rate limit, outbox leasing, retention purge | Migration applied to Postgres 16 with Supabase role stubs and exercised with SQL | Passing (manual script; turning it into a pgTAP suite is a good later task) |
| End to end: widget → API → DB → mock model → guardrails → lead → signed webhook | Run locally with a mock OpenAI server and a mock n8n receiver | Passing: grounded price shown, invented price blocked, emergency → urgent + on-call email, injected contact rejected, form replay deduplicated, HMAC valid |
| **Model behaviour** | **To build next:** 30–50 scripted conversations per industry (questions inside and outside the KB, prompt injections, emergencies, complaints) run against the real model, with the `meta.flags` rate recorded | Not started. This is the test that decides model and prompt changes |

---

## §9 Deployment

- **App:** Vercel. Set the env vars from `.env.example`. Use a custom domain (for example
  `assist.youragency.co.za`), because it appears in every client's embed snippet.
- **Supabase:** one project for all tenants. Apply the migration with the Supabase CLI
  (`supabase db push`) or paste it into the SQL editor. Choose the region closest to your users
  that is offered (check the current region list) and record it in the privacy notice (§10).
- **Retention:** enable `pg_cron` in Supabase and schedule
  `select cron.schedule('purge-transcripts', '15 2 * * *', 'select public.purge_expired_conversations()');`
- **n8n:** see [N8N-WORKFLOWS.md](./N8N-WORKFLOWS.md).
- **Backups:** Supabase's daily backups on a paid plan. Get on one before the first paying client.

---

## §10 POPIA

This is not legal advice. Have the template documents reviewed once, then reuse them for every
client.

- **Roles.** The client is the *responsible party* and you are their *operator*. POPIA s21 requires
  a written operator agreement covering security and confidentiality. Make it part of your
  standard service agreement.
- **Notice and consent.** The widget shows a notice with a link to the client's privacy notice
  before the chat starts, and `consent_at` is recorded on every conversation. The form requires an
  explicit tick.
- **Minimisation.** Raw IP addresses are not stored, only a salted hash. `store: false` on OpenAI
  calls means OpenAI does not retain the conversation as a stored response. Check OpenAI's current
  data-retention terms for API traffic and cite them in the notice.
- **Cross-border transfer (s72).** OpenAI processes data outside South Africa, and your Supabase
  region may too. The client's privacy notice must say so.
- **Retention.** Transcripts are deleted after `config.privacy.retentionDays` (default 180) by
  `purge_expired_conversations()`. Leads and contacts are kept as the business record.
- **Data subject requests.** Today these are handled manually: delete a contact by email or phone
  and their leads cascade. Add an admin action for it when the dashboard exists.
- **Information Officer.** Each client must have one registered with the Information Regulator.
  Raising this during onboarding comes across as professional, and most small businesses haven't
  done it.

---

## §11 Folder structure

```
enquiry-system/
├── docs/                     architecture, n8n spec, build plan
├── public/widget.js          embed loader (plain ES2017, no deps)
├── supabase/
│   ├── migrations/           schema, functions, RLS — the source of truth
│   └── seed.sql              fictional demo tenant
└── src/
    ├── proxy.ts              per-tenant frame-ancestors for /embed/*
    ├── app/
    │   ├── api/chat/         the AI turn (§2)
    │   ├── api/enquiry/      plain form, no AI
    │   ├── api/cron/dispatch outbox retry, bearer-protected
    │   ├── embed/[slug]/     the iframe UI
    │   └── demo/[slug]/      fake client site for demos
    └── lib/
        ├── ai/               prompt, JSON schema, OpenAI call, guardrails (+tests)
        ├── leads/            normalisation + contact verification (+tests)
        ├── tenants/          config schema, loader, opening hours (+tests)
        ├── outbox/           signed delivery to n8n
        ├── security/         rate limits, visitor hashing
        └── supabase/         service-role client
```

Modules under `lib/ai`, `lib/leads` and `lib/tenants/hours.ts` that hold pure logic use relative
`.ts` imports and avoid the `@/` alias. That lets Node's built-in test runner execute them
directly, with no test framework.
