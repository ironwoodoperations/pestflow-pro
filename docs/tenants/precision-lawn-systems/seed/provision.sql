-- Precision Lawn Systems — Phase One provisioning seed (S-PLS-3)
-- Applied to prod via Supabase MCP; this file is the reviewable record.
-- Idempotent throughout (ON CONFLICT ... DO UPDATE) per CLAUDE.md rule 7.
--
-- Deliberately UNSET (do not "fix" by filling in):
--   business_info.address / street_address  — §6.1 PO Box vs 700 Francis St unresolved.
--     The business_info_structured_shape CHECK requires the four structured
--     address keys as an all-or-nothing set, so with the street unresolved the
--     locality/region/postal keys are also omitted (Hawkins, TX 75765 goes in
--     once §6.1 is settled). Consequence: no PostalAddress in JSON-LD yet.
--   business_info.hours                     — unconfirmed
--   business_info.email, notifications.*    — §6.4 email migration off Yahoo pending
--   equipment/controller brands             — client has not confirmed stock
-- Vocabulary rules enforced in this data: "lawn" only inside the legal entity
-- name; "Serving East Texas since 2017" (never "10 years"); no retaining walls;
-- no competitor names; "irrigation" in the home meta title + description.

-- ── Tenant ────────────────────────────────────────────────────────────────────
INSERT INTO public.tenants (id, name, slug, subdomain, render_model, entitlement)
VALUES (gen_random_uuid(), 'Precision Lawn Systems LLC', 'pls', 'pls', 'standard', 2)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      subdomain = EXCLUDED.subdomain,
      render_model = EXCLUDED.render_model,
      entitlement = EXCLUDED.entitlement;

-- ── Settings (all 9 required keys + seo) ─────────────────────────────────────
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.settings (tenant_id, key, value)
SELECT t.id, v.key, v.value FROM t, (VALUES
  ('business_info', '{
    "name": "Precision Lawn Systems LLC",
    "phone": "903-747-7150",
    "email": "",
    "address": "",
    "hours": "",
    "tagline": "Sprinkler systems, drainage, and pump systems for East Texas",
    "industry": "irrigation and sprinkler system installation and repair, yard drainage and french drains, lake and pond pump systems, sod and grading — East Texas",
    "license": "LI23001",
    "founded_year": "2017",
    "timezone": "America/Chicago"
  }'::jsonb),
  ('branding', '{
    "theme": "modern-pro",
    "primary_color": "#0E3B44",
    "accent_color": "#2E9D8F",
    "logo_url": "",
    "favicon_url": "",
    "cta_text": "Request an Estimate"
  }'::jsonb),
  ('customization', '{
    "hero_headline": "East Texas Irrigation, Drainage & Pump Systems",
    "show_license": true,
    "show_years": true,
    "show_technicians": false,
    "show_certifications": true
  }'::jsonb),
  ('social_links', '{"facebook": "", "instagram": "", "google": "", "youtube": ""}'::jsonb),
  ('subscription', '{"tier": 2, "plan_name": "Grow", "monthly_price": 249}'::jsonb),
  ('notifications', '{"lead_email": "", "cc_email": ""}'::jsonb),
  ('demo_mode', '{"active": false}'::jsonb),
  ('integrations', '{"facebook_access_token": null, "facebook_page_id": null, "google_business_token": null}'::jsonb),
  ('hero_media', '{"mode": "image", "master_hero_image_url": "", "image_url": "", "url": "", "thumbnail_url": "", "video_url": "", "youtube_id": ""}'::jsonb),
  ('seo', '{
    "meta_description": "Licensed irrigation contractor serving East Texas since 2017. Sprinkler system installation and repair, yard drainage and french drains, and lake, pond, and well pump systems. Free 2-year warranty on every system installed.",
    "service_areas": ["Tyler", "Longview", "Lindale", "Hawkins", "Holly Lake Ranch", "Mineola", "Quitman", "Winnsboro", "Big Sandy", "Gilmer", "Whitehouse", "Bullard", "Flint", "Van", "Grand Saline", "Hideaway", "Lake Fork", "Lake Hawkins", "Lake Holbrook", "Smith County", "Wood County", "Upshur County", "Gregg County", "Van Zandt County"],
    "certifications": ["TX Irrigator License LI23001", "BBB A+ Accredited"],
    "founded_year": "2017",
    "owner_name": "Dathan Johnson"
  }'::jsonb)
) AS v(key, value)
ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

