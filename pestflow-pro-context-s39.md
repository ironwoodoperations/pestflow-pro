# PestFlow Pro — Project Context (Session 39 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- Follow the session roadmap exactly. Log conflicts in commit messages.
- Do NOT generate a session 40 context file. End with a plain summary only.

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

## BUILD STATUS (end of S38)

- Build: 0 TS errors
- Bundle: 375 kB — under 450 kB limit
- Subdomain routing: live — [slug].pestflowpro.com resolves correctly
- All 4 shells: stable — do NOT modify in S39
- Dashboard: redesigned — SEO widget, Social widget, Plan card, amber padlocks
- Google Maps: GoogleMapEmbed on service area + location pages
- Doppler to Vercel sync: active
- *.pestflowpro.com wildcard: live and resolving
- Supabase auth redirect URLs: https://pestflowpro.com/** + https://*.pestflowpro.com/**

---

## KNOWN ISSUE — MUST FIX FIRST IN S39

Auth is not tenant-isolated. Any valid Supabase user can log into any subdomain.
Confirmed: admin@pestflowpro.com (demo tenant) was able to log into
lonestarpest.pestflowpro.com — this must be blocked.

Required fix:
- Add a tenant_users table linking user_id (auth.users) to tenant_id
- On login success, check if the logged-in user belongs to the current subdomain tenant
- If not: sign them out immediately + show "You don't have access to this account."
- Demo tenant admin admin@pestflowpro.com -> linked to demo tenant ID only
- Lone Star admin admin@lonestarpestdefense.com -> linked to lonestarpest tenant ID only

---

## MANUAL ACTION PENDING (Scott — do outside of sessions)

1Password vault "PestFlow Pro" not yet complete. Add entries for:
- Supabase dashboard login
- Vercel login
- GoDaddy login
- Doppler login
- GitHub login
- Anthropic API key
- Supabase anon key
- Textbelt API key
- Pexels API key
- Google Maps API key
- Demo admin: admin@pestflowpro.com / pf123demo
- Test tenant admin: admin@lonestarpestdefense.com / lspd123demo

Rule: every credential lives in 1Password first, nowhere else.

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
| 1Password vault | incomplete — Scott to finish manually |

---

## SUBDOMAIN ROUTING — CURRENT STATE

File: src/lib/subdomainRouter.ts
- Reads window.location.hostname
- Extracts subdomain from [slug].pestflowpro.com
- Queries tenants.slug -> returns tenant ID
- Falls back to VITE_TENANT_ID for localhost and pestflow-pro.vercel.app

File: src/lib/tenant.ts
- Re-exports resolveTenantId from subdomainRouter
- All existing imports unchanged

---

## TENANTS TABLE

Current schema:
  id         uuid primary key
  slug       text unique
  created_at timestamptz

Slugs seeded:
  ironclad     -> 9215b06b-3eb5-49a1-a16e-7ff214bf6783 (demo)
  lonestarpest -> 7e8acdd5-b258-4a8c-9124-22b24383e3c3 (test)

---

## SETTINGS KEYS (JSONB)

business_info   -> {name, phone, email, address, hours, tagline, industry,
                    license, certifications, founded_year, num_technicians}
branding        -> {logo_url, primary_color, accent_color, template, cta_text}
customization   -> {hero_headline, show_license, show_years,
                    show_technicians, show_certifications}
social_links    -> {facebook, instagram, google, youtube}
integrations    -> {google_place_id, facebook_page_id, facebook_access_token,
                    google_analytics_id, pexels_api_key, textbelt_api_key,
                    owner_sms_number, ayrshare_api_key, google_maps_api_key}
onboarding_complete -> true | false
legal_acceptance -> {accepted: bool, timestamp: string, plan: string, terms_version: string}
subscription    -> {tier: 1|2|3|4, plan_name, monthly_price}
demo_mode       -> {active: boolean, seeded_at: string}

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| notify-new-lead | ACTIVE | FROM: no-reply@pestflow.ai |
| send-review-request | ACTIVE v2 | From: no-reply@pestflow.ai |
| publish-scheduled-posts | ACTIVE | FB Graph API v19.0 + pg_cron |
| send-sms | ACTIVE | TEXTBELT_API_KEY now set |
| send-onboarding-email | ACTIVE | From: onboarding@pestflow.ai |
| provision-tenant | ACTIVE | Accepts slug, returns live URL |

Verified Resend domain: pestflow.ai

---

## SHELL SYSTEM (stable — do not modify in S39)

src/shells/
  modern-pro/     navy+emerald, centered hero
  bold-local/     charcoal+amber, 2-col split hero
  clean-friendly/ white+sky, giant phone CTA hero
  rustic-rugged/  brown+rust, split left/right hero

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
| 38 | Apr 2026 | Subdomain routing live. lonestarpest.pestflowpro.com resolves. Doppler wired. provision-tenant returns live URL |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| S39 | Tenant auth isolation + Firecrawl migration tool — this session |
| S40 | First real client onboarding |

