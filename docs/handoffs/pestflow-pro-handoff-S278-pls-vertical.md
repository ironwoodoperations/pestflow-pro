# Handoff S278 — Precision Lawn Systems vertical build

## Tenant
- `pls` / 840b6ad1-590f-491e-a9ef-0b439d6846c1, live at pls.pestflowpro.ai (noindexed)
- Vertical: irrigation/water-management (NOT lawn-care — that's a future
  separate vertical, Grandview). business_info.vertical = "irrigation".
- Supabase biezzykcgzkrwdgqpsar. Admin: admin@ironwoodopsgrp.com bound as admin.

## Shipped this arc (PRs #250–#262, all merged)
- Removed fabricated reviews + stats strip platform-wide (#251).
- FAQ page DB-driven with sticky category nav + scrollspy + accordion (#253);
  FAQ_FALLBACK deleted, DB rows or nothing.
- Vertical preset architecture: resolveVertical (keys on business_info.vertical,
  falls back pest) + MODERN_PRO_VERTICAL preset map + IRRIGATION_CONTENT_MAP.
  Homepage sections (services grid, trust bar, why-choose, CTA) now prop-driven,
  no pest defaults; pls resolves irrigation, apex/pest resolve pest (#257).
- 5 service tiles: sprinkler-systems, drainage, pump-systems, retaining-walls,
  sod-dirt-work. Images in public/images/pls/ (sprinkler is licensed STOCK,
  flagged for replacement w/ a real client photo) (#256, #258).
- retaining-walls added to IRRIGATION_CONTENT_MAP + page_content row (#259).
- Footer → "Powered by HomeFlow Pro", plain text no link, platform-wide;
  removed dead /pest-control quick link (#254).
- Quote form reads tenant service pages via getAllServicePages, all hardcoded
  pest options removed, pestConcern→notes, consent line de-pested (#260).
- Footer copyright © line is now a link to the tenant's own `/admin` (#261).
  `ModernProFooter.tsx`, one line: the `<span>© {year} {name}. All rights
  reserved.</span>` became `<a href="/admin" className="hover:text-gray-400
  transition">`. Relative href, so every modern-pro tenant lands on its own
  admin — confirmed live on both pls and apex-protect. Shipped as a plain `<a>`,
  NOT next/link, because `/admin` is not an App Router route: middleware
  rewrites it to the Vite SPA (`/_admin/index.html`), so the navigation is a
  document load either way. Matches VitaGlowFooter, which already did this.
  Merged as 1e9b1d1; production-verified (both `/admin` routes 200, badge still
  a span, 0 "PestFlow Pro" / 0 pestflowpro.com on either homepage).
- notify-new-lead lead-email templates → "Powered by HomeFlow Pro" (#262).
  All 3 spots (customer HTML footer, customer plain-text footer, owner HTML
  footer), flat text, `https://pestflowpro.com` anchor dropped. Merged as
  4bd3afc. **CODE ONLY — THE EDGE FUNCTION IS NOT DEPLOYED. See Open/next #3.**

## Data writes (via MCP, done)
- page_content: retaining-walls row (title "Retaining Walls & Hardscape").
- business_info: address "PO Box 859, Hawkins, TX 75765",
  email "precisionlawnsystems@yahoo.com".
- integrations: google_fid "0x8649dd68b4aabe01:0xc3c1932319d296a8",
  owner_sms_number "9037477150".
- notifications: lead_email "precisionlawnsystems@yahoo.com".
- 4 testimonials from client site (source client_site).
- tenant_users: admin@ironwoodopsgrp.com → pls, role admin.

## Live systems
- Lead messaging LIVE: customer email ack + owner email + owner SMS all fire on
  lead insert (trigger on_lead_insert → notify-new-lead). Customer-facing SMS
  OFF by design (no consent checkbox, TCPA — quote form sends customer_sms_consent:false).
- Outscraper: FID set, cron outscraper-daily-dispatch picks pls up automatically
  at 2am UTC (pls has subscription row tier 2 + FID, satisfies dispatch JOINs),
  mode 'initial', ~50 reviews expected.

## Open / next
1. VERIFY: #260 quote-form production acceptance **is done — PASS**. The RSC
   flight payload on pls /quote carries exactly the 5 irrigation service titles;
   the shipped client chunk has 0 pestConcern / PEST_OPTIONS / "pest control
   inquiry" / "Bed Bugs" / Termite; apex-protect /quote returns its own 12 pest
   titles from its own rows. Raw output in the #260 thread. #261 and #262 are
   both merged and their diffs are described above.
2. Footer copyright © → link to tenant /admin — **SHIPPED as #261**, merged and
   production-verified. Nothing left here.
3. notify-new-lead email templates: the **code fix is merged (#262) but the
   function is NOT deployed** — `notify-new-lead` is still version 61
   (updated 2026-06-04), so lead emails going out RIGHT NOW still say
   "Powered by PestFlow Pro" and still link pestflowpro.com. Supabase edge
   functions do not ship via the Vercel pipeline. One command, from a machine
   with credentials (this container has no SUPABASE_ACCESS_TOKEN and no Doppler
   CLI, so the session that wrote the fix could not run it):
     supabase functions deploy notify-new-lead --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
   After deploying, confirm via get_edge_function: version > 61, verify_jwt
   STILL false (it silently reverts, and the function's real auth is the apikey
   header checked against NOTIFY_NEW_LEAD_INTERNAL_SECRET — if verify_jwt flips
   true the DB trigger's calls start failing and lead notifications stop
   silently), and deployed source has pestflowpro.com = 0.
   Also unresolved on that PR: line 94 is still
   `const businessName = bizRes.data?.value?.name || 'PestFlow Pro'` — the
   fallback literal, left alone because the spec fenced off businessName, so a
   grep for "PestFlow Pro" returns 1 not 0. Renaming it to HomeFlow Pro does not
   really fix it; the better fix is to skip the customer email entirely when
   business_info.name is missing. Scott's call.
   DO NOT test-lead on pls: notifications.lead_email is the client's real yahoo
   inbox and integrations.owner_sms_number is their real phone, so a test lead
   emails AND texts them a fabricated customer and leaves a junk row in their CRM.
4. Location pages: 7 core cities (Tyler, Longview, Lindale, Hawkins, Holly Lake
   Ranch + 2 nearby). Cities in seo.service_areas (24 stamped). Location template
   in [service]/page.tsx is HARDCODED PEST ("{city} Pest Control", "common pests
   in {city}") — needs same vertical treatment homepage got before enabling.
5. Client still owes: warranty scope, pond-pump permits, real hours (GBP shows
   "Open 24 hours" = default, NOT real; hours field stays blank).
6. JSON-LD vocabulary is the last pest artifact on the pls public site. The
   LocalBusiness `knowsAbout` array still reads ["Pest Control","Termite
   Treatment","Mosquito Control","Rodent Control","Bed Bug Treatment","Ant
   Control"], served to crawlers for an irrigation contractor. Not visible copy,
   but it is what search engines read. SchemaVocabulary plumbing from #245
   already exists; this needs the irrigation vocabulary wired through it.

## Deferred — NEXT MAJOR PHASE
Genericize the ADMIN/operator dashboard: still hardcoded pest even for
irrigation tenants. Confirmed on pls.pestflowpro.ai/admin — Content editor lists
pest-control/termite-control/spider-control/etc, hero placeholder "Professional
Pest Control You Can Trust". Public site de-pested; admin surface NOT touched.
Separate multi-PR effort, same vertical-preset pattern, different surface.
Note also that the admin SPA's `<title>` is still "PestFlow Pro" — now the first
thing a client sees in their tab, since #261 made the admin door findable from
every modern-pro footer.

## Future enhancement (low priority)
Per-vertical "Powered by [X]Flow Pro" attribution via vertical→{brand,url} map,
all surfaces (footer + lead emails), AFTER vertical landing pages resolve. Until
then flat HomeFlow Pro. Note irrigation≠lawn-care for branding.
