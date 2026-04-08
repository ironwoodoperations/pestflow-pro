# PestFlow Pro — Project Context (S91 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — generated in Claude.ai, handed to Claude Code_

---

## ⚠️ SESSION RULES — READ FIRST, EVERY SESSION
- **50% context window rule:** When you estimate you are at 50% of the context window,
  STOP and output a plain summary immediately. Do not wait. Do not skip.
- Keep responses short and action-focused
- After every task: `git add . && git commit -m "task[N]: description" && git push`
- **Working directly on main — no branches, no PRs, ever**
- If not on main: `git checkout main` before doing anything
- Do NOT generate a context file — plain summary only at end
- Dev server: doppler run -- npm run dev — never npm run dev directly

---

## THEMING RULE — MANDATORY

Tailwind ONLY for: spacing, layout, flex/grid, border-radius, sizing, shadows,
transitions, opacity.
ALL colors in public-facing components MUST use CSS custom properties via inline style.
No hardcoded hex values for brand colors in any public shell component.

Exceptions (do not change):
  - src/components/admin/, src/components/ironwood/
  - IronwoodOps.tsx, IronwoodLogin.tsx, Login.tsx
  - Index.tsx bg-black/30 — video overlay
  - clean-friendly/ShellHero.tsx — color-mix #000 blend target
  - SlugRouter.tsx bg-[#0a0f1e] — loading spinner

---

## CRITICAL CONSTANTS (never change)

```
Live URL:        https://pestflowpro.com  (NOT www.pestflowpro.com)
Client Admin:    https://[slug].pestflowpro.com/admin
Ironwood Ops:    https://pestflowpro.com/ironwood
Ironwood Login:  https://pestflowpro.com/ironwood/login
GitHub:          https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:    https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:     biezzykcgzkrwdgqpsar
Demo Tenant ID:  9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Tenant Slug: pestflow-pro
Demo Admin URL:  https://pestflow-pro.pestflowpro.com/admin
Demo Admin:      admin@pestflowpro.com / pf123demo
Live site:       https://pestflow-pro.vercel.app
Dev server:      doppler run -- npm run dev → localhost:8080
Model:           claude-sonnet-4-6 (ALWAYS — no exceptions)
Stack:           React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel
Bundle limit:    450 kB (currently 427 kB ✓)
```

---

## KEY LEARNINGS & PRINCIPLES

- **Auth: ALWAYS `refreshSession()`, NEVER `getSession()`** — Non-negotiable.

- **Verify JWT toggle is a recurring trap:**
  Any newly deployed edge function defaults to Verify JWT = ON.
  First 401 diagnostic: Supabase dashboard → Edge Functions → Settings → toggle OFF.
  Affected: scrape-prospect, ironwood-provision, generate-youpest (all OFF).

- **Template canonical names — CRITICAL (fixed S89):**
  ALWAYS use: modern-pro | clean-friendly | bold-local | rustic-rugged | youpest
  NEVER use short names: modern | clean | bold | rustic
  Template stored in settings.branding.template (JSONB) — NOT a standalone settings key.

- **React 18 batching trap:** Always update related fields atomically in a single setState.

- **Event propagation trap:** Nested close buttons must call e.stopPropagation().

- **RLS policies are a recurring failure point:** Check pg_policies first.

- **Small files prevent Claude Code timeouts:** All files under 200 lines.

---

## PRICING / TIER STRUCTURE

### Monthly Recurring
  Starter $149 / Grow $249 / Pro $349 / Elite $499

### One-Time Setup Fees
  Starter  $0–$1,000     — Wizard: pick shell + palette.
  Growth   $1,000–$1,500 — Firecrawl scrape → Claude → shell/color recommended.
  Pro      $2,000–$3,500 — Claude-generated youpest shell from scrape.
  Elite    $4,000–$10,000 — Fully custom.

---

## TEMPLATE CONTEXT ARCHITECTURE

File: src/context/TemplateContext.tsx
Reads template from settings.branding.template (JSONB).
Single Promise.all fetches branding AND business_info on load.
Colors: applyShellTheme() from localStorage cache on init, then after fetch.

---

## PUBLIC SHELL COMPONENTS — 5 SHELLS

Canonical template names:
  modern-pro | clean-friendly | bold-local | rustic-rugged | youpest

youpest = Pro tier only. NOT in shell picker. NOT in PALETTES array.

Modern Pro sub-components (S80):
  src/shells/modern-pro/ — ModernProTrustBar, ModernProServicesGrid, ModernProAboutStrip,
  ModernProWhyChooseUs, ModernProTestimonials, ModernProCtaBanner, ShellHomeSections

Clean & Friendly sub-components (S83):
  src/shells/clean-friendly/ — CleanFriendlyTrustBar, CleanFriendlyServicesGrid,
  CleanFriendlyAboutStrip, CleanFriendlyWhyChooseUs, CleanFriendlyTestimonials,
  CleanFriendlyFaqStrip, CleanFriendlyCtaBanner, ShellHomeSections

---

## YOUPEST SHELL — PRO TIER (S86–S88 complete)

JSON-driven. layout_config from youpest_layout table.
Index.tsx: template=youpest → short-circuits to <ShellSectionsRenderer />
ShellHomeSections: fetches layout, calls applyShellTheme with layout_config.colors
GenerateProLayout.tsx: visible when prospect.tier='pro', spinner → JSON preview →
  Edit textarea → JSON.parse validation → Save to prospects.youpest_layout

---

## SOCIAL MEDIA — BUFFER (default) / AYRSHARE (future scale)

Active provider: Buffer ($6/channel/month)
Future: Ayrshare ($150+/mo) — switch when platform reaches scale

Buffer API:
  Endpoint: https://api.bufferapp.com/1/updates/create.json
  Auth: Bearer token per connected account
  Scopes needed: publish, read
  Per-tenant: each client connects their own Buffer account via OAuth
  Platform key: BUFFER_ACCESS_TOKEN in Supabase edge function secrets (for platform posts)
  Per-tenant token: stored in settings.integrations.buffer_access_token

Admin social tab: currently wired for Ayrshare — needs update to Buffer in S91.
active_social_provider: set to 'buffer' in demo tenant settings (updated S90).

⚠️ Ayrshare references in code need to be replaced with Buffer in S91.

---

## PROSPECT TIER SYSTEM

prospects.tier: TEXT default 'growth' — values: starter | growth | pro
Tier selector: segmented control in ProspectDetail header, saves immediately
Badges: gray (starter) | blue (growth) | indigo (pro)
Intake Step 2: Pro Custom Build card replaces shell picker when tier=pro

---

## SCHEMA

page_content: tenant_id, page_slug, title, subtitle, intro,
  video_url, image_url, image_urls (JSONB)
  Upsert conflict: (tenant_id, page_slug)

settings.branding JSONB: { logo_url, favicon_url, primary_color, accent_color,
  template, cta_text }

settings.integrations JSONB: { owner_sms_number, textbelt_api_key (deprecated — use secret),
  buffer_access_token, google_api_key, google_place_id, google_analytics_id,
  active_social_provider, ... }

prospects: scraped_content JSONB, source_url TEXT, service_areas TEXT,
  hero_headline TEXT, youpest_layout JSONB, tier TEXT default 'growth'

youpest_layout: id, tenant_id, layout_config JSONB, generated_at,
  generated_from TEXT, status TEXT (draft|applied). Unique index on tenant_id.

location_data: id, tenant_id, city, slug, hero_title, intro_text, active,
  meta_title, meta_description, focus_keyword
  ⚠️ Table name is `location_data` — NOT `locations`

page_slugs (17): home, about, pest-control, termite-control, termite-inspections,
  roach-control, ant-control, mosquito-control, bed-bug-control, flea-tick-control,
  rodent-control, scorpion-control, spider-control, wasp-hornet-control,
  contact, faq, quote

---

## ACTIVE TENANTS

| Name | Slug | Template | Status |
|------|------|----------|--------|
| PestFlow Pro | pestflow-pro | modern-pro | Demo |
| Cypress Creek Pest Control | cypress-creek-pest-control | modern-pro | ⚠️ Needs logo + home headline before go-live |

Cypress Creek pre-launch checklist (manual — Scott handles):
  ✅ business_info fully populated
  ✅ branding.template = modern-pro
  ✅ branding.primary_color = #334155, accent = #E87800
  ✅ notifications.lead_email = admin@cypresscreekpest.com
  ✅ social_links leading spaces removed
  ⚠️ Home page title/headline — EMPTY — set in Content tab
  ⚠️ Logo — not uploaded — upload in Branding tab
  ⚠️ Phone unformatted (9035419287) — consider (903) 541-9287

---

## NOTIFICATIONS & SMS

### Email (Resend)
From: onboarding@pestflow.ai — Verified ✓
sendEmail.ts: replyTo + text/plain fallback added (S90)
Customer auto-reply: full HTML template with logo, submitted info, phone CTA (S90)

### SMS (Textbelt)
Architecture confirmed correct. notify-new-lead → send-sms → Deno.env.get('TEXTBELT_API_KEY')
⚠️ ACTION REQUIRED: supabase secrets set TEXTBELT_API_KEY=<key> --project-ref biezzykcgzkrwdgqpsar
Per-tenant: owner_sms_number in settings.integrations

---

## COLOR PALETTE SYSTEM

File: src/lib/shellThemes.ts — 12 palettes, any shell.
applyShellTheme(template, primaryOverride, accentOverride)
--color-btn-bg = accentOverride ?? primaryOverride

12 palettes:
  Navy & Gold (#1e3a5f / #f59e0b)      Forest & Cream (#2d6a4f / #fef3c7)
  Slate & Orange (#334155 / #E87800)   Orange & Black (#E87800 / #1a1a1a)
  Red & Dark (#b91c1c / #1a1a1a)       Green & Black (#15803d / #1a1a1a)
  Sky & White (#0ea5e9 / #ffffff)      Teal & Light (#0d9488 / #f0fdfa)
  Purple & Soft (#7c3aed / #faf5ff)    Brown & Tan (#78350f / #fef3c7)
  Green & Earth (#365314 / #fef9c3)    Rust & Cream (#9a3412 / #fff7ed)

---

## PEST IMAGES

Location: public/images/pests/ — serve path: /images/pests/{filename}
ant-control→ant.jpg | bed-bug-control→bed_bug.jpg | flea-tick-control→flea_tik.jpg
mosquito-control→Mosquito.jpg | pest-control→pest_control.jpg | roach-control→roach.jpg
rodent-control→rodent.jpg | scorpion-control→scorpion.jpg | spider-control→spider.jpg
termite-control→termite_control.jpg | termite-inspections→termite_inspection.jpg
wasp-hornet-control→wasp_hornet.jpg

---

## REP PLAYBOOK SYSTEM

src/components/ironwood/: repGuideContent.ts, RepGuideButton.tsx,
RepGuideDrawer.tsx, PreProvisionChecklist.tsx, ProspectDetail.IntakeLink.tsx
8 guide buttons. Regenerate intake link + Delete prospect both implemented.

---

## FIRECRAWL / SITE SCRAPER

Edge fn: supabase/functions/scrape-prospect/ (index.ts, mapContent.ts, analyzeSite.ts)
ScrapePanel.tsx + SiteRecreationCard.tsx (Growth tier)
Verify JWT = OFF. FIRECRAWL_API_KEY + ANTHROPIC_API_KEY in secrets.

---

## EDGE FUNCTIONS

| Function                | JWT   |
|-------------------------|-------|
| provision-tenant        | false ⚠️ --no-verify-jwt always |
| scrape-prospect         | false ⚠️ Verify JWT OFF in dashboard |
| generate-youpest        | false ⚠️ Verify JWT OFF in dashboard |
| ironwood-provision      | true ⚠️ Verify JWT OFF in dashboard |
| notify-new-lead         | false |
| send-sms                | false |
| create-checkout-session | true  |
| create-setup-invoice    | true  |
| invite-salesperson      | true  |
| ironwood-stripe-report  | true  |
| stripe-webhook          | false |
| send-intake-email       | true  |
| send-invoice-email      | true  |
| send-credentials-email  | true  |

NEVER use apikey header on provision-tenant, scrape-prospect, or generate-youpest.
Auth: ALWAYS refreshSession() — NEVER getSession().

---

## RESEND EMAIL

From: onboarding@pestflow.ai — Verified ✓
RESEND_API_KEY in Supabase edge function secrets ✓
sendEmail.ts: supports replyTo + text/plain fallback (added S90)

---

## ADMIN UI

Fixed neutral dark colors. --admin-accent CSS var at Dashboard.tsx. Default: #10b981.

---

## SEO ADMIN TAB

Pages: AI Generate per row (SeoInlineEditor.tsx + useSeoAiGenerate.ts)
Connect: mock previews — GSC, GA4, PageSpeed (amber "Sample Preview" badge)

---

## CSS VARIABLES

All in shellThemes.ts:
  --color-primary, --color-accent, --color-primary-dark, --color-primary-light,
  --color-text-on-primary, --color-bg-hero, --color-bg-hero-end,
  --color-bg-section, --color-bg-cta, --color-nav-bg, --color-nav-text,
  --color-footer-bg, --color-footer-text, --color-btn-bg, --color-btn-text, --color-heading

---

## KNOWN REMAINING ISSUES

1. Textbelt API key not yet set — SMS will not fire until key is in secrets.
2. VITE_GOOGLE_MAPS_API_KEY not yet set in Doppler/Vercel.
3. Social tab still references Ayrshare — needs Buffer update in S91.
4. Cypress Creek: logo + home headline needed before go-live (manual).
5. Setup Fee invoice — silently fails. Post-launch.
6. Custom hex primary override doesn't update nav/footer.
7. Step number circles on service pages — hardcoded colors. Low priority.

---

## BACKLOG

### ⚠️ PRE-LAUNCH REQUIRED (manual ops)
- Stripe live mode + register webhook
- Purchase Textbelt key → supabase secrets set TEXTBELT_API_KEY=<key>
- Set VITE_GOOGLE_MAPS_API_KEY in Doppler + Vercel
- Add yourself to Sales + Support mailboxes in M365 admin
- Cypress Creek: upload logo, set home headline, format phone number

### POST-LAUNCH — PRIORITY ORDER
1. Upgrade Firecrawl to Hobby ($16/mo) for real Pro tier crawl
2. Setup Fee invoice fix
3. Custom hex nav/footer color fix
4. Bold-local + rustic-rugged homepage rebuilds
5. Per-tenant Resend sending domains
6. SlugRouter loading spinner

---

## SESSION LOG

| Session | Key Completions |
|---------|-----------------|
| S1–S67  | Full platform build |
| S68–S79 | RLS, email, content, palette system, zero flash |
| S80     | Modern Pro homepage rebuild |
| S81–S82 | Firecrawl scrape + provision seeding |
| S83     | 12 palettes any shell; Clean & Friendly rebuild |
| S83-hf  | Palette accent atomic fix |
| S84     | Growth tier — Site Recreation card |
| S84-hf1/2/3 | Nav/footer/btn palette-driven |
| S85a    | Blog featured image; SEO AI generate; SEO Connect mocks |
| S85b    | Google Maps; location_data SEO fields; admin accent color |
| S86     | Pro tier foundation: youpest_layout; generate-youpest; shell scaffold |
| S87     | Youpest section polish: all variants; nav scroll; footer variants |
| S88     | generate-youpest prompt rewrite; double-hero fix; color wiring; Edit JSON UI |
| S89     | Bundle 427 kB; tier selector; template canonical fix; intake Pro card; SMS arch confirmed |
| S90     | Auto-reply email HTML rewrite; regenerate link confirmed; delete prospect confirmed; E2E DB checks; Cypress Creek pre-flight; social_links trimmed; Buffer set as default provider |
| hotfix  | Replaced all hardcoded Ironclad text in src/ |

---

## RULES (NEVER VIOLATE)

- Model: claude-sonnet-4-6 always
- Relative imports only — no @/ aliases
- Single useState object for forms — never per-field state
- maybeSingle() not single() for settings queries
- All files under 200 lines — split if needed
- Admin tabs lazy-loaded with React.lazy()
- Working directly on main — no branches, no PRs
- STOP at 50% context window
- Dev server: always doppler run -- npm run dev
- provision-tenant: ALWAYS deploy with --no-verify-jwt
- scrape-prospect + ironwood-provision + generate-youpest: Verify JWT = OFF in dashboard
- JWT functions: Authorization Bearer + apikey headers on every fetch
- NEVER use apikey header on provision-tenant, scrape-prospect, or generate-youpest
- JWT validation: ALWAYS use anonClient, NEVER service role for getUser()
- Auth calls: ALWAYS refreshSession() — NEVER getSession()
- setState: always update related fields atomically in a single call
- Nested close buttons: ALWAYS e.stopPropagation()
- Claude Code sessions: always start with git checkout main && git pull
- Template names: ALWAYS canonical (modern-pro, clean-friendly, bold-local,
  rustic-rugged, youpest) — NEVER short names
