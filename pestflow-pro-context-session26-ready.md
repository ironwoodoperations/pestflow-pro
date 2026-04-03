# PestFlow Pro — Project Context (Session 26 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  If you encounter a conflict, a broken dependency, or a clearly better technical
  approach, stop and log it as a note in the commit message rather than deviating silently.**
- Do NOT generate a session 27 context file. End with a plain summary only.

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
| `team_members` | tenant_id, name, title, bio, photo_url, display_order | Team CRUD ✅ S25 |

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
demo_mode           → {active: boolean, seeded_at: string}
```

**Demo tenant subscription:** tier 4, plan_name "Elite", monthly_price 499 ✅

---

## TIER GATING SYSTEM

### Architecture
| File | Purpose |
|------|---------|
| `src/context/PlanContext.tsx` | PlanProvider + usePlan — single DB fetch, shared state |
| `src/components/common/FeatureGate.tsx` | `tier` prop + optional `fallback` — use for all new gates |
| `src/components/admin/usePlan.ts` | Re-exports usePlan from PlanContext |

### Tier map
| Tier | Plan | Price | Unlocks |
|------|------|-------|---------|
| 1 | Starter | $149 | Dashboard, CRM, Testimonials, Settings, Locations (≤3), Team |
| 2 | Grow | $249 | SEO suite, Blog, Social scheduling, Standard reports |
| 3 | Pro | $349 | AI keyword research, AI social generation, Advanced reports |
| 4 | Elite | $499 | Social analytics, Ayrshare, LeadFusion, White-glove onboarding |

### Gated tabs (as of S25)
| Tab | Gate |
|-----|------|
| BlogTab | `<FeatureGate tier={2}>` ✅ |
| SEOTab | `<FeatureGate tier={2}>` ✅ |
| SocialTab | `<FeatureGate minTier={2}>` ✅ |
| ReportsTab | `<FeatureGate minTier={2}>` ✅ |
| TeamTab | No gate (Tier 1) ✅ |

### Sidebar lock icons
- Lock icon + opacity-50 on Blog/SEO/Social/Reports for tier 1 ✅

---

## DEMO MODE SYSTEM (added S25)

| File | Purpose |
|------|---------|
| `src/lib/demoSeed.ts` | `seedDemoData()` + `resetDemoData()` |
| `src/components/admin/DemoBanner.tsx` | Yellow banner across all admin pages |

**Seed data inserted by seedDemoData:**
- 6 leads (prefixed "Demo:") spread across statuses
- 3 blog posts (prefixed "Demo:")
- 4 social posts (prefixed "[Demo]")
- 4 testimonials (prefixed "Demo:")
- Sets `demo_mode = { active: true, seeded_at: ... }` in settings

**Reset:** deletes by name prefix, sets `demo_mode.active = false`

**DemoBanner:** renders site-wide across all admin tabs when `demo_mode.active = true`

---

## KEY FILE PATHS

```
src/context/PlanContext.tsx
src/components/common/FeatureGate.tsx
src/components/admin/usePlan.ts
src/lib/demoSeed.ts                              ← NEW S25
src/components/admin/DemoBanner.tsx              ← NEW S25
src/components/admin/team/
  TeamTab.tsx / TeamMemberCard.tsx / TeamMemberModal.tsx  ← NEW S25
src/components/admin/dashboard/
  DashboardHome.tsx / PlanOverviewCard.tsx
src/components/admin/crm/
  types.ts / LeadTable.tsx / LeadDetailModal.tsx
src/components/admin/seo/
  useSeoAudit.ts / useSeoTab.ts + existing seo/ files
src/components/admin/settings/
  SettingsTab.tsx (46 lines) + 8 section files
src/components/admin/reports/
  LeadFunnel.tsx / SocialSeoReport.tsx / BlogAnalyticsSection.tsx
