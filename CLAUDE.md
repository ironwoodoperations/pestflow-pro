# PestFlow Pro — Claude Code Standing Orders

This file is read automatically by Claude Code at the start of every session.
These are standing orders. Follow them without being asked.

---

## WHO YOU ARE

You are the lead engineer building PestFlow Pro — a white-label SaaS platform
for home services businesses, owned by Scott (Ironwood Operations Group).
Scott is not a developer. Build autonomously. Make standard decisions without asking.
Stop only when you genuinely cannot proceed without information not in this file.

---

## BEFORE YOU WRITE A SINGLE LINE OF CODE

1. Read `SKILL.md` in the project root — full architecture, schema, file paths
2. Read `PROJECT_MANIFEST.md` — current phase, open items, decisions log (replaces all prior session context .md files)
3. If a file you need to edit exists, read it fully before touching it
4. Check what was last built: `git log --oneline -10`

---

## HOW TO WORK

1. Read the session prompt fully before touching any file
2. Execute tasks IN ORDER — never jump ahead
3. Read each file before editing it
4. After EVERY task: `git add . && git commit -m "task[N]: description" && git push`
5. When all tasks are done, report: files changed, bug/fix summary, build status, anything left

---

## AUTONOMY RULES

### Proceed without asking:
- Task is clearly described in the session prompt
- Minor error you can diagnose and fix yourself
- Choosing between two reasonable implementations — pick better, note in commit
- Installing packages needed for the task
- Running build, type-check, lint, dev server commands

### Stop and tell Scott when:
- A required credential is missing from `.env.local`
- A third-party API returns an error you cannot diagnose
- A decision would significantly change the database schema beyond what the prompt specifies
- The session prompt conflicts with what's already built
- You've tried 3 times to fix the same bug — explain what you tried

### Never without asking:
- Drop or truncate database tables
- Change or remove existing RLS policies on tables with live data
- Modify already-applied Supabase migrations
- Delete seeded demo data
- Change Vercel production environment variables

---

## NON-NEGOTIABLE RULES (violating any of these breaks the app)

1. **Model string:** always `claude-sonnet-4-6` — never any other string, ever
2. **Demo Tenant ID:** `9215b06b-3eb5-49a1-a16e-7ff214bf6783` — hardcoded constant, never change
3. **Anthropic browser header:** `'anthropic-dangerous-direct-browser-access': 'true'` — required on every fetch
4. **Single useState object for forms** — never per-field state. Per-field state causes focus/re-render bugs.
5. **Strip backticks before JSON.parse** — `text.replace(/```json|```/g, '').trim()`
6. **Routes in App.tsx MUST appear BEFORE `/:slug`** — specific routes before the catch-all
7. **All INSERT/upsert seed scripts must be idempotent** — use `ON CONFLICT (...) DO UPDATE SET`
8. **RLS is always the first diagnostic** when table data appears missing — run audit query before assuming frontend bug
9. **Social features are VERTICAL-AGNOSTIC** — industry comes from `settings.business_info.industry`, never hardcoded
10. **Demo company is IRONCLAD PEST SOLUTIONS** — never "Dang Pest Control" anywhere
11. **Admin email must be valid format** — must contain a dot after @ before calling createUser
12. **provision-tenant must create profiles + user_roles rows** — always, after every createUser call
13. **Shell CSS vars applied at root** — use applyShellTheme() from src/lib/shellThemes.ts, never hardcode colors in public components

---

## CRITICAL CONSTANTS

```
Live URL:         https://pestflowpro.com
Ironwood Ops:     https://pestflowpro.com/ironwood  (admin@pestflowpro.com only)
Client Admin:     https://[slug].pestflowpro.com/admin
GitHub:           https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:     https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:      biezzykcgzkrwdgqpsar
Demo Tenant ID:   9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Admin:       admin@pestflowpro.com / pf123demo
Tyler Pest ID:    1abd6f30-0bb0-4424-97aa-4e6d0a74c4cd  (test tenant — do not delete)
Dev server:       doppler run -- npm run dev  →  localhost:8080
                  (NEVER run npm run dev directly — always use Doppler)
```

---

## PLATFORM ARCHITECTURE

