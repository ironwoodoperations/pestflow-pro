# PestFlow Pro — Project Context (Session 25 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and generate a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- PRs must be created manually in GitHub — no gh CLI or GitHub MCP available
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  If you encounter a conflict, a broken dependency, or a clearly better technical
  approach, stop and log it as a note in the commit message rather than deviating silently.**
- Do NOT generate the next session context file — that is done externally.
  End the session with a plain summary: completions, conflicts, build size, anything skipped.

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflow-pro.vercel.app
Admin URL:      https://pestflow-pro.vercel.app/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Tenant ID:      9215b06b-3eb5-49a1-a16e-7ff214bf6783
Admin login:    admin@pestflowpro.com / pf123demo
Dev server:     npm run dev → localhost:8080
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
Hours:       Mon–Fri 7am–6pm | Sat 8am–2pm
Tagline:     Pest Control You Can Count On.
Industry:    Pest Control
Tenant ID:   9215b06b-3eb5-49a1-a16e-7ff214bf6783
```

⚠️ NO "Dang Pest Control" anywhere in this repo. Demo is IRONCLAD PEST SOLUTIONS only.

---

## ENV VARS

```
VITE_SUPABASE_URL=https://biezzykcgzkrwdgqpsar.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZXp6eWtjZ3prcndkZ3Fwc2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTQ4MjMsImV4cCI6MjA5MDM3MDgyM30.NLuAr1IhZIVixqOnB0BzeTHOlHrjhD5eDDYNGzZ4_dc
VITE_ANTHROPIC_API_KEY=[set in Vercel]
VITE_TENANT_ID=9215b06b-3eb5-49a1-a16e-7ff214bf6783
```

⚠️ VITE_TENANT_ID must be set in .env.local or useTenant() returns null
⚠️ NO `@/` path aliases — use RELATIVE imports throughout
⚠️ Use maybeSingle() not single() for settings queries

---

## SUPABASE TABLES

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `profiles` | id, tenant_id, full_name, role | User profiles |
| `user_roles` | user_id, role | Auth gating — has_role() RPC |
| `tenants` | id, name, created_at | Tenant registry |
| `page_content` | tenant_id, page_slug, title, subtitle, intro, video_url | Editable page content |
| `seo_meta` | tenant_id, page_slug, meta_title, meta_description, og_title, og_description, focus_keyword, user_edited | SEO per page |
| `blog_posts` | tenant_id, title, slug, content, excerpt, published_at, intro_image | Blog |
| `location_data` | tenant_id, city, slug, hero_title, is_live, intro_video_url, maps_embed | Location pages |
| `testimonials` | tenant_id, author_name, author_email, review_text, rating, featured, source, google_review_id | Reviews |
| `leads` | tenant_id, name, email, phone, services, message, status, notes | Quote submissions |
| `settings` | tenant_id, key, value (JSONB) | All business config |
| `keyword_tracker` | tenant_id, keyword, page_slug, volume, difficulty | SEO keywords |
| `keyword_placements` | tenant_id, keyword, page_slug, placement_type, suggested_text, applied | AI keyword mapping |
| `page_snapshots` | tenant_id, page_slug, snapshot_type, snapshot_data | Revert to original |
| `social_posts` | tenant_id, platform, caption, image_url, status, scheduled_for, published_at, fb_post_id, error_msg, campaign_id | Social posts |
| `social_campaigns` | tenant_id, title, goal, tone, duration_days, platforms[], start_date, status | Campaign grouping |

---

## SETTINGS KEYS (JSONB)

```
business_info       → {name, phone, email, address, hours, tagline, license,
                       certifications, founded_year, num_technicians, industry}
branding            → {logo_url, favicon_url, primary_color, accent_color, template}
hero_media          → {youtube_id, thumbnail_url}
holiday_mode        → {enabled, holiday, auto_schedule}
social_links        → {facebook, instagram, google, youtube, twitter}
integrations        → {google_place_id, facebook_page_id, facebook_access_token,
                       google_analytics_id, pexels_api_key}
onboarding_complete → true | false
subscription        → {tier: 1|2|3|4, plan_name: string, monthly_price: number}
demo_mode           → {active: boolean, seeded_at: string}   ← NEW in S25
```

**Demo tenant subscription:** tier 4, plan_name "Elite", monthly_price 499 ✅

---

## TIER GATING SYSTEM

### Architecture
| File | Purpose |
|------|---------|
| `src/context/PlanContext.tsx` | PlanProvider + usePlan — single DB fetch, shared state |
| `src/components/common/FeatureGate.tsx` | `tier` prop + optional `fallback` — preferred for all new usage |
| `src/components/admin/usePlan.ts` | Re-exports usePlan from PlanContext |

### canAccess usage
```tsx
const { canAccess } = usePlan();
canAccess(2) // true if tier >= 2
```

### FeatureGate usage
```tsx
<PageHelpBanner ... />          // always visible, never gated
<FeatureGate tier={2}>          // locks content for tier 1
  {/* tab content */}