src/components/admin/social/                     ← 11 sub-components
src/components/admin/onboarding/                 ← 6 step sub-components
supabase/functions/send-review-request/
supabase/functions/publish-scheduled-posts/
```

---

## FILE LINE COUNTS (must stay under 200 before editing)

| File | Lines | Status |
|------|-------|--------|
| Dashboard.tsx | 159 | ✅ |
| DashboardHome.tsx | 152 | ✅ |
| PlanOverviewCard.tsx | 52 | ✅ |
| DemoBanner.tsx | <100 | ✅ |
| CRMTab.tsx | 143 | ✅ |
| SEOTab.tsx | 87 | ✅ |
| SocialTab.tsx | 109 | ✅ |
| ReportsTab.tsx | 198 | ✅ |
| BlogTab.tsx | 186 | ✅ |
| LocationsTab.tsx | 177 | ✅ |
| TestimonialsTab.tsx | 159 | ✅ |
| SettingsTab.tsx | 46 | ✅ |
| team/* (3 files) | <200 each | ✅ |
| settings/* (8 files) | <130 each | ✅ |
| context/PlanContext.tsx | ~68 | ✅ |
| common/FeatureGate.tsx | ~35 | ✅ |

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>` |
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
Chart colors:    orange #E87800 (Tier 1), blue #185FA5 (Tier 2), purple #534AB7 (Tier 3)
```

---

## RULES (NEVER VIOLATE)

- Routes in App.tsx MUST be BEFORE /:slug catch-all
- Model is ALWAYS claude-sonnet-4-6 — never anything else
- Single useState object for forms — never per-field state (focus bug)
- NO `@/` path aliases — relative imports only
- Use maybeSingle() not single() for settings queries
- Admin tabs are lazy-loaded with React.lazy()
- PageHelpBanner on EVERY admin tab — above FeatureGate, always visible
- Social features VERTICAL-AGNOSTIC — industry from settings, never hardcoded
- RLS audit before assuming data is missing
- All files <200 lines — split before editing any file at limit
- Pest pages: YELLOW diagonal CTA | Location pages: DARK NAVY CTA — never swap
- Footer always has "Powered by PestFlow Pro" badge
- HolidayBanner ABOVE Navbar on all public pages
- Working directly on main — no PR needed
- Follow the session roadmap exactly — log conflicts in commit messages
- Do NOT generate a context file — end with a plain summary only

---

## KNOWN ISSUES / TECH DEBT

- Instagram posting: saves as draft (requires Meta Business Account OAuth)
- FB publish requires valid FB credentials in integrations
- Notification bell: 60s polling, not realtime
- GSC panel shows connection status only — no live GSC data
- PWA icons are placeholder — need real branded assets before client launch

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator
- Customer portal
- Technician calendar
- PDF reports / PDF export
- Self-serve pricing/signup page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1–19 | Mar 2026 | Full platform build (see SKILL.md) |
| 20 | Apr 2026 | send-review-request deployed, onboarding wizard split + fixes |
| 21 | Apr 2026 | author_email + testimonial review request button, PageHelpBanner audit, footer social wired |
| 22 | Apr 2026 | Dashboard split + onboarding CTA, CRMTab split, footer social icons |
| 23 | Apr 2026 | PlanContext + FeatureGate + PlanProvider, subscription seeded tier 4, BlogTab gated |
| 24 | Apr 2026 | SEOTab split 335→87, SettingsTab split 729→46 + PageHelpBanner, SocialTab + ReportsTab gated confirmed, PlanOverviewCard, sidebar lock icons verified |
| 25 | Apr 2026 | Demo Mode system (DemoBanner site-wide, seedDemoData, resetDemoData), Team management tab (CRUD, 3 seed members, Tier 1) |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S26** | Lead source breakdown chart (Tier 3 reports) |
| **S27+** | Social analytics, Ayrshare, LeadFusion (when Elite client exists) |

---

## BUILD STATUS (end of S25)

- Build: ✅ 0 errors
- Main bundle: 408.62 kB (limit: 450 kB)
- All admin tabs: lazy-loaded with React.lazy() ✅
- All files: under 200 lines ✅
- Demo Mode: live ✅
- Team tab: live ✅

---

## SESSION 26 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 25 is complete. Demo Mode system is live (DemoBanner, seedDemoData,
resetDemoData). Team management tab is live (CRUD, 3 seed members, Tier 1).
Build: 408.62 kB, 0 errors.

Session 26 goals — follow this order exactly:
1. Lead source breakdown chart in ReportsTab (Tier 3, gated behind FeatureGate tier={3})
2. Social posts volume bar chart in ReportsTab (Tier 3, same gate)

Do NOT generate the session 27 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
