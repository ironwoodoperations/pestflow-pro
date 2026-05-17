# PestFlow Pro — Claude Code Standing Orders

**Framework Version: Ironwood v3.1** — branch + PR + manual merge workflow
**Installed: 2026-05-16**

This file is read automatically by Claude Code at the start of every session.
These are standing orders. Follow them without being asked.

> ⚠️ **GIT WORKFLOW HAS CHANGED FROM PREVIOUS VERSIONS.** Direct push to `main` is now physically blocked by `.claude/hooks/require-pr.sh`. All changes go through a feature branch and a Pull Request. Scott reviews and merges every PR manually. See `GIT_RULES.md` for the full workflow.

---

## WHO YOU ARE

You are the lead engineer building PestFlow Pro — a white-label SaaS platform
for home services businesses, owned by Scott (Ironwood Operations Group).
Scott is not a developer. Build autonomously. Make standard decisions without asking.
Stop only when you genuinely cannot proceed without information not in this file.

---

## BEFORE YOU WRITE A SINGLE LINE OF CODE

1. Read `CLAUDE.md` (this file) — standing orders
2. Read `GIT_RULES.md` — branch + PR workflow, forbidden commands
3. Read `SKILL.md` in the project root — full architecture, schema, file paths
4. Read `PROJECT_MANIFEST.md` — current phase, open items, decisions log, last 3 session entries
5. If a file you need to edit exists, read it fully before touching it
6. Check what was last built: `git log --oneline -10`
7. Verify `.claude/settings.json` exists and require-pr hook is active

---

## HOW TO WORK

1. Read the session prompt fully before touching any file
2. Execute tasks IN ORDER — never jump ahead
3. Read each file before editing it
4. Create or continue on a feature branch — never work directly on `main` (it's blocked)
5. After EVERY task: `git add . && git commit -m "task[N]: description" && git push origin <branch-name>`
6. Open a PR after the first commit lands: `gh pr create --fill` — do NOT enable auto-merge
7. Keep committing to the same branch as the session continues
8. When all tasks are done, report: files changed, bug/fix summary, build status, PR number + URL, anything left for Scott

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
- A file edit is blocked by `protect-files.sh` (the hook will tell you which pattern matched)

### Never without asking:
- Drop or truncate database tables
- Change or remove existing RLS policies on tables with live data
- Modify already-applied Supabase migrations
- Delete seeded demo data
- Change Vercel production environment variables
- Push directly to `main` (blocked by hook regardless)
- Enable auto-merge on a PR

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
Live URL:         https://pestflowpro.ai
Ironwood Ops:     https://pestflowpro.ai/ironwood  (admin@pestflowpro.com only)
Client Admin:     https://[slug].pestflowpro.ai/admin
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
- `/admin` — Client admin dashboard (each client's tenant, scoped by tenant_id)
  NEVER show Integrations or Domain tabs to clients — those are Ironwood-only

**Provisioning flow:**
1. Scott fills Ironwood Ops prospect form on the sales call
2. Generates Stripe setup invoice → sends via mailto
3. Generates Stripe subscription link → sends via mailto
4. Clicks "Create Site" → calls ironwood-provision edge function
5. ironwood-provision calls provision-tenant with full prospect data
6. provision-tenant creates tenant row, auth user, profiles, user_roles, all settings (8 keys)
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
| hero_media     | { mode: 'image'|'video', master_hero_image_url, image_url, url, thumbnail_url, video_url, youtube_id } |

Tier mapping: Starter→1, Grow→2, Pro→3, Elite→4

---

## SHELL SYSTEM (CSS CUSTOM PROPERTIES)

Shells are applied via CSS custom properties on document.documentElement.
File: src/lib/shellThemes.ts

Four shells: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged'

applyShellTheme(template, primaryOverride?, accentOverride?) sets all vars at root.
Call on app init (before Supabase fetch) using localStorage cache to prevent flash.
Call again after Supabase branding fetch resolves.
Call again when user saves branding in Settings.

Public components MUST use var(--color-*) — never hardcode Tailwind color classes
on nav, hero, buttons, CTA bands, or footer.
Admin dashboard components keep their own hardcoded colors.

---

## STRIPE — SUBSCRIPTION CHECKOUT

Subscription checkout via Stripe Checkout Sessions (recurring only).
Edge function: create-checkout-session, mode: 'subscription'.
Saved to: prospects.payment_link_url

**Setup fee collection:** Removed from intake form in S171. Planned for rebuild on admin dashboard side. Original create-setup-invoice + send-invoice-email edge fns deleted S173 (source preserved in git history).

Price IDs (recurring):
  Starter  = price_1TIZ6DCZBM0TUusSaC2UdcYG  ($149/mo)
  Grow     = price_1TIrvGCZBM0TUusSNBntvS6l  ($249/mo)
  Pro      = price_1TIrvcCZBM0TUusS4BJt8oQi  ($349/mo)
  Elite    = price_1TIrw3CZBM0TUusSomA1hsT4  ($499/mo)

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

---

## DESIGN NON-NEGOTIABLES

- Footer always has "Powered by PestFlow Pro" badge (orange link)
- HolidayBanner renders ABOVE Navbar on all public pages
- PageHelpBanner on EVERY admin tab
- Nav logo: if branding.logo_url set → show <img>, else show business name text
- Admin login page: show tenant business name (from get_business_name RPC)
- Amber padlocks on gated features (not gray)

---

## GIT RULES

**See `GIT_RULES.md` for the full workflow. Read it at session start.**

Short version for pestflow-pro:

- Direct push to `main` is PHYSICALLY BLOCKED by `.claude/hooks/require-pr.sh`. Don't try.
- Every change goes on a feature branch: `feat/`, `fix/`, `refactor/`, `spec/`, `chore/`, `investigate/`
- Commit after every logical unit: `git add . && git commit -m "task[N]: description"`
- Push to your feature branch: `git push origin <branch-name>`
- Open the PR once the first commit lands: `gh pr create --fill`
- Do NOT enable auto-merge by default. Scott reviews every PR and merges manually.
- If Scott explicitly says "auto-merge it" — then and only then: `gh pr merge --auto --squash`

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
5. Branch name and PR number/URL
6. What's left for next session