-- ── Service areas — exactly 5 (Growth cap; ladder 2→5) ───────────────────────
-- hero_title is set on every row so the location branch's "{city} Pest Control"
-- H1 fallback never fires for this tenant (BLOCKER-4 partial mitigation at the
-- data layer; the remaining pest strings in that branch are PR 5 scope).
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.service_areas (tenant_id, city, slug, state, is_live, hero_title, intro, meta_title, meta_description)
SELECT t.id, v.city, v.slug, 'TX', true, v.hero_title, v.intro, v.meta_title, v.meta_description FROM t, (VALUES
  ('Tyler', 'tyler-tx',
   'Tyler Irrigation & Drainage Services',
   'We install and repair sprinkler systems across Tyler — zone layout and head spacing done right, leaks and dead zones diagnosed and fixed. We also solve drainage problems with french drains, surface drains, and grading, and build pump systems for lake, pond, and well irrigation. Licensed TX irrigator LI23001, serving East Texas since 2017, with a free 2-year warranty on every system installed.',
   'Sprinkler Systems, Irrigation & Drainage in Tyler, TX',
   'Sprinkler installation and repair, yard drainage, and pump systems in Tyler, TX. Licensed TX irrigator LI23001 — serving East Texas since 2017.'),
  ('Longview', 'longview-tx',
   'Longview Irrigation & Drainage Services',
   'Longview homeowners call us for sprinkler installation and repair, french drains that stop standing water, and grading that moves runoff away from the foundation. Every system we install carries a free 2-year warranty — most companies in this market warranty six months.',
   'Sprinkler Systems, Irrigation & Drainage in Longview, TX',
   'Sprinkler system installation and repair, french drains, and grading in Longview, TX. Free 2-year warranty on every system installed.'),
  ('Lindale', 'lindale-tx',
   'Lindale Irrigation & Drainage Services',
   'From sprinkler repairs that bring a water bill back down to full system installs, we cover Lindale with licensed irrigation work, yard drainage, and sod installation. Serving East Texas since 2017.',
   'Sprinkler Systems, Irrigation & Drainage in Lindale, TX',
   'Licensed sprinkler and irrigation work, yard drainage, and sod installation in Lindale, TX. Serving East Texas since 2017.'),
  ('Hawkins', 'hawkins-tx',
   'Hawkins Irrigation & Drainage Services',
   'Hawkins is home base. We install and repair sprinkler systems, build french drains and surface drains, and handle lake and pond pump systems throughout Wood County. Licensed TX irrigator LI23001, licensed and insured, BBB A+.',
   'Sprinkler Systems, Irrigation & Drainage in Hawkins, TX',
   'Hawkins-based licensed irrigation contractor — sprinkler systems, drainage, and pump systems throughout Wood County. BBB A+ accredited.'),
  ('Holly Lake Ranch', 'holly-lake-ranch-tx',
   'Holly Lake Ranch Irrigation & Drainage Services',
   'We serve Holly Lake Ranch with sprinkler installation and repair, drainage and erosion control, and pump systems for lake and well irrigation — sized, installed, and maintained for reliable pressure at every zone.',
   'Sprinkler Systems, Irrigation & Drainage in Holly Lake Ranch, TX',
   'Sprinkler systems, drainage and erosion control, and lake and well pump systems in Holly Lake Ranch, TX. Free 2-year warranty.')
) AS v(city, slug, hero_title, intro, meta_title, meta_description)
ON CONFLICT (tenant_id, slug) DO UPDATE
  SET city = EXCLUDED.city, state = EXCLUDED.state, is_live = EXCLUDED.is_live,
      hero_title = EXCLUDED.hero_title, intro = EXCLUDED.intro,
      meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description;

