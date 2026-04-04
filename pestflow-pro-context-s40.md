# PestFlow Pro — Project Context (Session 40 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- Follow the session roadmap exactly. Log conflicts in commit messages.
- Do NOT generate a session 41 context file. End with a plain summary only.

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflowpro.com
Admin URL:      https://pestflowpro.com/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Demo Tenant ID: 9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Admin:     admin@pestflowpro.com / pf123demo
Dev server:     doppler run -- npm run dev -> localhost:8080
Model:          claude-sonnet-4-6 (ALWAYS — no exceptions)
Stack:          React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel
```

---

## DEMO COMPANY

```
Name:        Ironclad Pest Solutions
Phone:       (903) 555-0142
Email:       info@ironclad-pest.com
Address:     1204 S. Main Street, Tyler, TX 75701
Slug:        ironclad
Hours:       Mon-Fri 7am-6pm | Sat 8am-2pm
Tagline:     Pest Control You Can Count On.
Founded:     2009
Industry:    Pest Control
```

---

## TEST TENANT (Lone Star Pest Defense)

```
Tenant ID:   7e8acdd5-b258-4a8c-9124-22b24383e3c3
Slug:        lonestarpest
URL:         https://lonestarpest.pestflowpro.com
Admin URL:   https://lonestarpest.pestflowpro.com/admin/login
Admin login: admin@lonestarpestdefense.com / lspd123demo
Plan:        Tier 2 — Grow — $149/mo
```

---

## BUILD STATUS (end of S39)

- Build: 0 TS errors
- Bundle: 375 kB — under 450 kB limit ✅
- Subdomain routing: live — [slug].pestflowpro.com resolves correctly
- All 4 shells: stable — do NOT modify in S40
- Tenant auth isolation: complete and verified
  - `tenant_users` table live with RLS
  - `has_role` RPC migrated to query `tenant_users` (not old `user_roles` table)
  - Cross-tenant login correctly blocked
  - lonestarpest login fully working end-to-end
- Doppler: wired and active
- FIRECRAWL_API_KEY: confirmed in Doppler prd config

---

## BUGS FOUND IN S39 — FIXED IN DB, MUST HARDEN IN CODE

These were fixed manually in the DB during S39. The `provision-tenant` edge function
must be updated so new clients never hit these same issues.

### Bug 1 — NULL auth columns panic
When creating a user via raw SQL INSERT into auth.users, `email_change` and
`email_change_token_new` default to NULL. The Supabase Auth Go service panics
scanning NULL into a string type → returns "Database error querying schema" 500.

Fix for provision-tenant: always set both columns to '' when inserting:
```sql
INSERT INTO auth.users (..., email_change, email_change_token_new, ...)
VALUES (..., '', '', ...)
```

### Bug 2 — has_role queried wrong table
`has_role` RPC was querying `public.user_roles` which was never seeded for new tenants.
Fixed in S39 via `has_role_use_tenant_users` migration — now queries `tenant_users`.
provision-tenant must INSERT into `tenant_users` for the new admin user.

### Bug 3 — Missing settings keys caused redirect loop
lonestarpest was missing: `hero_media`, `holiday_mode`, `notifications`, `demo_mode`.
App reads these on dashboard load — missing keys caused undefined errors → redirect loop.

Fix for provision-tenant: seed ALL of these keys for every new tenant:
- business_info
- branding
- customization
- social_links
- integrations
- onboarding_complete → `{"complete": true}`
- subscription
- hero_media → `{"youtube_id": "", "thumbnail_url": ""}`
- holiday_mode → `{"enabled": false, "holiday": "", "message": "", "auto_schedule": ""}`
- notifications → `{"cc_email": "", "lead_email": "[email]", "monthly_report_email": "[email]"}`
- demo_mode → `{"active": false, "seeded_at": ""}`

---

## KNOWN ISSUE — provision-tenant does NOT seed tenant_users

When provision-tenant creates a new client, it does not insert a row into tenant_users.
This means the new admin user will fail the has_role check and hit a redirect loop.

Must fix in S40 — see Focus 1 below.

---

## PRICING MODEL

| Package | Upfront | Monthly |
|---|---|---|
| Standard Build (template) | $2,000 | $99-$499/mo |
| Custom Migration (Firecrawl rebuild) | $3,500 | $99-$499/mo |
| Premium Migration (Firecrawl + new design) | $5,000 | $99-$499/mo |

Monthly tiers: Tier 1 Starter $99 / Tier 2 Grow $149 / Tier 3 Pro $249 / Tier 4 Elite $499

---

## INFRASTRUCTURE STATUS

| Item | Status |
|---|---|
| Vercel Pro | done |
| pestflowpro.com DNS | done |
| *.pestflowpro.com wildcard | done |
| Doppler to Vercel sync | done |
| Textbelt API key in Supabase | done |
| Supabase auth URLs configured | done |
| FIRECRAWL_API_KEY in Doppler | done |
| 1Password vault | incomplete — Scott to finish manually |

---

## SUBDOMAIN ROUTING

File: src/lib/subdomainRouter.ts
- Reads window.location.hostname
- Extracts subdomain from [slug].pestflowpro.com
- Queries tenants.slug -> returns tenant ID
- Falls back to VITE_TENANT_ID for localhost and pestflow-pro.vercel.app

---

## TENANTS TABLE

```
id         uuid primary key
slug       text unique
created_at timestamptz
```

Slugs seeded:
- ironclad     -> 9215b06b-3eb5-49a1-a16e-7ff214bf6783 (demo)
- lonestarpest -> 7e8acdd5-b258-4a8c-9124-22b24383e3c3 (test)

---

## SETTINGS KEYS (JSONB)

```
business_info   -> {name, phone, email, address, hours, tagline, industry,
                    license, certifications, founded_year, num_technicians}