</FeatureGate>
```

### Tier map
| Tier | Plan | Price | Unlocks |
|------|------|-------|---------|
| 1 | Starter | $149 | Dashboard, CRM, Testimonials, Settings, Locations (≤3) |
| 2 | Grow | $249 | SEO suite, Blog, Social scheduling, Standard reports |
| 3 | Pro | $349 | AI keyword research, AI social generation, Advanced reports |
| 4 | Elite | $499 | Social analytics, Ayrshare, LeadFusion, White-glove onboarding |

### Gated tabs (as of S24)
| Tab | Gate |
|-----|------|
| BlogTab | `<FeatureGate tier={2}>` ✅ |
| SEOTab | `<FeatureGate tier={2}>` ✅ |
| SocialTab | `<FeatureGate minTier={2}>` ✅ |
| ReportsTab | `<FeatureGate minTier={2}>` ✅ |

### Sidebar lock icons
- Lock icon (lucide, w-3 h-3) + opacity-50 on Blog/SEO/Social/Reports for tier 1 ✅

---

## KEY FILE PATHS

```
src/context/PlanContext.tsx                        ← S23
src/components/common/FeatureGate.tsx              ← S23
src/components/admin/usePlan.ts                    ← re-export shim S23
src/components/admin/dashboard/
  DashboardHome.tsx                                ← S22
  PlanOverviewCard.tsx                             ← NEW S24
src/components/admin/crm/
  types.ts / LeadTable.tsx / LeadDetailModal.tsx   ← S22
src/components/admin/seo/
  useSeoAudit.ts / useSeoTab.ts                    ← NEW S24 (extracted from SEOTab)
  + existing: ScoreRing, SeoStatCards, SeoOverviewTab,
    SeoPagesTab, SeoKeywordsTab, SeoAioTab, SeoConnectTab
src/components/admin/settings/                     ← S24 (8 section files, all <130 lines)
src/components/admin/onboarding/                   ← S20 (6 step sub-components)
src/components/admin/social/                       ← S16 (11 social sub-components)
supabase/functions/send-review-request/            ← Updated S20
supabase/functions/publish-scheduled-posts/        ← S18
```

---

## FILE LINE COUNTS (must stay under 200 before editing)

| File | Lines | Status |
|------|-------|--------|
| Dashboard.tsx | 159 | ✅ |
| DashboardHome.tsx | 152 | ✅ |
| PlanOverviewCard.tsx | 52 | ✅ |
| CRMTab.tsx | 143 | ✅ |
| crm/LeadTable.tsx | 118 | ✅ |
| crm/LeadDetailModal.tsx | 54 | ✅ |
| SEOTab.tsx | 87 | ✅ |
| seo/useSeoAudit.ts | 64 | ✅ |
| seo/useSeoTab.ts | 154 | ✅ |
| SocialTab.tsx | 109 | ✅ |
| ReportsTab.tsx | 198 | ✅ |
| BlogTab.tsx | 186 | ✅ |
| ContentTab.tsx | 138 | ✅ |
| LocationsTab.tsx | 177 | ✅ |
| TestimonialsTab.tsx | 159 | ✅ |
| SettingsTab.tsx | 46 | ✅ |
| settings/* (8 files) | <130 each | ✅ |
| context/PlanContext.tsx | ~68 | ✅ |
| common/FeatureGate.tsx | ~35 | ✅ |
| Footer.tsx | ~130 | ✅ |

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>`. Supports `{ lead_id, tenant_id }` OR `{ tenant_id, email_override, name_override }` |
| `publish-scheduled-posts` | ACTIVE | FB Graph API v19.0 + pg_cron hourly |

**pestflow.ai domain:** Verified in Resend ✅

---

## DESIGN SYSTEM

```
Hero bg:         dark navy #0a0f1e
Primary accent:  emerald #10b981
Yellow CTA:      #f5c518  ← PEST PAGES ONLY — NEVER location pages
Location CTA:    dark navy — NEVER yellow
Admin sidebar:   dark #1a1f2e
Admin content:   light #f1f5f9
Fonts:           Oswald (bold), Raleway (clean), Space Grotesk (modern)
```

---

## RULES (NEVER VIOLATE)

- Routes in App.tsx MUST be BEFORE /:slug catch-all
- Model is ALWAYS claude-sonnet-4-6 — never anything else
- Tenant ID: 9215b06b-3eb5-49a1-a16e-7ff214bf6783
- Single useState object for forms — never per-field state (focus bug)
- VITE_TENANT_ID must be set in .env.local
- Always git push after every task
- Read files before editing them
- NO `@/` path aliases — relative imports only
- Use maybeSingle() not single() for settings queries
- Admin tabs are lazy-loaded with React.lazy() — do not revert to eager imports
- PageHelpBanner on EVERY admin tab — always above FeatureGate, always visible
- Social features VERTICAL-AGNOSTIC — industry from settings, never hardcoded
- RLS audit before assuming data is missing
- Write small files (<200 lines each) — split before editing any file at limit
- Pest pages: YELLOW diagonal CTA | Location pages: DARK NAVY CTA — never swap
- Footer always has "Powered by PestFlow Pro" badge
- HolidayBanner ABOVE Navbar on all public pages
- PRs must be created manually in GitHub — no gh CLI
- Follow the session roadmap exactly — log conflicts in commit messages, do not deviate silently
- Do NOT generate the next session context file — end with a plain summary only