-- ── Cap proof (run separately; MUST fail with ERRCODE check_violation) ────────
-- WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
-- INSERT INTO public.service_areas (tenant_id, city, slug, state, is_live)
-- SELECT t.id, 'Mineola', 'mineola-tx', 'TX', false FROM t;

-- ── seo_meta — one row per Phase One page (19 rows) ──────────────────────────
-- BLOCKER-2: with settings.seo.meta_description set above AND a row per page
-- here, the "${businessName} — professional pest control services" fallback in
-- layout.tsx / page.tsx / [service]/page.tsx can never fire for this tenant.
-- Titles deliberately omit the business name: §0.1 bars "lawn" from titles and
-- metas, and the legal-name exception covers only the name, domain, and footer.
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.seo_meta (tenant_id, page_slug, meta_title, meta_description, user_edited)
SELECT t.id, v.page_slug, v.meta_title, v.meta_description, true FROM t, (VALUES
  ('home',
   'East Texas Irrigation, Drainage & Pump Systems | Since 2017',
   'Irrigation and sprinkler contractor for East Texas — installation, repair, yard drainage, french drains, and lake and pond pump systems. Licensed TX irrigator LI23001. Free 2-year warranty.'),
  ('sprinkler-systems',
   'Sprinkler System Installation & Repair | East Texas',
   'Sprinkler system installation and repair across East Texas — zone layout, head spacing, leak diagnosis, and seasonal tune-ups by a licensed TX irrigator. Free 2-year warranty.'),
  ('drainage',
   'Drainage & Erosion Control | French Drains | East Texas',
   'Standing water, washout, and water running toward the foundation — solved with french drains, surface drains, and grading. Serving East Texas since 2017.'),
  ('pump-systems',
   'Lake, Pond & Well Pump Systems | East Texas',
   'Pump systems for lake, pond, and well irrigation — sizing, installation, and repair for reliable pressure at every zone. Licensed and insured, BBB A+.'),
  ('sod-dirt-work',
   'Sod Installation & Dirt Work | East Texas',
   'Sod installation and dirt work for East Texas properties — grading, low-spot repair, and site prep that drains the way it should.'),
  ('tyler-tx',
   'Sprinkler Systems, Irrigation & Drainage in Tyler, TX',
   'Sprinkler installation and repair, yard drainage, and pump systems in Tyler, TX. Licensed TX irrigator LI23001 — serving East Texas since 2017.'),
  ('longview-tx',
   'Sprinkler Systems, Irrigation & Drainage in Longview, TX',
   'Sprinkler system installation and repair, french drains, and grading in Longview, TX. Free 2-year warranty on every system installed.'),
  ('lindale-tx',
   'Sprinkler Systems, Irrigation & Drainage in Lindale, TX',
   'Licensed sprinkler and irrigation work, yard drainage, and sod installation in Lindale, TX. Serving East Texas since 2017.'),
  ('hawkins-tx',
   'Sprinkler Systems, Irrigation & Drainage in Hawkins, TX',
   'Hawkins-based licensed irrigation contractor — sprinkler systems, drainage, and pump systems throughout Wood County. BBB A+ accredited.'),
  ('holly-lake-ranch-tx',
   'Sprinkler Systems, Irrigation & Drainage in Holly Lake Ranch, TX',
   'Sprinkler systems, drainage and erosion control, and lake and well pump systems in Holly Lake Ranch, TX. Free 2-year warranty.'),
  ('about',
   'About Us | Licensed East Texas Irrigation Contractor',
   'Licensed and insured irrigation contractor serving East Texas since 2017. TX Irrigator License LI23001, BBB A+ accredited, free 2-year warranty on every system.'),
  ('contact',
   'Contact Us | Request an Irrigation or Drainage Estimate',
   'Request an estimate for sprinkler, drainage, pump, or sod work anywhere in East Texas. Call 903-747-7150.'),
  ('faq',
   'Irrigation & Drainage FAQs | East Texas',
   'Answers to common questions about sprinkler systems, french drains, pump systems, and sod installation in East Texas.'),
  ('reviews',
   'Customer Reviews | East Texas Irrigation & Drainage',
   'What East Texas homeowners say about our sprinkler, drainage, and pump system work. Serving the region since 2017.'),
  ('quote',
   'Request an Estimate | East Texas Irrigation & Drainage',
   'Free estimates on sprinkler systems, yard drainage, pump systems, and sod installation across East Texas. Free 2-year warranty on every system installed.'),
  ('service-area',
   'Service Area | East Texas Irrigation & Drainage',
   'Serving Tyler, Longview, Lindale, Hawkins, Holly Lake Ranch, and communities across Smith, Wood, Upshur, Gregg, and Van Zandt counties.'),
  ('privacy',
   'Privacy Policy',
   'How this website collects, uses, and protects your information.'),
  ('terms',
   'Terms of Service',
   'Terms governing use of this website and our services.'),
  ('accessibility',
   'Accessibility Statement',
   'Our commitment to an accessible website experience for all visitors.')
) AS v(page_slug, meta_title, meta_description)
ON CONFLICT (tenant_id, page_slug) DO UPDATE
  SET meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      user_edited = EXCLUDED.user_edited;

