-- Elevate (elevate-web.co.za): the first real tenant, and the test bed.
-- Facts come from the Elevate site's source. Re-runnable: updates in place.
-- The knowledge base is imported separately: see tenants/elevate/README.md.

insert into public.tenants (slug, name, industry, timezone, allowed_origins, daily_message_cap, config)
values (
  'elevate',
  'Elevate',
  'Web design and development studio, Stellenbosch',
  'Africa/Johannesburg',
  array[
    'https://elevate-web.co.za',
    'https://www.elevate-web.co.za',
    'http://localhost:3000'
    -- Add the portfolio branch's Vercel preview URL here to test on a preview.
  ],
  150,
  $json${
    "assistant": {
      "name": "Elevate assistant",
      "greeting": "Hi, I'm the Elevate assistant. I can help you find your way around the site, from packages and prices to past work and how a project runs, or pass a message to Mikael.",
      "tone": "Calm, warm, plain South African English. You are the site's assistant, not Mikael: refer to him as Mikael, in the third person. Do not use dashes as punctuation. When a question is better answered by a page, say so and suggest the page."
    },
    "theme": { "accent": "#15589E" },
    "contact": {
      "phone": "082 756 3036",
      "email": "mikaelpretorius@gmail.com",
      "whatsapp": "27827563036"
    },
    "enquiryTypes": [
      { "key": "landing", "label": "Landing website", "description": "One service in one place, one to three pages." },
      { "key": "business", "label": "Business website", "description": "Services, prices, a timetable or menu, a team; five to eight pages." },
      { "key": "multi_location", "label": "Multi-location website", "description": "Several branches, each with its own page." },
      { "key": "web_app", "label": "Web app", "description": "Logins, dashboards, anything people use rather than read." },
      { "key": "webgl", "label": "3D and WebGL", "description": "A 3D or WebGL scene, on its own or in an existing site." },
      { "key": "care", "label": "Care: hosting and upkeep", "description": "Hosting, updates and monthly changes for a site." },
      { "key": "other", "label": "Something else", "description": "Anything else, including general questions." }
    ],
    "priorityRules": [
      "high: wants to start soon, has a deadline, asks to book a call, or asks for a multi-location website or a web app.",
      "medium: describes a specific project for their business.",
      "low: general questions, browsing, students, or anything without a project attached."
    ],
    "handover": {
      "triggers": [
        "A price for anything 'priced after a conversation': multi-location websites, web apps and 3D work.",
        "A fixed quote, a discount, or a payment arrangement not stated in the business information.",
        "Questions about a project already under way with Mikael.",
        "Anything not covered by the business information."
      ],
      "message": "I've passed this to Mikael. He replies within 24 hours."
    },
    "booking": { "url": "https://cal.com/mikael-pretorius/15min", "label": "Book a 15-minute call" },
    "notifications": { "email": ["mikaelpretorius@gmail.com"] },
    "privacy": { "noticeUrl": "https://elevate-web.co.za/privacy", "retentionDays": 180 },
    "fallbackMessage": "I don't have that information, so I won't guess. Leave your name and an email or phone number and Mikael will get back to you within 24 hours."
  }$json$::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  industry = excluded.industry,
  allowed_origins = excluded.allowed_origins,
  daily_message_cap = excluded.daily_message_cap,
  config = excluded.config,
  updated_at = now();
