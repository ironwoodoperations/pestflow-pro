# PestFlow Pro — Project Context (Session 24 Ready)
_Maintained by Scott / Ironwood Operations Group — do not let Claude Code overwrite this file autonomously_

---

## ⚠️ SESSION RULES
- Stop and generate updated MD file at 50% context window — do not go past this
- Always generate the MD file at the END of every session, no exceptions
- Keep responses short and action-focused
- Always produce a single Claude Code prompt as a downloadable file
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- PRs must be created manually in GitHub — no gh CLI or GitHub MCP available
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  If you encounter a conflict, a broken dependency, or a clearly better technical
  approach, stop and log it as a note in the commit message rather than deviating silently.**

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
business_info   → {name, phone, email, address, hours, tagline, license,
                   certifications, founded_year, num_technicians, industry}
branding        → {logo_url, favicon_url, primary_color, accent_color, template}
hero_media      → {youtube_id, thumbnail_url}
holiday_mode    → {enabled, holiday, auto_schedule}
social_links    → {facebook, instagram, google, youtube, twitter}
integrations    → {google_place_id, facebook_page_id, facebook_access_token,
                   google_analytics_id, pexels_api_key}
onboarding_complete → true | false
subscription    → {tier: 1|2|3|4, plan_name: string, monthly_price: number}
```

**Demo tenant subscription:** tier 4, plan_name "Elite", monthly_price 499 ✅ (seeded S23)

---

## TIER GATING SYSTEM (added S23)

### Architecture
- **PlanContext:** `src/context/PlanContext.tsx` — single DB fetch on mount, shared across all consumers
- **usePlan hook:** exported from PlanContext — `{ tier, planName, monthlyPrice, loading, canAccess, refreshPlan }`
- **canAccess(n):** returns `tier >= n`
- **FeatureGate:** `src/components/common/FeatureGate.tsx` — wraps content, shows lock UI if tier insufficient
- **Re-export:** `src/components/admin/usePlan.ts` — re-exports usePlan for admin components

### Tier Map
| Tier | Plan | Price | Unlocks |
|------|------|-------|---------|
| 1 | Starter | $149 | Dashboard, CRM, Testimonials, Settings, Locations (≤3) |
| 2 | Grow | $249 | SEO suite, Blog, Social scheduling, Standard reports |
| 3 | Pro | $349 | AI keyword research, AI social generation, Advanced reports |
| 4 | Elite | $499 | Social analytics, Ayrshare, LeadFusion reviews, White-glove onboarding |

### FeatureGate usage
```tsx
<FeatureGate tier={2}>        // locks for tier 1
  {/* tab content below PageHelpBanner */}
</FeatureGate>
```

### Sidebar lock icons
- Lock icon (lucide, w-3 h-3) + opacity-60 on nav items where canAccess(requiredTier) is false
- Clicking still navigates — FeatureGate inside the tab handles the actual lock
- ⚠️ STATUS: Sidebar lock icons were in S23 plan but NOT confirmed complete — verify in S24

### Tabs currently gated
- BlogTab: `<FeatureGate tier={2}>` ✅ (S23)
- SEOTab: NOT YET — pending S24 split + gate
- SocialTab: NOT YET — pending S24 gate
- ReportsTab: NOT YET — pending S24 gate

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>`. Supports `{ lead_id, tenant_id }` OR `{ tenant_id, email_override, name_override }` |
| `publish-scheduled-posts` | ACTIVE | FB Graph API v19.0 + pg_cron hourly |

**pestflow.ai domain:** Verified in Resend ✅ (DNS verified Apr 3)

---

## COMPONENT FILE SIZE RULES

All component files must be under 200 lines. Current known oversized files:

| File | Lines | Status |
|------|-------|--------|
| `src/components/admin/SEOTab.tsx` | ~335 | ⚠️ Split in S24 |
| `src/components/admin/SettingsTab.tsx` | ~729 | ⚠️ Split in S24 |
| All others | <200 | ✅ |

---

## KEY FILE PATHS

```
src/context/PlanContext.tsx                    ← NEW S23
src/components/common/FeatureGate.tsx          ← NEW S23
src/components/admin/usePlan.ts                ← re-export shim S23
src/components/admin/dashboard/DashboardHome.tsx ← NEW S22
src/components/admin/crm/                      ← NEW S22 (types, LeadTable, LeadDetailModal)
src/components/admin/onboarding/               ← NEW S20 (6 step sub-components)
src/components/admin/social/                   ← NEW S16 (11 social sub-components)
supabase/functions/send-review-request/        ← Updated S20
supabase/functions/publish-scheduled-posts/    ← S18
```

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
- PageHelpBanner on EVERY admin tab — above FeatureGate, always visible
- Social features VERTICAL-AGNOSTIC — industry from settings, never hardcoded
- RLS audit before assuming data is missing
- Write small files (<200 lines each) — split before editing any file at limit
- Pest pages: YELLOW diagonal CTA | Location pages: DARK NAVY CTA — never swap
- Footer always has "Powered by PestFlow Pro" badge
- HolidayBanner ABOVE Navbar on all public pages
- PRs must be created manually in GitHub — no gh CLI
- Follow the session roadmap exactly — log conflicts in commit messages, do not deviate silently

---

## KNOWN ISSUES / TECH DEBT