-- ── page_content — home row (S-PLS-3b) ───────────────────────────────────────
-- Added same-day after live review: with 0 page_content rows the modern-pro
-- hero fell back to business_name, putting the legal name (with "Lawn") in a
-- crawlable <h1> — §0.1 live on the open web. §2 vocabulary rule enforced
-- here: "irrigation" in the H1 and the first 100 words. The render's own H1
-- omits "irrigation"; the spec rule wins over render copy (see DECISIONS.md).
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.page_content (tenant_id, page_slug, hero_headline, title, subtitle, intro)
SELECT t.id, 'home',
 'Irrigation, Drainage & Pump Systems for East Texas',
 'Irrigation, Drainage & Pump Systems',
 'We solve both sides of your water problem — getting water where you want it, and getting it away from where you don''t.',
 'We solve both sides of your water problem — getting water where you want it, and getting it away from where you don''t. Licensed East Texas irrigation contractor since 2017 — sprinkler system installation and repair, french drains and yard drainage, and lake, pond, and well pump systems, backed by a free 2-year warranty on every system installed.'
FROM t
ON CONFLICT (tenant_id, page_slug) DO UPDATE
  SET hero_headline = EXCLUDED.hero_headline, title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle, intro = EXCLUDED.intro;

-- ── page_content — four service rows (S-PLS-4) ───────────────────────────────
-- Kills the navbar pest fallback: getAllServicePages() excludes
-- NON_SERVICE_SLUGS/CUSTOM_PAGE_SLUGS, and with only 'home' seeded it returned
-- [], sending ModernProNavbar to DEFAULT_SERVICE_LINKS (12 pest links) on every
-- page. These four rows feed the nav its titles. NOTE: until PR 4 lands the
-- four links 404 at the SERVICE_SLUGS gate (slugs not in the pest set, no
-- location row) — accepted pre-launch on a noindexed site.
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.page_content (tenant_id, page_slug, title, subtitle, intro)
SELECT t.id, v.page_slug, v.title, v.subtitle, v.intro FROM t, (VALUES
  ('sprinkler-systems',
   'Sprinkler System Installation & Repair',
   'Zone layout and head spacing done right — with a free 2-year warranty.',
   'Dry patches between heads, a water bill that keeps climbing, zones that will not come on — sprinkler problems usually trace to layout, pressure, or worn parts. We design and install new systems with correct zone layout and head spacing, and we repair existing ones: leak diagnosis, head replacement, valve and controller troubleshooting, and seasonal tune-ups. Licensed TX irrigator LI23001, with a free 2-year warranty on every system installed.'),
  ('drainage',
   'Drainage & Erosion Control',
   'French drains, surface drains, and grading that move water away for good.',
   'Water standing in the yard days after rain, soil washing out after storms, water running toward the foundation — drainage problems do not fix themselves. We trench, lay gravel and sock pipe, and backfill french drains; set surface drains and catch basins; and regrade so runoff moves away from the house. Serving East Texas since 2017.'),
  ('pump-systems',
   'Pump Systems for Lake, Pond & Well',
   'Sized, installed, and maintained for reliable pressure at every zone.',
   'A pump that will not prime, pressure that fades at the far zones, a pump that runs constantly — pump problems come down to sizing, intake, or wear. We size, install, and repair pump systems for lake, pond, and well irrigation, matching the pump and intake to the zones they feed. Licensed and insured, BBB A+.'),
  ('sod-dirt-work',
   'Sod Installation & Dirt Work',
   'Grading, low-spot repair, and site prep that drains the way it should.',
   'Bare ground after a project, low spots holding water, a yard that will not drain because of grade — we handle the dirt work first, then the sod. Grading and site prep, low-spot repair, and sod installation that establishes properly. Free estimates across East Texas.')
) AS v(page_slug, title, subtitle, intro)
ON CONFLICT (tenant_id, page_slug) DO UPDATE
  SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, intro = EXCLUDED.intro;

