-- =============================================================================
-- Intelligent Enquiry System — initial schema
--
-- Multi-tenant by row: every business-owned row carries tenant_id.
--
-- Two access paths, and only two:
--   1. The Next.js server, using the Supabase secret (service_role) key.
--      Bypasses RLS, so the server code is responsible for scoping every query
--      by a tenant it resolved itself. Public widget traffic only ever takes
--      this path — the browser never talks to Supabase directly.
--   2. Signed-in tenant staff (future client dashboard), using the publishable
--      key + a user session. RLS limits them to tenants they are a member of.
--
-- The anon role gets nothing: RLS is on everywhere and no policy names anon.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------

-- Declaration order matters: greatest(a, b) on this enum returns the more urgent.
create type public.lead_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost', 'spam');
create type public.lead_source as enum ('chat', 'form');
create type public.conversation_status as enum ('open', 'handover', 'closed');
create type public.message_role as enum ('user', 'assistant');
create type public.knowledge_kind as enum ('about', 'service', 'faq', 'policy', 'location');
create type public.member_role as enum ('owner', 'staff');

-- -----------------------------------------------------------------------------
-- Tenants and membership
-- -----------------------------------------------------------------------------

create table public.tenants (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,47}$'),
  name              text not null,
  industry          text,
  status            text not null default 'active' check (status in ('active', 'paused')),
  timezone          text not null default 'Africa/Johannesburg',
  -- Sites allowed to embed the widget (CSP frame-ancestors). e.g. https://example.co.za
  allowed_origins   text[] not null default '{}',
  -- Cost ceiling: AI replies per tenant per UTC day. Beyond it the widget
  -- degrades to contact details + the plain enquiry form.
  daily_message_cap integer not null default 400 check (daily_message_cap >= 0),
  -- Validated by src/lib/tenants/schema.ts. Never trust it without parsing.
  config            jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on public.tenant_members (user_id);

-- -----------------------------------------------------------------------------
-- Knowledge base: the ONLY source the assistant may answer business facts from.
-- Small businesses have small knowledge bases, so v1 puts every published entry
-- in the prompt. No embeddings until a tenant outgrows that (see ARCHITECTURE §5).
-- -----------------------------------------------------------------------------

create table public.knowledge_entries (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id) on delete cascade,
  kind         public.knowledge_kind not null,
  title        text not null check (char_length(title) <= 200),
  body         text not null check (char_length(body) <= 4000),
  is_published boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index knowledge_entries_tenant_idx on public.knowledge_entries (tenant_id, is_published, kind, sort_order);

-- -----------------------------------------------------------------------------
-- Contacts and leads
-- -----------------------------------------------------------------------------

create table public.contacts (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  name       text,
  email      text check (email is null or email = lower(email)),   -- normalised by the app
  phone      text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'), -- E.164
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);
-- Duplicate prevention: one contact per email and per phone, per tenant.
create unique index contacts_tenant_email_uniq on public.contacts (tenant_id, email) where email is not null;
create unique index contacts_tenant_phone_uniq on public.contacts (tenant_id, phone) where phone is not null;

create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants (id) on delete cascade,
  status           public.conversation_status not null default 'open',
  -- Salted hash of IP + user agent. For rate limiting and abuse review only.
  visitor_hash     text not null,
  page_url         text,
  consent_at       timestamptz not null, -- POPIA: no conversation without notice + consent
  lead_id          uuid, -- FK added below (leads references conversations too)
  message_count    integer not null default 0,
  created_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now()
);
create index conversations_tenant_idx on public.conversations (tenant_id, created_at desc);

