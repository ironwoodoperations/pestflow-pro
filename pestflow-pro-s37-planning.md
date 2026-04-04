# PestFlow Pro — Session 37 Planning Doc
_Captured from Scott / Ironwood Operations Group planning session_
_S36 must complete before S37 starts_

---

## PRE-S37 MANUAL STEPS (do before S37 coding starts)

These require no code — do them between S36 and S37:

1. **Vercel** — upgrade to Pro ($20/mo)
2. **Vercel** — add `pestflowpro.com` and `*.pestflowpro.com` as domains on the project
3. **DNS** — point `pestflowpro.com` nameservers/records to Vercel (Vercel shows exact records)
4. **Doppler** — create PestFlow Pro project, migrate all env vars from Vercel into Doppler, connect Doppler → Vercel sync
5. **1Password** — store all admin credentials, API keys, Supabase secrets, Vercel tokens in 1Password vault

---

## SESSION 37 SCOPE

### Priority 1 — Subdomain Routing (core delivery mechanism)

**Goal:** `lonestarpest.pestflowpro.com` reads slug → looks up tenant in Supabase → loads their data.

**Tasks:**
- Add `slug` field to `tenants` table in Supabase (e.g. `lonestarpest`)
- Add `slug` input to Client Setup Wizard Step 1 (auto-generates from company name, editable)
- Build subdomain router — on app load, read `window.location.hostname`, extract subdomain, query Supabase for matching tenant, set tenant ID in context
- Wildcard subdomain: `*.pestflowpro.com` → same Vercel deployment → router handles it
- Root domain `pestflowpro.com` → marketing/landing page (or redirect to admin login)
- Admin login at `[slug].pestflowpro.com/admin`
- Test end-to-end: provision test tenant → confirm `[slug].pestflowpro.com` loads their data

**Supabase change:**
```sql
ALTER TABLE tenants ADD COLUMN slug TEXT UNIQUE;
CREATE INDEX idx_tenants_slug ON tenants(slug);
```

---

### Priority 2 — Doppler + 1Password Integration

**Doppler (secrets management):**
- Replaces manual Vercel env var management
- All secrets live in Doppler → auto-synced to Vercel on deploy
- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_TENANT_ID`, Resend keys, Textbelt key, Pexels key, etc.
- Claude Code reads from Doppler CLI in Codespaces: `doppler run -- npm run dev`
- Add `CLAUDE.md` note: always run dev server via Doppler CLI
- Add `.doppler` config file to repo root

**1Password (credential vault):**
- All admin logins, API keys, Supabase dashboard password, Vercel login, domain registrar login
- No secrets stored in plain text anywhere (Slack, Notes, email)
- No code changes needed — this is operational, not a code task

---

### Priority 3 — Firecrawl Site Migration Tool

**Goal:** Scrape an existing pest control site → rebuild it as a custom shell inside PestFlow Pro.

**Pricing tiers established:**
| Package | Price | Description |
|---|---|---|
| Standard Build | $2,000 upfront | Template-based shell, onboarding wizard, live in 1–2 days |
| Custom Migration | $3,500 upfront | Firecrawl rebuild matching client's existing site design |
| Premium Migration | $5,000 upfront | Custom migration + new shell design departing from current site |

Plus same monthly subscription ($99–$499) on top regardless of build package.

**Firecrawl tasks:**
- Add Firecrawl API key to Doppler + 1Password
- Build a migration utility script (Claude Code runs it): feed in client URL → Firecrawl returns MD files → Claude Code uses them as source material to build a new shell
- Output: new shell files in `src/shells/[client-slug]/` with their copy, colors, and structure
- This is a Claude Code workflow tool, not a UI feature

**Sales pitch for migration:**
> "We rebuild your existing site exactly as it looks today — same design, same copy — and add a full CRM, review automation, and AI tools behind it."

**Caveat to note:** Heavy CSS animations or complex layouts will lose some fidelity. Standard pest control sites come out nearly pixel-perfect.

---

## DELIVERY FLOW (post-S37)

1. Scott sells client (phone/demo)
2. Scott runs Client Setup Wizard — 10 min — sets their slug
3. `provision-tenant` edge function fires — creates tenant record, seeds settings
4. Client gets onboarding email with their login and live URL
5. Client site is live at `[slug].pestflowpro.com` immediately
6. Client logs in at `[slug].pestflowpro.com/admin` and completes onboarding wizard
7. Done — no dev work per client

---

## TEST TENANT (for S37 subdomain routing test)

| Field | Value |
|---|---|
| Company | Lone Star Pest Defense |
| Slug | `lonestarpest` |
| URL | `lonestarpest.pestflowpro.com` |
| Industry | Pest Control |
| Phone | (512) 555-0187 |
| Email | info@lonestarpestdefense.com |
| Address | 847 W. Oltorf Street, Austin, TX 78704 |
| Hours | Mon–Fri 7am–6pm / Sat 8am–2pm |
| Tagline | Austin's First Line of Defense Against Pests. |
| Founded | 2016 |
| Technicians | 5 |
| License | TPCL-0023847 |
| Certifications | QualityPro Certified, GreenPro Certified |
| Primary Color | #15803D (green) |
| Accent Color | #CA8A04 (yellow) |
| Template | bold-local |
| CTA Text | Get a Free Inspection |
| Hero Headline | Austin's Most Trusted Pest Control Team |
| Owner | Danny Reeves |
| Owner Email | danny@lonestarpestdefense.com |
| Plan | Tier 2 — Growth — $149/mo |
| Admin Login | admin@lonestarpestdefense.com / lspd123demo |

---

## S37 TASK ORDER

1. Pre-session: confirm Vercel Pro + wildcard domain + Doppler sync are live
2. Supabase: add `slug` column to tenants table
3. Client Setup Wizard: add slug field
4. Build subdomain router
5. Test with Lone Star Pest Defense test tenant
6. Wire Doppler CLI into Codespaces dev workflow + update CLAUDE.md
7. Firecrawl migration utility script
8. Final build — 0 TS errors, bundle under 450 kB

---

## RULES CARRY FORWARD (never change)

- Model: `claude-sonnet-4-6` always
- Relative imports only
- Single useState object for forms
- All files under 200 lines
- maybeSingle() for settings queries
- Working directly on main — no PR needed
- Stop and summarize at 50% context window
