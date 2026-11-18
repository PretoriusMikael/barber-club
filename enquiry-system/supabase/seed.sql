-- Demo tenant for local development and sales demos.
-- Fictional business. Do not demo with a real company's details unless they
-- have agreed to it — use their own tenant, in their own pitch, instead.

insert into public.tenants (slug, name, industry, timezone, allowed_origins, daily_message_cap, config)
values (
  'fynbos-plumbing-demo',
  'Fynbos Plumbing & Electrical (Demo)',
  'Plumbing and electrical',
  'Africa/Johannesburg',
  array['http://localhost:3100', 'http://localhost:3000'],
  200,
  $json${
    "assistant": {
      "name": "Fynn",
      "greeting": "Hi, I'm Fynn, the Fynbos Plumbing & Electrical assistant. I can answer questions about our services, call-out fees and areas, or pass your enquiry to the team.",
      "tone": "Warm, concise, practical. Plain South African English. No jargon."
    },
    "theme": { "accent": "#0f766e" },
    "contact": {
      "phone": "021 000 0000",
      "email": "office@example.com",
      "whatsapp": "27210000000",
      "address": "Unit 4, Example Business Park, Bellville, Cape Town"
    },
    "hours": {
      "mon": [["07:30", "17:00"]],
      "tue": [["07:30", "17:00"]],
      "wed": [["07:30", "17:00"]],
      "thu": [["07:30", "17:00"]],
      "fri": [["07:30", "16:00"]],
      "sat": [["08:00", "12:00"]],
      "sun": []
    },
    "enquiryTypes": [
      { "key": "emergency", "label": "Emergency call-out", "description": "Burst pipe, major leak, flooding, no power, sparking, burning smell, no hot water with a leaking geyser." },
      { "key": "quote", "label": "Quote request", "description": "Planned work: renovations, new installations, geyser replacement, solar/backup power, DB board upgrades." },
      { "key": "repair", "label": "Repair booking", "description": "Non-urgent faults: dripping taps, blocked drains, tripping circuits, faulty plugs or lights." },
      { "key": "coc", "label": "Certificate of compliance", "description": "Electrical or plumbing CoC, usually for a property sale." },
      { "key": "other", "label": "Other", "description": "Anything else, including complaints and existing jobs." }
    ],
    "priorityRules": [
      "urgent: water actively leaking or flooding, electrical sparking, burning smell, or anything that sounds like a safety risk.",
      "high: no hot water, no power to part of the house, property transfer deadline within 7 days, or a commercial client.",
      "medium: a planned job or quote with a clear scope.",
      "low: general questions with no job attached."
    ],
    "handover": {
      "triggers": [
        "Any safety risk: tell them to switch off the mains water or power at the main switch if it is safe to do so, and phone us immediately.",
        "Complaints about previous work, refunds, or disputes.",
        "Exact quotes: we never quote without seeing the job.",
        "Anything not covered by the business information."
      ],
      "message": "I've passed this to the team and someone will get back to you. If it's urgent, please phone us."
    },
    "booking": { "url": null, "label": "Book a call-out" },
    "notifications": {
      "email": ["office@example.com"],
      "urgentEmail": ["oncall@example.com"]
    },
    "privacy": { "noticeUrl": "https://example.com/privacy", "retentionDays": 180 },
    "fallbackMessage": "I don't have that information, so I'd rather not guess. I can pass your question to the team — just leave your name and a phone number or email."
  }$json$::jsonb
);

insert into public.knowledge_entries (tenant_id, kind, title, body, sort_order)
select t.id, e.kind::public.knowledge_kind, e.title, e.body, e.sort_order
from public.tenants t
cross join (values
  ('about', 'About us', 'Family-run plumbing and electrical business serving the Northern Suburbs of Cape Town since 2012. Registered plumbers (PIRB) and electricians with a wireman''s licence. All work guaranteed for 12 months.', 0),
  ('location', 'Service area', 'We work in Bellville, Durbanville, Brackenfell, Kuils River, Parow, Goodwood, Edgemead and Table View. Outside these areas, ask and we will confirm.', 1),
  ('service', 'Call-out fee', 'Call-out fee is R650 during business hours, including the first 30 minutes on site. After-hours and weekend emergency call-out is R1,200, including the first 30 minutes. Labour after that is billed per 30 minutes; materials are extra.', 2),
  ('service', 'Geyser replacement', 'We replace electric geysers (100L to 200L) and install heat pumps and solar geysers. Price depends on size, access and compliance work, so we quote after a site visit. Insurance claims: we work with most insurers and can provide the report they need.', 3),
  ('service', 'Electrical certificate of compliance (CoC)', 'Electrical CoC inspections for property sales. Inspection fee is R1,950 for a standard house up to 3 bedrooms. Any remedial work needed to issue the certificate is quoted separately after the inspection.', 4),
  ('service', 'Drain unblocking', 'Blocked drains, toilets and sinks. Standard business-hours call-out fee applies. We use drain machines and can do a camera inspection for recurring blockages.', 5),
  ('faq', 'Do you give quotes over the phone?', 'Only the call-out fee and the CoC inspection fee are fixed. Everything else is quoted after we have seen the job, because access and existing installations change the price.', 6),
  ('faq', 'How quickly can you come out?', 'Emergencies are attended as soon as a technician is free, usually the same day. Non-urgent work is normally booked within 2 to 4 working days. We do not guarantee arrival times until the office confirms the booking.', 7),
  ('faq', 'Payment methods', 'EFT and card on completion. Deposits of 50% apply to quotes over R10,000.', 8),
  ('policy', 'Cancellations', 'Please give 24 hours notice to cancel a booked job. Late cancellations may be charged the call-out fee.', 9)
) as e(kind, title, body, sort_order)
where t.slug = 'fynbos-plumbing-demo';