branding        -> {logo_url, primary_color, accent_color, template, cta_text, favicon_url}
customization   -> {hero_headline, show_license, show_years,
                    show_technicians, show_certifications}
social_links    -> {facebook, instagram, google, youtube}
integrations    -> {google_place_id, facebook_page_id, facebook_access_token,
                    google_analytics_id, pexels_api_key, textbelt_api_key,
                    owner_sms_number, ayrshare_api_key, google_maps_api_key}
onboarding_complete -> {"complete": true}   ← must be this exact shape
hero_media      -> {youtube_id, thumbnail_url}
holiday_mode    -> {enabled, holiday, message, auto_schedule}
notifications   -> {cc_email, lead_email, monthly_report_email}
demo_mode       -> {active, seeded_at}
legal_acceptance -> {accepted: bool, timestamp: string, plan: string, terms_version: string}
subscription    -> {tier: 1|2|3|4, plan_name, monthly_price}
```

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| notify-new-lead | ACTIVE | FROM: no-reply@pestflow.ai |
| send-review-request | ACTIVE v2 | From: no-reply@pestflow.ai |
| publish-scheduled-posts | ACTIVE | FB Graph API v19.0 + pg_cron |
| send-sms | ACTIVE | TEXTBELT_API_KEY set |
| send-onboarding-email | ACTIVE | From: onboarding@pestflow.ai |
| provision-tenant | ACTIVE — needs hardening in S40 | |

Verified Resend domain: pestflow.ai

---

## SHELL SYSTEM (stable — do not modify in S40)

```
src/shells/
  modern-pro/     navy+emerald, centered hero
  bold-local/     charcoal+amber, 2-col split hero
  clean-friendly/ white+sky, giant phone CTA hero
  rustic-rugged/  brown+rust, split left/right hero