-- ── seo settings amendment + blog seo_meta row (S-PLS-4) ─────────────────────
-- seo.meta_title: six routes (about, contact, faq, quote, reviews,
-- service-area) have no generateMetadata of their own and inherit the LAYOUT
-- title, which was `tenant.meta_title || businessName` — i.e. the legal name
-- ("Lawn") in a <title>. Setting meta_title fixes all six at the data layer.
-- seo.noindex: engages the S-PLS-4 pre-launch robots gate (layout +
-- buildPageMetadata; strict `=== true`).
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
UPDATE public.settings s
SET value = s.value
  || jsonb_build_object('meta_title', 'East Texas Irrigation, Drainage & Pump Systems')
  || jsonb_build_object('noindex', true)
FROM t WHERE s.tenant_id = t.id AND s.key = 'seo';

WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.seo_meta (tenant_id, page_slug, meta_title, meta_description, user_edited)
SELECT t.id, 'blog', 'Irrigation & Drainage Tips | East Texas',
  'Guides and answers on sprinkler systems, yard drainage, and pump systems for East Texas properties.', true
FROM t
ON CONFLICT (tenant_id, page_slug) DO UPDATE
  SET meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
      user_edited = EXCLUDED.user_edited;

-- ── business_info.vertical — explicit routing key (S-PLS-6) ──────────────────
-- Decouples routing from the §7 industry PROSE (which is the AI social prompt
-- input and meant to be edited). resolveVertical reads this key first,
-- strictly validated ('irrigation' | 'pest'); the industry substring stays as
-- the fallback for tenants provisioned without it. ISR note: this key has zero
-- readers until the S-PLS-6 code deploys, and that deployment resets the ISR
-- cache entirely — the deploy is the purge, no stale window exists.
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
UPDATE public.settings s
SET value = s.value || jsonb_build_object('vertical', 'irrigation')
FROM t WHERE s.tenant_id = t.id AND s.key = 'business_info';