create table public.leads (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references public.tenants (id) on delete cascade,
  contact_id             uuid not null references public.contacts (id) on delete cascade,
  first_conversation_id  uuid references public.conversations (id) on delete set null,
  source                 public.lead_source not null,
  enquiry_type           text not null default 'other',
  priority               public.lead_priority not null default 'medium',
  status                 public.lead_status not null default 'new',
  summary                text not null default '',
  message                text,             -- form submissions: the visitor's own words
  handover_requested     boolean not null default false,
  idempotency_key        text,             -- form double-submit protection
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index leads_tenant_idx on public.leads (tenant_id, created_at desc);
create index leads_contact_open_idx on public.leads (contact_id, created_at desc) where status in ('new', 'contacted');
create unique index leads_idempotency_uniq on public.leads (tenant_id, idempotency_key) where idempotency_key is not null;

alter table public.conversations
  add constraint conversations_lead_fk foreign key (lead_id) references public.leads (id) on delete set null;

create table public.messages (
  id             bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  role           public.message_role not null,
  content        text not null,
  -- intent, enquiry_type, cited refs, guardrail outcomes. Never contains the prompt.
  meta           jsonb not null default '{}'::jsonb,
  -- Usage accounting: this is what the monthly "API usage management" fee is based on.
  model          text,
  input_tokens   integer,
  cached_tokens  integer,
  output_tokens  integer,
  latency_ms     integer,
  created_at     timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, id);
create index messages_tenant_day_idx on public.messages (tenant_id, created_at) where role = 'assistant';

-- -----------------------------------------------------------------------------
-- Outbox: side effects (notifications, CRM sync) are recorded in the same
-- transaction as the lead, then delivered to n8n at-least-once. A crashed
-- request or an n8n outage delays a notification; it never loses one.
-- -----------------------------------------------------------------------------

create table public.outbox (
  id              bigint generated always as identity primary key,
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  event_type      text not null,
  payload         jsonb not null default '{}'::jsonb,
  attempts        integer not null default 0,
  last_error      text,
  next_attempt_at timestamptz not null default now(),
  delivered_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index outbox_pending_idx on public.outbox (next_attempt_at) where delivered_at is null;

-- -----------------------------------------------------------------------------
-- Rate limiting (fixed window). Lives in Postgres because serverless functions
-- share no memory; avoids adding Redis before there is revenue to pay for it.
-- -----------------------------------------------------------------------------

create unlogged table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);

-- =============================================================================
-- Functions (server-only: execute revoked from anon/authenticated below)
-- =============================================================================

-- Returns true if the call is allowed. Atomic under concurrency.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup, ~1% of calls.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;

  return v_hits <= p_max;
end;
$$;

-- AI replies sent today (UTC) for a tenant: the daily cost ceiling check.
create or replace function public.tenant_replies_today(p_tenant_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.messages
  where tenant_id = p_tenant_id
    and role = 'assistant'
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
$$;

-- Create-or-merge a contact, then create-or-update a lead, then queue the
-- notification. One transaction, so there is never a lead without its event
-- or an event without its lead.
--
-- Duplicate rules, in order:
--   1. The conversation already produced a lead        -> update that lead
--   2. Same form idempotency key                       -> return that lead
--   3. Same contact has an open lead from the last 24h -> update that lead
--   4. Otherwise                                       -> new lead + 'lead.created'
-- A lead that newly requests handover queues 'lead.handover_requested'.
create or replace function public.capture_lead(
  p_tenant_id        uuid,
  p_conversation_id  uuid,
  p_source           public.lead_source,
  p_name             text,
  p_email            text,
  p_phone            text,
  p_enquiry_type     text,
  p_priority         public.lead_priority,
  p_summary          text,
  p_message          text,
  p_handover         boolean,
  p_idempotency_key  text
)
returns table (lead_id uuid, contact_id uuid, created boolean)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_email      text := nullif(lower(trim(p_email)), '');
  v_phone      text := nullif(trim(p_phone), '');
  v_name       text := nullif(trim(p_name), '');
  v_contact_id uuid;
  v_lead_id    uuid;
  v_prev_handover boolean;
  v_created    boolean := false;
begin
  if v_email is null and v_phone is null then
    raise exception 'capture_lead: email or phone required' using errcode = '22023';
  end if;

  if p_conversation_id is not null and not exists (
    select 1 from public.conversations c where c.id = p_conversation_id and c.tenant_id = p_tenant_id
  ) then
    raise exception 'capture_lead: conversation does not belong to tenant' using errcode = '42501';
  end if;

  -- Contact: find by email or phone, else create (handling a concurrent insert).
  select c.id into v_contact_id
  from public.contacts c
  where c.tenant_id = p_tenant_id
    and ((v_email is not null and c.email = v_email) or (v_phone is not null and c.phone = v_phone))
  order by c.created_at
  limit 1;

  if v_contact_id is null then
    insert into public.contacts (tenant_id, name, email, phone)
    values (p_tenant_id, v_name, v_email, v_phone)
    on conflict do nothing
    returning id into v_contact_id;

    if v_contact_id is null then
      select c.id into v_contact_id
      from public.contacts c
      where c.tenant_id = p_tenant_id
        and ((v_email is not null and c.email = v_email) or (v_phone is not null and c.phone = v_phone))
      limit 1;
    end if;
  else
    -- Fill gaps only; never overwrite a detail with one owned by another contact.
    update public.contacts c set
      name  = coalesce(v_name, c.name),
      email = case when c.email is null and v_email is not null and not exists (
                select 1 from public.contacts o where o.tenant_id = p_tenant_id and o.email = v_email
              ) then v_email else c.email end,
      phone = case when c.phone is null and v_phone is not null and not exists (
                select 1 from public.contacts o where o.tenant_id = p_tenant_id and o.phone = v_phone
              ) then v_phone else c.phone end,
      updated_at = now()
    where c.id = v_contact_id;
  end if;

  -- Rule 1: this conversation already has a lead.
  if p_conversation_id is not null then
    select c.lead_id into v_lead_id from public.conversations c where c.id = p_conversation_id for update;
  end if;

  -- Rule 2: form resubmission.
  if v_lead_id is null and p_idempotency_key is not null then
    select l.id into v_lead_id from public.leads l
    where l.tenant_id = p_tenant_id and l.idempotency_key = p_idempotency_key;
    if v_lead_id is not null then
      return query select v_lead_id, v_contact_id, false;
      return;
    end if;
  end if;

  -- Rule 3: same person, open lead, last 24 hours.
  if v_lead_id is null then
    select l.id into v_lead_id from public.leads l
    where l.contact_id = v_contact_id
      and l.status in ('new', 'contacted')
      and l.created_at > now() - interval '24 hours'
    order by l.created_at desc
    limit 1;
  end if;

  if v_lead_id is null then
    insert into public.leads (
      tenant_id, contact_id, first_conversation_id, source, enquiry_type, priority,
      summary, message, handover_requested, idempotency_key
    ) values (
      p_tenant_id, v_contact_id, p_conversation_id, p_source, coalesce(nullif(p_enquiry_type, ''), 'other'),
      p_priority, coalesce(p_summary, ''), p_message, coalesce(p_handover, false), p_idempotency_key
    )
    returning id into v_lead_id;
    v_created := true;

    insert into public.outbox (tenant_id, event_type, payload)
    values (p_tenant_id, 'lead.created', jsonb_build_object('lead_id', v_lead_id));
  else
    select l.handover_requested into v_prev_handover from public.leads l where l.id = v_lead_id for update;

    update public.leads l set
      priority           = greatest(l.priority, p_priority),
      enquiry_type       = case when l.enquiry_type = 'other' then coalesce(nullif(p_enquiry_type, ''), 'other') else l.enquiry_type end,
      summary            = coalesce(nullif(p_summary, ''), l.summary),
      message            = coalesce(l.message, p_message),
      handover_requested = l.handover_requested or coalesce(p_handover, false),
      updated_at         = now()
    where l.id = v_lead_id;

    if coalesce(p_handover, false) and not v_prev_handover then
      insert into public.outbox (tenant_id, event_type, payload)
      values (p_tenant_id, 'lead.handover_requested', jsonb_build_object('lead_id', v_lead_id));
    end if;
  end if;

  if p_conversation_id is not null then
    update public.conversations c set
      lead_id = v_lead_id,
      status  = case when coalesce(p_handover, false) then 'handover'::public.conversation_status else c.status end
    where c.id = p_conversation_id;
  end if;

  return query select v_lead_id, v_contact_id, v_created;
end;
$$;

-- Lease up to p_limit due outbox events. SKIP LOCKED lets the post-request
-- dispatcher and the scheduled retry run at the same time without
-- double-claiming. The 2-minute lease means a crashed sender's events come back.
create or replace function public.claim_outbox(p_limit integer default 20, p_tenant_id uuid default null)
returns setof public.outbox
language sql
set search_path = ''
as $$
  update public.outbox o
  set next_attempt_at = now() + interval '2 minutes',
      attempts = o.attempts + 1
  where o.id in (
    select id from public.outbox
    where delivered_at is null
      and next_attempt_at <= now()
      and attempts < 8
      and (p_tenant_id is null or tenant_id = p_tenant_id)
    order by id
    limit p_limit
    for update skip locked
  )
  returning o.*;
$$;

-- POPIA retention. Deletes transcripts older than each tenant's retention
-- window; leads and contacts are kept (they are the business record).
-- Schedule with pg_cron — see docs/ARCHITECTURE.md §9.
create or replace function public.purge_expired_conversations()
returns integer
language sql
set search_path = ''
as $$
  with deleted as (
    delete from public.conversations c
    using public.tenants t
    where c.tenant_id = t.id
      and c.last_message_at < now() - make_interval(days => coalesce((t.config -> 'privacy' ->> 'retentionDays')::integer, 180))
    returning 1
  )
  select count(*)::integer from deleted;
$$;

-- Membership check used by RLS. SECURITY DEFINER so the policy on
-- tenant_members does not recurse into itself.
create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = p_tenant_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = p_tenant_id and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

-- Postgres grants EXECUTE to PUBLIC by default, and Supabase exposes public
-- functions over its REST API. Lock the server-only functions down.
revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.tenant_replies_today(uuid) from public, anon, authenticated;
revoke execute on function public.capture_lead(uuid, uuid, public.lead_source, text, text, text, text, public.lead_priority, text, text, boolean, text) from public, anon, authenticated;
revoke execute on function public.claim_outbox(integer, uuid) from public, anon, authenticated;
revoke execute on function public.purge_expired_conversations() from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.tenant_replies_today(uuid) to service_role;
grant execute on function public.capture_lead(uuid, uuid, public.lead_source, text, text, text, text, public.lead_priority, text, text, boolean, text) to service_role;
grant execute on function public.claim_outbox(integer, uuid) to service_role;
grant execute on function public.purge_expired_conversations() to service_role;

revoke execute on function public.is_tenant_member(uuid) from public, anon;
revoke execute on function public.is_tenant_owner(uuid) from public, anon;
grant execute on function public.is_tenant_member(uuid) to authenticated, service_role;
grant execute on function public.is_tenant_owner(uuid) to authenticated, service_role;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.tenants           enable row level security;
alter table public.tenant_members    enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.contacts          enable row level security;
alter table public.conversations     enable row level security;
alter table public.leads             enable row level security;
alter table public.messages          enable row level security;
alter table public.outbox            enable row level security; -- no policies: server only
alter table public.rate_limits       enable row level security; -- no policies: server only

-- Members see their own tenant.
create policy tenants_member_select on public.tenants
  for select to authenticated using (public.is_tenant_member(id));

create policy tenant_members_self_select on public.tenant_members
  for select to authenticated using (user_id = (select auth.uid()));

-- Knowledge base: members read, owners edit.
create policy knowledge_member_select on public.knowledge_entries
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy knowledge_owner_insert on public.knowledge_entries
  for insert to authenticated with check (public.is_tenant_owner(tenant_id));
create policy knowledge_owner_update on public.knowledge_entries
  for update to authenticated using (public.is_tenant_owner(tenant_id)) with check (public.is_tenant_owner(tenant_id));
create policy knowledge_owner_delete on public.knowledge_entries
  for delete to authenticated using (public.is_tenant_owner(tenant_id));

-- Lead inbox: members read, and update (status changes).
create policy contacts_member_select on public.contacts
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy leads_member_select on public.leads
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy leads_member_update on public.leads
  for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy conversations_member_select on public.conversations
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy messages_member_select on public.messages
  for select to authenticated using (public.is_tenant_member(tenant_id));

-- Column-level guard: staff may change a lead's status, nothing else.
revoke update on public.leads from authenticated;
grant update (status, updated_at) on public.leads to authenticated;
