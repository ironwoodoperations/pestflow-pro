# PestFlow Pro — Project Context (Session 41 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- Follow the session roadmap exactly. Log conflicts in commit messages.
- Do NOT generate a session 42 context file. End with a plain summary only.

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

## BUILD STATUS (end of S40)

- Build: 0 TS errors
- Bundle: 384 kB — under 450 kB limit ✅
- Subdomain routing: live
- All 4 original shells: stable — do NOT modify in S41
- Tenant auth isolation: complete and verified
- provision-tenant: fully hardened (v3)
  - Uses supabase.auth.admin.createUser() — NULL columns handled by Admin API
  - Inserts into tenant_users after user creation — has_role passes on first login
  - Seeds all 11 required settings keys
- Firecrawl migration tool: scripts/migrate-site.ts — working
- youpest shell: built as migration workflow demo
- Dashboard plan card: moved to top of dashboard layout
- FIRECRAWL_API_KEY: in Doppler

---

## PROVISION-TENANT (v3) — HARDENED

The edge function now correctly:
1. Creates auth user via Admin API (no NULL column issues)
2. Inserts admin into tenant_users (has_role passes immediately)
3. Seeds all 11 settings keys with correct shapes

Required settings shapes (reference):
- onboarding_complete → `{"complete": true}`
- hero_media         → `{"youtube_id": "", "thumbnail_url": ""}`
- holiday_mode       → `{"enabled": false, "holiday": "", "message": "", "auto_schedule": ""}`
- notifications      → `{"cc_email": "", "lead_email": "[email]", "monthly_report_email": "[email]"}`
- demo_mode          → `{"active": false, "seeded_at": ""}`
- subscription       → `{"tier": 1, "plan_name": "Starter", "monthly_price": 99}`

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

## SETTINGS KEYS (JSONB) — ALL 11 REQUIRED

```
business_info        -> {name, phone, email, address, hours, tagline, industry,
                         license, certifications, founded_year, num_technicians}
branding             -> {logo_url, primary_color, accent_color, template, cta_text, favicon_url}
customization        -> {hero_headline, show_license, show_years,
                         show_technicians, show_certifications}
social_links         -> {facebook, instagram, google, youtube}
integrations         -> {google_place_id, facebook_page_id, facebook_access_token,
                         google_analytics_id, pexels_api_key, textbelt_api_key,
                         owner_sms_number, ayrshare_api_key, google_maps_api_key}
onboarding_complete  -> {"complete": true}
hero_media           -> {"youtube_id": "", "thumbnail_url": ""}
holiday_mode         -> {"enabled": false, "holiday": "", "message": "", "auto_schedule": ""}
notifications        -> {"cc_email": "", "lead_email": "", "monthly_report_email": ""}
demo_mode            -> {"active": false, "seeded_at": ""}
subscription         -> {"tier": 1, "plan_name": "Starter", "monthly_price": 99}
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
| provision-tenant | ACTIVE v3 — hardened | Admin API + tenant_users + all 11 keys |

Verified Resend domain: pestflow.ai

---

## SHELL SYSTEM (stable — do not modify in S41)

```
src/shells/
  modern-pro/     navy+emerald, centered hero
  bold-local/     charcoal+amber, 2-col split hero
  clean-friendly/ white+sky, giant phone CTA hero
  rustic-rugged/  brown+rust, split left/right hero
  youpest/        dark charcoal+green, migration demo shell
```

---

## FIRECRAWL MIGRATION TOOL

Script: scripts/migrate-site.ts
Usage: doppler run -- npx ts-node scripts/migrate-site.ts [URL] [slug]
Output: scripts/output/[slug]-content.md
Note: some sites block Firecrawl (403) — not a script bug. Works against accessible sites.
Workflow documented in CLAUDE.md under "Migration Workflow".

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
| 39 | Apr 2026 | Tenant auth isolation. has_role fixed. lonestarpest login working |
| 40 | Apr 2026 | provision-tenant v3 hardened. Firecrawl tool built. youpest shell. Bundle: 384 kB |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| S41 | End-to-end client onboarding test + polish — this session |
| S42+ | First real paying client delivery |

---

## SESSION 41 SCOPE

### Goal
Run the complete client delivery flow end-to-end for the first time using a throwaway
test tenant. Fix anything that breaks. Leave the platform ready to hand a real client
a live site in under 10 minutes.

---

### Focus 1 — End-to-End Onboarding Flow Test

Run the full wizard → provision → login → site flow with a throwaway tenant.

**Step 1 — Provision a test tenant via Client Setup Wizard**
Use the live admin at pestflowpro.com/admin:
- Company: Test Pest Co
- Slug: testpest
- Plan: Tier 1 Starter
- Shell: modern-pro
- Complete all wizard steps
- Click provision

**Step 2 — Verify provisioning**
Confirm via Supabase that:
- tenants table has slug: testpest
- tenant_users has a row for the new admin user
- settings table has all 11 keys for the new tenant ID
- auth.users has the new admin (no NULL columns)

**Step 3 — Test login**
Go to testpest.pestflowpro.com/admin/login
Login with the generated credentials
Must reach dashboard on first try — no loops, no errors

**Step 4 — Test public site**
Go to testpest.pestflowpro.com
Confirm public shell loads with Test Pest Co data

**Step 5 — Clean up**
After confirming everything works, delete the throwaway tenant:
- Delete from tenants (cascades to settings, tenant_users)
- Delete from auth.users

Document any issues found and fix them before moving on.

---

### Focus 2 — Onboarding Polish (fix anything broken in Focus 1)

Based on what breaks during the test, prioritize fixes in this order:
1. Anything that blocks login or dashboard load — fix immediately
2. Public site not loading tenant data correctly
3. Shell switcher not reflecting wizard selection
4. Onboarding email not firing (send-onboarding-email edge function)
5. Missing or incorrect data in any provisioned settings key

---

### Focus 3 — Client Setup Wizard UX Review

Walk through the wizard on the live site and fix any UX issues:
- Step labels clear and in logical order?
- Password auto-generation visible to Scott (the operator) during wizard?
- Review step shows all critical info: slug, admin email, admin password, plan, shell?
- Success screen shows the live URL + login credentials clearly?
- If onboarding email fires: does it contain the live URL + credentials?

Fix any issues found. No new features — polish only.

---

## SESSION 41 TASK ORDER

1. `doppler run -- npm run dev` — confirm dev server starts
2. Open Client Setup Wizard on live site — walk through all steps for testpest
3. Submit — watch for errors in console and network tab
4. Verify DB state via Supabase (all 5 checks in Focus 1 Step 2)
5. Test login at testpest.pestflowpro.com/admin/login
6. Test public site at testpest.pestflowpro.com
7. Document any failures — fix in order of priority
8. Clean up throwaway tenant from DB
9. Walk wizard again — UX review — fix issues
10. Final build — 0 TS errors, bundle under 450 kB
11. Report bundle size + list of any fixes made

---

## SESSION 41 STARTER BLOCK

Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 40 is complete. provision-tenant is hardened (v3). Firecrawl migration tool is
built and working. Bundle: 384 kB.

Session 41 goal: run the full client delivery flow end-to-end with a throwaway test
tenant and fix anything that breaks. Leave the platform ready to deliver a real paying
client a live site in under 10 minutes.

Follow the task order exactly.
Do NOT generate a session 42 context file. End with a plain summary only.
Stop and output a summary at 50% context window.
Report exact bundle size after final build.
Dev server: doppler run -- npm run dev — never npm run dev directly.