-- ── S-PLS-7 data pass: irrigation faqs + about page_content ──────────────────
-- Applied to prod via MCP 2026-08-19 (result: {page_slug:"about", faqs_inserted:10}).
-- Kills T0-4 (FAQ false pest-licensure claim) and T0-5 (about fabricated
-- credentials) at the data layer. NOTE (found during verification, logged in
-- DECISIONS.md): faq/page.tsx feeds these rows ONLY to the JSON-LD FAQPage
-- schema — the visible body renders the hardcoded pest FAQ_FALLBACK until the
-- 5b-faq PR ships the DB-driven browser. Testimonials are deliberately ABSENT
-- from this pass: §10 verbatim quotes for Larry Kellam and Jay D. Wilson are
-- blocked on Scott pulling them off the client's current site (§0.2 — never
-- reconstruct or paraphrase a customer's words).
-- ISR note: /api/revalidate requires a tenant-admin auth user + tenant_users
-- membership, which pls deliberately does not have — the revalidate=300
-- self-heal is the purge mechanism of record for this tenant's DB edits.
-- Both pages were verified live within the window (about intro + FAQ JSON-LD).
WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.faqs (tenant_id, category, question, answer, sort_order)
SELECT t.id, v.category, v.question, v.answer, v.sort_order FROM t, (VALUES
  ('General', 'Are you licensed and insured?',
   'Yes. We are a licensed and insured irrigation contractor — Texas Irrigator License LI23001 — serving East Texas since 2017.', 1),
  ('General', 'Do you offer free estimates?',
   'Yes. Estimates are free for sprinkler, drainage, pump, and sod work anywhere in our East Texas service area.', 2),
  ('General', 'What warranty do you offer?',
   'Every system we install carries a free 2-year warranty. Most companies in this market warranty six months.', 3),
  ('Sprinkler Systems', 'Why does my water bill keep climbing?',
   'A climbing bill with no change in use usually means a leak or a zone running unseen. We isolate the system zone by zone, find the problem, and fix it.', 10),
  ('Sprinkler Systems', 'Can you repair a system you did not install?',
   'Yes. We diagnose and repair existing systems — heads, nozzles, valves, controllers, and wiring — whoever installed them.', 11),
  ('Sprinkler Systems', 'Why are there dry patches between my sprinkler heads?',
   'Dry patches usually mean head spacing or nozzle selection is wrong for the zone''s pressure. Coverage is a layout problem first, not a watering-schedule problem.', 12),
  ('Drainage', 'Will a french drain really stop water standing in my yard?',
   'When it is built to grade with washed gravel and sock-wrapped pipe, yes — water moves to daylight or a catch basin instead of sitting in the soil. Most standing-water problems are grade and routing problems.', 20),
  ('Drainage', 'Water runs toward my foundation when it rains. Can that be fixed?',
   'Yes — usually with a combination of regrading and surface or french drains that intercept the water and carry it away from the house.', 21),
  ('Pump Systems', 'Can I irrigate from my lake or pond?',
   'Yes. We size and install pump systems for lake, pond, and well irrigation, matching the pump and intake to the zones they feed so pressure holds at the last head.', 30),
  ('Sod & Dirt Work', 'Do you fix low spots that hold water?',
   'Yes. We cut and fill to correct the grade, compact in lifts so it holds, and finish so water sheds where it should — then lay sod over prepared ground.', 40)
) AS v(category, question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.faqs f WHERE f.tenant_id = t.id);

WITH t AS (SELECT id FROM public.tenants WHERE slug = 'pls')
INSERT INTO public.page_content (tenant_id, page_slug, title, subtitle, intro)
SELECT t.id, 'about', 'About Us',
  'Licensed East Texas irrigation contractor — serving the region since 2017.',
  E'We are a licensed East Texas irrigation contractor, serving homeowners since 2017. Sprinkler systems, yard drainage, pump systems, and sod — we solve both sides of your water problem: getting water where you want it, and getting it away from where you don''t.\n\nEvery system we install carries a free 2-year warranty — most companies in this market warranty six months. That guarantee exists because of how the work is done: zones sized to real pressure and flow, drains trenched to grade with washed gravel and sock-wrapped pipe, pumps matched to the zones they feed.\n\nWe hold Texas Irrigator License LI23001, we are licensed and insured, and we are BBB A+ accredited. Owned and operated by Dathan Johnson.'
FROM t
ON CONFLICT (tenant_id, page_slug) DO UPDATE
  SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, intro = EXCLUDED.intro;