- `SettingsTab.tsx` — 729 lines, no PageHelpBanner — split + add banner in S24
- `SEOTab.tsx` — ~335 lines — split in S24 before gating
- Sidebar lock icons — planned S23, not confirmed complete — verify and finish in S24
- SocialTab + ReportsTab not yet gated behind FeatureGate
- Instagram posting: saves as draft (requires Meta Business Account OAuth — not implemented)
- Scheduled post cron fires ✅ but FB publish requires valid FB credentials in integrations
- Notification bell: 60s polling, not realtime
- GSC panel shows connection status only — no live GSC data
- Team management tab: not built (Tier 1 gap — planned S25)
- Demo Mode system: not built — planned S25
- Dashboard plan overview card: not built — planned S24

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
| 5 | Mar 2026 | 4-step quote wizard, lead email, Google Reviews import, Facebook posting, sitemap, Pricing |
| 6 | Mar 2026 | Domain guide, page content seed, Google Maps embed, We Also Serve, AI content writer, hero video, PWA, 404 |
| 7 | Mar 2026 | HeroVideo (Pexels), branded 404, PWA manifest, bulk keyword sync |
| 8 | Mar 2026 | Rustic template, Pexels stock images, Ironclad About page, polished onboarding |
| 9 | Mar 2026 | Ironclad rebrand, demo content seed, Pexels hero video, VideoImage, PestFlow Pro footer badge |
| 10 | Mar 2026 | Fix pass: navbar from DB, real dashboard, location pages, help banners, seeded all tables |
| 11 | Mar 2026 | Social Media Command Center: AI captions, Pexels picker, FB publish, post history, scheduling UI, RLS fixes |
| 12 | Apr 2026 | Post templates (vertical-agnostic), AI smart scheduling, SEO tab confirmed working, industry field, UX polish; CLAUDE.md + SKILL.md v3.0 |
| 13 | Apr 2026 | Bundle code-splitting: all admin tabs lazy-loaded with React.lazy(); main bundle 777KB → 405KB |
| 14 | Apr 2026 | GA4 dynamic injection hook, Lighthouse score rings in SEO tab, notification bell in admin header |
| 15 | Apr 2026 | SEO tab full rebuild: 5-tab dashboard (Overview/Pages/Keywords/AI Optimize/Connect), inline editor, web vitals, Connect tab |
| 16 | Apr 2026 | Social tab rebuild: 3-tab (Campaigns/Content Queue/Analytics), social_campaigns table + RLS seeded |
| 17 | Apr 2026 | QA pass all social tabs, LegacyComposer split 1144→677 lines, Leads enhancements, Reports stub |
| 18 | Apr 2026 | Lead funnel chart, UX polish skeletons/empty states/mobile, onboarding industry + idempotent upserts, publish-scheduled-posts edge function |
| 19 | Apr 2026 | QA audit all 7 admin areas, GSCStatusPanel, BlogAnalyticsSection, send-review-request edge function written |
| 20 | Apr 2026 | send-review-request deployed (no-reply@pestflow.ai ✅), onboarding split 303→6 sub-components, hours+social links+nav fixes, author_email chore note |
| 21 | Apr 2026 | author_email migration + TestimonialsTab split + review request button, PageHelpBanner audit all tabs, footer social links wired to DB |
| 22 | Apr 2026 | Dashboard.tsx split 399→DashboardHome + onboarding CTA banner, CRMTab split 325→crm/ sub-components, footer social icons (inline SVG) |
| 23 | Apr 2026 | PlanContext + usePlan + FeatureGate, PlanProvider in App.tsx, subscription key seeded (tier 4 Elite), BlogTab gated tier 2 |

---

## ROADMAP (sessions 24 onward)

| Session | Focus |
|---------|-------|
| S24 | Split SEOTab + SettingsTab, gate SocialTab + ReportsTab, Dashboard plan overview card, sidebar lock icons (if not done) |
| S25 | Demo Mode system (DemoBanner, seed/reset), Team management tab |
| S26 | Lead source breakdown chart (Tier 3 reports) |
| S27+ | Social analytics, Ayrshare, LeadFusion (when Elite client exists) |

---

## BUILD STATUS (end of S23)

- Build: ✅ 0 errors
- Main bundle: 408.61 kB (limit: 450 kB)
- All admin tabs: lazy-loaded with React.lazy() ✅
- Tier gating: PlanContext + FeatureGate live, BlogTab gated ✅

---

## SESSION 24 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 23 is complete. PlanContext + FeatureGate are live. Demo tenant is tier 4 Elite.
BlogTab is gated at tier 2. Build: 408.61 kB, 0 errors.

Session 24 goals — follow this order exactly:
1. Verify sidebar lock icons (S23 task — confirm done or finish now)
2. Split SEOTab.tsx (~335 lines) into sub-components
3. Split SettingsTab.tsx (~729 lines) into sub-components + add PageHelpBanner
4. Gate SocialTab + ReportsTab behind FeatureGate tier 2
5. Dashboard plan overview card (current tier card + upgrade cards for tiers above)

Generate a downloadable Claude Code prompt for Session 24.
Follow the session roadmap exactly. Do not add unrequested features.
Log any conflicts in commit messages rather than deviating silently.

⚠️ Stop and generate an updated MD file at 50% context window.
```