```

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Relative imports only — NO @/ aliases
- Single useState object for forms — never per-field state
- maybeSingle() not single() for settings queries
- All files under 200 lines — check with wc -l before editing, split first
- Admin tabs lazy-loaded with React.lazy()
- PageHelpBanner on every admin tab
- Footer "Powered by PestFlow Pro" badge on ALL shells
- HolidayBanner ABOVE Navbar — PublicShell handles this
- Working directly on main — no PR needed
- Stop and output a summary at 50% context window — no exceptions
- Do NOT generate a context file — plain summary only at end
- Dev server: always doppler run -- npm run dev — never npm run dev directly

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator / Customer portal / Technician calendar
- PDF reports / PDF export / Self-serve pricing page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1-29 | Mar-Apr 2026 | Full platform build |
| 30 | Apr 2026 | Shell infrastructure + Modern Pro + Bold & Local |
| 31 | Apr 2026 | Clean & Friendly + Rustic & Rugged shells |
| 32 | Apr 2026 | Customization layer, Ayrshare posting, Facebook UX |
| 33 | Apr 2026 | 4 ShellHomeSections built |
| 34 | Apr 2026 | Legal checkboxes, /terms + /privacy, provision-tenant, Client Setup wizard |
| 35 | Apr 2026 | Bundle 463 to 370 kB. Rebuilt 3 shell heroes |
| 36 | Apr 2026 | Pest images, shell CTA colors, TCPA consent, Lighthouse caching. Bundle: 375 kB |
| 37 | Apr 2026 | Dashboard redesign (SEO/Social widgets, plan card, amber padlocks). GoogleMapEmbed |
| 38 | Apr 2026 | Subdomain routing live. lonestarpest.pestflowpro.com resolves. Doppler wired |
| 39 | Apr 2026 | Tenant auth isolation. has_role fixed. lonestarpest login working. FIRECRAWL_API_KEY in Doppler |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| S40 | provision-tenant hardening + Firecrawl migration tool — this session |
| S41 | First real client onboarding |

---

## SESSION 40 SCOPE

### Focus 1 — provision-tenant Edge Function Hardening

Find: supabase/functions/provision-tenant/index.ts
Check wc -l before editing. Split if over 200 lines.

The function currently provisions a tenant but leaves three landmines for new clients.
Fix all three in one pass:

**Fix A — NULL auth columns**
When inserting into auth.users, ensure these are always set:
```sql
email_change = '',
email_change_token_new = ''
```

**Fix B — tenant_users row**
After creating the auth user, insert into tenant_users:
```sql
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES ([new_tenant_id], [new_user_id], 'admin')
ON CONFLICT DO NOTHING;
```

**Fix C — Seed all required settings keys**
After creating the tenant, seed ALL of these keys (not just a subset):
- business_info, branding, customization, social_links, integrations
- onboarding_complete → `{"complete": true}`
- hero_media → `{"youtube_id": "", "thumbnail_url": ""}`
- holiday_mode → `{"enabled": false, "holiday": "", "message": "", "auto_schedule": ""}`
- notifications → `{"cc_email": "", "lead_email": "[input email]", "monthly_report_email": "[input email]"}`
- demo_mode → `{"active": false, "seeded_at": ""}`
- subscription → `{"tier": 1, "plan_name": "Starter", "monthly_price": 99}`

After all three fixes: deploy the updated edge function.

Test by provisioning a brand new throwaway tenant via the Client Setup Wizard and
confirming login works on the first try with no DB patches needed.

---

### Focus 2 — Firecrawl Migration Tool

FIRECRAWL_API_KEY is confirmed in Doppler prd config.

Build: scripts/migrate-site.ts

Input (CLI args): client website URL + target slug
Example: npx ts-node scripts/migrate-site.ts https://example-pest.com acmepest

Process:
1. Read FIRECRAWL_API_KEY from process.env (Doppler injects via doppler run --)
2. Call Firecrawl API to crawl the site — use the /crawl endpoint, limit to 10 pages
3. Extract from crawl output:
   - Company name, phone, address, email
   - Tagline / hero headline
   - Service list with descriptions
   - About us copy
   - Brand colors (hex) if detectable in CSS or inline styles
4. Write structured output to scripts/output/[slug]-content.md

Output format:
```
# [Company Name] — Migration Content
## Business Info
name:
phone:
address:
email:
tagline:
## Hero Copy
headline:
subheadline:
## Services
- [Service Name]: [description]
## About
[about copy]
## Colors
primary: #xxxxxx
accent: #xxxxxx
## Source URL
[original URL]
```

After writing the output file, Claude Code reads it as source material to build
src/shells/[slug]/ matching existing shell structure:
- ShellNavbar.tsx
- ShellHero.tsx
- ShellFooter.tsx
- ShellHomeSections.tsx
- ServicesData.ts

Test against: https://www.youpestcontrol.com (real public pest control site)
Review output quality. Adjust extraction logic if needed.

Document the full workflow in CLAUDE.md under a new "## Migration Workflow" section.

---

## SESSION 40 TASK ORDER

1. Find provision-tenant — check wc -l — split if needed
2. Fix A: NULL auth columns
3. Fix B: Insert into tenant_users
4. Fix C: Seed all required settings keys
5. Deploy provision-tenant edge function
6. Test: provision a throwaway tenant via Client Setup Wizard — confirm login works first try
7. Commit provision-tenant hardening
8. Check FIRECRAWL_API_KEY is accessible via doppler run -- (echo $FIRECRAWL_API_KEY)
9. Build scripts/migrate-site.ts
10. Test against https://www.youpestcontrol.com
11. Review output — adjust if needed
12. Build src/shells/[slug]/ from the output file
13. Document workflow in CLAUDE.md
14. Commit Firecrawl work
15. Final build — 0 TS errors, bundle under 450 kB
16. Report bundle size in summary

---

## SESSION 40 STARTER BLOCK

Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 39 is complete. Tenant auth isolation is live and verified. lonestarpest.pestflowpro.com
login works end-to-end. FIRECRAWL_API_KEY is in Doppler.

Session 40 has two focus areas:
1. provision-tenant hardening — three bugs found during S39 testing must be fixed so
   every new client works on first login with no manual DB patches
2. Firecrawl migration tool — scripts/migrate-site.ts + build shell from output

Follow the task order exactly.

Do NOT generate a session 41 context file. End with a plain summary only.
Stop and output a summary at 50% context window.
Report exact bundle size after final build.
Dev server: doppler run -- npm run dev — never npm run dev directly.