---

## KNOWN ISSUES / TECH DEBT

- Instagram posting: saves as draft (requires Meta Business Account OAuth — not implemented)
- Scheduled post cron fires ✅ but FB publish requires valid FB credentials in integrations
- Notification bell: 60s polling, not realtime
- GSC panel shows connection status only — no live GSC data
- PWA icons are placeholder — need real branded assets before client launch
- Team management tab: not built (Tier 1 gap — S25)
- Demo Mode system: not built — S25

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator
- Customer portal
- Technician calendar
- PDF reports / PDF export
- Self-serve pricing/signup page (product is sold directly by Scott)

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1 | Mar 2026 | Scaffold, 13 tables, auth, admin shell, onboarding wizard |
| 2 | Mar 2026 | Template system, Navbar, Footer, Home, Quote, Contact, SlugRouter, LocationPage, Settings |
| 3 | Mar 2026 | All 12 pest pages, About, FAQ, Reviews, ServiceArea, Blog, StructuredData, ContentTab |
| 4 | Mar 2026 | SEO tab, Testimonials, Leads, Blog CRUD, Locations CRUD, AI keyword research, Integrations, HolidayBanner |
| 5 | Mar 2026 | 4-step quote wizard, lead email, Google Reviews import, Facebook posting, sitemap |
| 6 | Mar 2026 | Domain guide, page content seed, Maps embed, We Also Serve, AI content writer, hero video, PWA, 404 |
| 7 | Mar 2026 | HeroVideo (Pexels), branded 404, PWA manifest, bulk keyword sync |
| 8 | Mar 2026 | Rustic template, Pexels stock images, Ironclad About page, polished onboarding |
| 9 | Mar 2026 | Ironclad rebrand, demo content seed, Pexels hero video, PestFlow Pro footer badge |
| 10 | Mar 2026 | Fix pass: navbar from DB, real dashboard, location pages, help banners, seeded all tables |
| 11 | Mar 2026 | Social Media Command Center: AI captions, Pexels picker, FB publish, post history, scheduling UI, RLS fixes |
| 12 | Apr 2026 | Post templates (vertical-agnostic), AI smart scheduling, SEO tab confirmed, industry field, UX polish |
| 13 | Apr 2026 | Bundle code-splitting: all admin tabs lazy-loaded; main bundle 777KB → 405KB |
| 14 | Apr 2026 | GA4 dynamic injection, Lighthouse score rings, notification bell |
| 15 | Apr 2026 | SEO tab full rebuild: 5-tab dashboard, inline editor, web vitals, Connect tab |
| 16 | Apr 2026 | Social tab rebuild: 3-tab, social_campaigns table + RLS seeded |
| 17 | Apr 2026 | QA pass all social tabs, LegacyComposer split, Leads enhancements, Reports stub |
| 18 | Apr 2026 | Lead funnel chart, UX polish, onboarding industry + idempotent upserts, publish-scheduled-posts edge function |
| 19 | Apr 2026 | QA audit all 7 admin areas, GSCStatusPanel, BlogAnalyticsSection, send-review-request edge function |
| 20 | Apr 2026 | send-review-request deployed (no-reply@pestflow.ai ✅), onboarding split 303→6 sub-components |
| 21 | Apr 2026 | author_email migration + review request button on testimonials, PageHelpBanner audit, footer social wired to DB |
| 22 | Apr 2026 | Dashboard split + onboarding CTA banner, CRMTab split, footer social icons (inline SVG) |
| 23 | Apr 2026 | PlanContext + FeatureGate + PlanProvider in App.tsx, subscription seeded tier 4, BlogTab gated |
| 24 | Apr 2026 | SEOTab split 335→87 lines, SettingsTab split 729→46 lines + PageHelpBanner, SocialTab + ReportsTab confirmed gated, PlanOverviewCard in dashboard, sidebar lock icons verified |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| S25 | Demo Mode system + Team management tab |
| S26 | Lead source breakdown chart (Tier 3 reports) |
| S27+ | Social analytics, Ayrshare, LeadFusion (when Elite client exists) |

---

## BUILD STATUS (end of S24)

- Build: ✅ 0 errors
- Main bundle: 408.61 kB (limit: 450 kB)
- All admin tabs: lazy-loaded with React.lazy() ✅
- All admin tabs: PageHelpBanner present ✅
- All files: under 200 lines ✅
- Tier gating: fully wired through PlanContext + FeatureGate ✅

---

## SESSION 25 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 24 is complete. SEOTab split 335→87 lines. SettingsTab split 729→46 lines.
SocialTab + ReportsTab confirmed gated. PlanOverviewCard live in Dashboard.
Sidebar lock icons verified complete. Build: 408.61 kB, 0 errors.

Session 25 goals — follow this order exactly:
1. Demo Mode system (DemoBanner + seed button + Go Live reset)
2. Team management tab (Tier 1 — name, title, bio, photo URL, CRUD)

Do NOT generate the session 26 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