---

## SESSION 39 SCOPE

### Focus 1 — Tenant Auth Isolation (fix first — security issue)

Problem: Any valid Supabase user can log into any subdomain.

Solution — tenant_users table:

Step 1 — Apply migration (batch all in one apply_migration call):

  CREATE TABLE IF NOT EXISTS public.tenant_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'admin',
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, user_id)
  );

  ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own tenant memberships"
    ON tenant_users FOR SELECT
    USING (auth.uid() = user_id);

  INSERT INTO tenant_users (tenant_id, user_id)
  SELECT '9215b06b-3eb5-49a1-a16e-7ff214bf6783', id
  FROM auth.users WHERE email = 'admin@pestflowpro.com'
  ON CONFLICT DO NOTHING;

  INSERT INTO tenant_users (tenant_id, user_id)
  SELECT '7e8acdd5-b258-4a8c-9124-22b24383e3c3', id
  FROM auth.users WHERE email = 'admin@lonestarpestdefense.com'
  ON CONFLICT DO NOTHING;

Step 2 — App-side login check:
- Find the login handler file (likely src/pages/admin/Login.tsx or similar)
- Check line count with wc -l before editing — split if near 200 lines
- After Supabase auth.signInWithPassword succeeds:
  - Get current tenant ID from resolveTenantId()
  - Query tenant_users: SELECT id FROM tenant_users WHERE tenant_id = [tenantId] AND user_id = [user.id]
  - If no row found: call supabase.auth.signOut() then show error "You don't have access to this account."
  - If row found: proceed to dashboard as normal

Step 3 — Test all three scenarios:
  1. admin@pestflowpro.com on lonestarpest.pestflowpro.com -> must be REJECTED
  2. admin@lonestarpestdefense.com on lonestarpest.pestflowpro.com -> must SUCCEED
  3. admin@pestflowpro.com on pestflowpro.com/admin -> must SUCCEED

---

### Focus 2 — Firecrawl Migration Tool

Goal: Scrape a client's existing pest control site -> extract content ->
Claude Code uses it to build a custom shell.

Pre-check: Confirm FIRECRAWL_API_KEY exists in Doppler prd config.
If not present -> skip this focus entirely and note in summary.

Build: scripts/migrate-site.ts

Input: client website URL + target slug
Process:
  1. Call Firecrawl API to crawl the site
  2. Extract: page copy, service descriptions, company info, colors if detectable
  3. Write structured output to scripts/output/[slug]-content.md

Output format:
  # [Company Name] — Migration Content
  ## Business Info
  [name, phone, address, tagline]
  ## Hero Copy
  [headline + subheadline]
  ## Services
  [list with descriptions]
  ## About
  [about copy]
  ## Colors
  [hex colors if detectable]
  ## Source URL
  [original URL]

After writing output file, Claude Code reads it as source material to build
src/shells/[slug]/ matching the existing shell file structure.

Document the workflow in CLAUDE.md under "Migration Workflow" section.
This is a Claude Code dev tool — no admin UI needed.

---

## SESSION 39 TASK ORDER

1. Apply tenant_users migration (batch all SQL in one call)
2. Verify seed rows exist for both admin users
3. Find login handler — check line count — split if needed
4. Add tenant membership check to login flow
5. Test: admin@pestflowpro.com on lonestarpest subdomain -> rejected
6. Test: admin@lonestarpestdefense.com on lonestarpest subdomain -> success
7. Test: admin@pestflowpro.com on root domain -> success
8. Commit auth isolation fix
9. Check if FIRECRAWL_API_KEY is in Doppler — if yes, build scripts/migrate-site.ts
10. Document migration workflow in CLAUDE.md if Firecrawl task completed
11. Final build — 0 TS errors, bundle under 450 kB

---

## SESSION 39 STARTER BLOCK

Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 38 is complete. Subdomain routing is live. lonestarpest.pestflowpro.com
resolves and serves Lone Star Pest Defense data. Doppler is wired. Bundle: 375 kB.

One critical security issue discovered during testing: auth is not tenant-isolated.
Any valid Supabase user can log into any subdomain. Fix this first.

Session 39 has two focus areas:
1. Tenant auth isolation — tenant_users table + login membership check
2. Firecrawl migration tool (only if FIRECRAWL_API_KEY is in Doppler)

Follow the task order in the context file exactly.

Do NOT generate a session 40 context file. End with a plain summary only.
Stop and output a summary at 50% context window.
Report exact bundle size after final build.
Dev server: doppler run -- npm run dev — never npm run dev directly.