PestFlow Pro is a concierge SaaS. Scott sells it 1-on-1 by phone.
Clients never self-serve. Scott provisions all sites.

**Two separate surfaces:**
- `/ironwood` — Ironwood Ops CRM (Scott only, admin@pestflowpro.com)
  Pipeline, Prospects, Reports, Team, Integrations
- `/admin` — Client admin dashboard (each client's tenant, scoped by tenant_id)
  Content, SEO, Blog, Social, Testimonials, Locations, Reports, CRM, Team,
  Client Setup, Billing, Onboarding, Settings
  Settings tabs: Business Info | Branding | Social Links | Notifications |
                 Hero Media | Holiday Mode
  NEVER show Integrations or Domain tabs to clients — those are Ironwood-only

**Provisioning flow:**
1. Scott fills Ironwood Ops prospect form on the sales call
2. Generates Stripe setup invoice (one-time fee) → sends via mailto
3. Generates Stripe subscription link (recurring) → sends via mailto
4. Clicks "Create Site" → calls ironwood-provision edge function
5. ironwood-provision calls provision-tenant with full prospect data
6. provision-tenant creates: tenant row, auth user, profiles row, user_roles row,
   all settings rows (8 keys — see below)
7. Day 2 reveal call — Scott walks client through their finished site

---

## SETTINGS TABLE — ALL REQUIRED KEYS

Every tenant must have ALL of these settings rows seeded on provisioning.
Use: INSERT ... ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value

| Key            | Shape |
|----------------|-------|
| business_info  | { name, phone, email, address, hours, tagline, industry, license, certifications, founded_year, num_technicians } |
| branding       | { logo_url, favicon_url, primary_color, accent_color, template, cta_text } |
| customization  | { hero_headline, show_license, show_years, show_technicians, show_certifications } |
| social_links   | { facebook, instagram, google, youtube } |
| subscription   | { tier: 1-4, plan_name, monthly_price } |
| notifications  | { lead_email, cc_email } |
| demo_mode      | { active: false } |
| integrations   | { facebook_access_token: null, facebook_page_id: null, google_business_token: null } |
| hero_media     | { mode: 'image'\|'video', master_hero_image_url, image_url, url, thumbnail_url, video_url, youtube_id } |

Notes on hero_media keys:
- `mode`: discriminator — 'image' or 'video'. Controls which fields are active. Required.
- `master_hero_image_url`: primary image URL used by getShellImage.ts for apply-to-all-pages
- `image_url`: same value as master_hero_image_url in image mode; first candidate in resolveHeroImage
- `url`: generic fallback URL — same as image_url in image mode, video_url in video mode
- `thumbnail_url`: consumed directly by shell heroes for bg-image; present in all tenant rows
- `video_url`: uploaded video file URL; empty unless mode=video+upload
- `youtube_id`: extracted YouTube ID; empty unless mode=video+youtube
All 7 keys are written atomically by BrandingHeroMedia.tsx handleSave() on every save.

Tier mapping: Starter→1, Grow→2, Pro→3, Elite→4

---

## SHELL SYSTEM (CSS CUSTOM PROPERTIES)

Shells are applied via CSS custom properties on document.documentElement.
File: src/lib/shellThemes.ts

Four shells: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged'

Each shell defines these CSS vars:
  --color-primary, --color-primary-dark, --color-accent
  --color-bg-hero, --color-bg-section, --color-bg-cta
  --color-nav-bg, --color-nav-text
  --color-footer-bg, --color-footer-text
  --color-btn-bg, --color-btn-text
  --color-heading
  --font-heading, --font-body

applyShellTheme(template, primaryOverride?, accentOverride?) sets all vars at root.
Call on app init (before Supabase fetch) using localStorage cache to prevent flash.
Call again after Supabase branding fetch resolves.
Call again when user saves branding in Settings.

Public components MUST use var(--color-*) — never hardcode Tailwind color classes
on nav, hero, buttons, CTA bands, or footer.
Admin dashboard components keep their own hardcoded colors — do not change those.

Flash prevention:
  On init: applyShellTheme(localStorage.getItem('pfp_template') || 'modern-pro')
  After fetch: applyShellTheme(branding.template, ...) + update localStorage

---

## STRIPE — SUBSCRIPTION CHECKOUT
Subscription checkout via Stripe Checkout Sessions (recurring only).
**Subscription:**
  Edge function: create-checkout-session
  mode: 'subscription'
  Single line_item: recurring price ID
  NO setup fee in this session
  Saved to: prospects.payment_link_url
**Setup fee collection:** Removed from intake form in S171. Planned for rebuild on the admin dashboard side (post-cutover). Source for the original create-setup-invoice + send-invoice-email functions is preserved in git history (deleted in S173).

Price IDs (recurring):
  Starter  = price_1TIZ6DCZBM0TUusSaC2UdcYG  ($149/mo)
  Grow     = price_1TIrvGCZBM0TUusSNBntvS6l  ($249/mo)
  Pro      = price_1TIrvcCZBM0TUusS4BJt8oQi  ($349/mo)
  Elite    = price_1TIrw3CZBM0TUusSomA1hsT4  ($499/mo)

---

## KEY TABLES (Ironwood Ops specific)

### prospects
All pipeline data. Key fields:
  status: prospect|quoted|paid|onboarding|provisioned|active|churned
  tenant_id: UUID FK → tenants (set after provisioning)
  onboarding_rep_id: UUID FK → salespeople
  salesperson_id: UUID FK → salespeople
  setup_invoice_url: TEXT (Stripe hosted invoice URL)
  payment_link_url: TEXT (Stripe subscription checkout URL)
  admin_email: must be valid format with TLD before provisioning

### salespeople
  commission_setup_pct: % of one-time setup fee
  commission_recurring_pct: % of monthly recurring
  invited_at: set when Supabase invite email is sent

### ironwood_integrations
  Platform key visibility panel. Secret keys are in Doppler env vars — not stored here.
  Non-secret values (App IDs, etc.) stored in value column.

---

## EDGE FUNCTIONS

| Function | Purpose | JWT |
|----------|---------|-----|
| provision-tenant | Creates tenant, auth user, profiles, user_roles, all settings | false |
| ironwood-provision | JWT-verified wrapper — calls provision-tenant with service role | true |
| create-checkout-session | Stripe subscription checkout | true |
| invite-salesperson | Supabase auth invite by email | true |
| ironwood-stripe-report | Stripe MRR summary for Reports tab | true |
| stripe-webhook | Handles Stripe events (renewals/cancellations) | false |

---

## PLATFORM KEY ARCHITECTURE

Platform-wide keys live in Doppler → injected as env vars into edge functions.
Per-client keys (Facebook token, Google Business token) stored in tenant settings.integrations.
Clients can NOT see or change platform keys.
Only mandatory per-client secrets: facebook_access_token, google_business_token.
These are collected by Scott during the reveal call and saved via Ironwood Ops
Provisioning section → Reveal Call Checklist.

---

## DESIGN NON-NEGOTIABLES

- Footer always has "Powered by PestFlow Pro" badge (orange link)
- HolidayBanner renders ABOVE Navbar on all public pages
- PageHelpBanner on EVERY admin tab
- Nav logo: if branding.logo_url set → show <img>, else show business name text
- Admin login page: show tenant business name (from get_business_name RPC), not "PestFlow Pro"
- Amber padlocks on gated features (not gray) — signals "attainable upgrade"

---

## GIT RULES

- Work only on `main`. Never create a branch. Never open a PR.
- Commit and push after EVERY task — not just at end of session
- Format: `git add . && git commit -m "task[N]: what was done" && git push`

---

## RLS AUDIT (run this when table data appears missing)

```sql
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND NOT ('anon' = ANY(roles) OR 'public' = ANY(roles))
ORDER BY tablename;
```
Any row returned = anon blocked. Fix:
```sql
CREATE POLICY "allow_read_anon" ON {table} FOR SELECT TO anon USING (true);
```

---

## SESSION REPORT FORMAT

Keep it short:
1. Files modified (list)
2. What the actual bug/fix was (1-2 sentences per task)
3. Build status + bundle size
4. Any workarounds used
5. What's left for next session

Do not recap every step. Scott just needs the outcome.
