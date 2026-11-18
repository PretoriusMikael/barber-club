# n8n workflows

n8n owns everything that happens **after** a lead exists. One set of workflows serves every tenant,
because each event carries the tenant's name, the recipients and the full lead. You never clone a
workflow per client.

> Node names and options below are as of writing. n8n changes its UI between versions, so check
> each step in your own instance on Day 2. The HTTP contract (payload, headers) is fixed by this
> codebase and won't change under you.

---

## The contract: what the app sends

`POST {N8N_WEBHOOK_URL}`. Delivery is **at least once**: retried with backoff for up to 8 attempts
whenever n8n doesn't return 2xx.

Headers:

| Header | Value |
|---|---|
| `Authorization` | `Bearer {N8N_WEBHOOK_SECRET}` |
| `X-Enquiry-Event-Id` | Outbox id. The same id on a retry, so you can dedupe on it |
| `X-Enquiry-Timestamp` | Unix seconds |
| `X-Enquiry-Signature` | `sha256=` + hex HMAC-SHA256 of `{timestamp}.{raw body}` keyed with the secret |

Body (`lead.created` or `lead.handover_requested`):

```json
{
  "id": 1,
  "type": "lead.created",
  "occurred_at": "2026-11-18T16:55:02.120Z",
  "tenant": { "slug": "fynbos-plumbing-demo", "name": "Fynbos Plumbing & Electrical (Demo)" },
  "notify": { "email": ["office@example.com", "oncall@example.com"] },
  "lead": {
    "id": "8774b8d5-…",
    "source": "chat",
    "enquiry_type": "emergency",
    "enquiry_label": "Emergency call-out",
    "priority": "urgent",
    "status": "new",
    "summary": "Burst pipe in kitchen, Bellville",
    "message": null,
    "handover_requested": true,
    "created_at": "…",
    "contact": { "name": "Thandi", "email": null, "phone": "+27821234567" }
  },
  "transcript": [{ "role": "user", "content": "…", "at": "…" }]
}
```

`notify.email` already includes the urgent recipients when `priority` is `urgent`. That routing
lives in the tenant config, so n8n doesn't need to know about it.

---

## Workflow 1 — "Lead events" (build this on Day 2–5)

```
Webhook (POST, Header Auth)
  → Switch on {{$json.body.type}}
      lead.created            → Set (format email) → Send Email / Gmail → Respond 200
      lead.handover_requested → Set (format "ESCALATION") → Send Email → Respond 200
```

1. **Webhook node.** Method `POST`. Authentication: **Header Auth**, with a credential whose
   header name is `Authorization` and whose value is `Bearer <N8N_WEBHOOK_SECRET>`.
   **Respond: "Using 'Respond to Webhook' node"** (or "When last node finishes"). Don't respond
   immediately: if the email step fails after n8n has already returned 200, the app marks the
   event delivered and the notification is lost. Returning an error makes the app retry.
2. **Switch** on the event type.
3. **Email.** Subject: `[{{priority}}] {{enquiry_label}} — {{contact.name}} via {{tenant.name}}`.
   Body: summary, a click-to-call phone link, the email, and the transcript joined line by line.
   Send to `notify.email`.
4. **Respond to Webhook** with 200 at the end of each branch.

Test it with the **test** webhook URL first, then switch `N8N_WEBHOOK_URL` to the **production**
URL. They are different URLs in n8n, and mixing them up is the usual reason "it worked in testing".

### Adding HMAC verification later (optional)

The bearer token is enough on day one. HMAC also proves the body wasn't altered, and the timestamp
lets you reject replays. In a Code node placed after the Webhook (the Webhook needs its raw-body
option enabled, so you can hash the exact bytes):

```js
// Self-hosted n8n: allow the built-in module with NODE_FUNCTION_ALLOW_BUILTIN=crypto
const crypto = require('crypto');
const ts = $json.headers['x-enquiry-timestamp'];
const expected = 'sha256=' + crypto.createHmac('sha256', $env.N8N_WEBHOOK_SECRET)
  .update(`${ts}.${rawBody}`).digest('hex');   // rawBody: the unparsed request body string
if ($json.headers['x-enquiry-signature'] !== expected) throw new Error('bad signature');
if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) throw new Error('stale');
return $input.all();
```

How you get at the raw body depends on your n8n version. Check the Webhook node's options.

---

## Workflow 2 — "Outbox retry"

```
Schedule Trigger (every 5 minutes)
  → HTTP Request: GET https://YOUR-APP/api/cron/dispatch
                  Header  Authorization: Bearer <CRON_SECRET>
```

This picks up anything that failed the first time (n8n restarting, an email provider outage).
Leasing happens in SQL (`claim_outbox` with `SKIP LOCKED`), so the retry and the post-request
dispatch never send the same event at the same moment.

---

## Workflow 3+ — what to sell next (all triggered by the same webhook)

Add each of these as another branch after the Switch. **None of them requires changing the app.**

| Branch | Value to the client | Notes |
|---|---|---|
| WhatsApp/SMS alert for `urgent` | Emergencies get seen in minutes, not hours | WhatsApp Business API (Meta Cloud API or a provider such as Twilio). Business verification takes days, so start it early |
| Google Sheet append | A "CRM" for clients who don't have one | Fastest win for the very small end |
| GoHighLevel contact + opportunity | Leads land in the client's pipeline | Use the HighLevel node or the HTTP Request node against their API v2, and confirm the endpoints in their docs first. Store each tenant's GHL credentials in n8n, keyed by `tenant.slug` |
| Follow-up sequence | "Still need help with your geyser?" after 24h if the status is still `new` | Needs the lead status, so query Supabase from n8n, or add a `lead.stale` event to the app |
| Weekly report per tenant | Leads, enquiry mix, response times. **This is the email that justifies the monthly fee.** | Schedule trigger → Supabase query → email |

---

## Hosting n8n

- **n8n Cloud.** No maintenance. Start here if you want to avoid ops work before you have revenue.
- **Self-hosted (Docker on a small VPS).** Cheaper per execution, and the data stays where you put
  it, which helps with the POPIA write-up. You take on updates and backups.
- **Licence.** n8n is under the Sustainable Use License. Running workflows that serve your own
  clients is generally the intended use, while reselling n8n itself as a hosted product is not.
  Read the current licence FAQ before offering anything that looks like "n8n hosting" to clients.
