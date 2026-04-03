# PestFlow Pro — Project Context (Session 28 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  If you encounter a conflict or a clearly better approach, log it in the commit
  message rather than deviating silently.**
- Do NOT generate a session 29 context file. End with a plain summary only.

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
| `user_roles` | user_id, role | Auth gating |
| `tenants` | id, name, created_at | Tenant registry |
| `page_content` | tenant_id, page_slug, title, subtitle, intro, video_url | Editable page content |
| `seo_meta` | tenant_id, page_slug, meta_title, meta_description, og_title, og_description, focus_keyword | SEO per page |
| `blog_posts` | tenant_id, title, slug, content, excerpt, published_at, intro_image | Blog |
| `location_data` | tenant_id, city, slug, hero_title, is_live, intro_video_url, maps_embed | Location pages |
| `testimonials` | tenant_id, author_name, author_email, review_text, rating, featured, source | Reviews |
| `leads` | tenant_id, name, email, phone, services, message, status, notes | Quote submissions |
| `settings` | tenant_id, key, value (JSONB) | All business config |
| `keyword_tracker` | tenant_id, keyword, page_slug, volume, difficulty | SEO keywords |
| `social_posts` | tenant_id, platform, caption, image_url, status, scheduled_for, published_at, fb_post_id, error_msg, campaign_id | Social posts |
| `social_campaigns` | tenant_id, title, goal, tone, duration_days, platforms[], start_date, status | Campaigns |
| `team_members` | tenant_id, name, title, bio, photo_url, display_order | Team CRUD |

---

## SETTINGS KEYS (JSONB)

```
business_info       → {name, phone, email, address, hours, tagline, industry, ...}
branding            → {logo_url, favicon_url, primary_color, accent_color, template}
hero_media          → {youtube_id, thumbnail_url}
holiday_mode        → {enabled, holiday, auto_schedule}
social_links        → {facebook, instagram, google, youtube, twitter}
integrations        → {google_place_id, facebook_page_id, facebook_access_token,
                       google_analytics_id, pexels_api_key,
                       textbelt_api_key, owner_sms_number}
onboarding_complete → true | false
subscription        → {tier: 1|2|3|4, plan_name, monthly_price}
demo_mode           → {active: boolean, seeded_at: string}
```

**Demo tenant subscription:** tier 4, plan_name "Elite", monthly_price 499 ✅

---

## TIER GATING SYSTEM

### ⚠️ KNOWN ISSUE — DUAL FeatureGate (fix in S28 Task 1)
There are currently TWO FeatureGate components with different prop APIs:

| File | Prop | Used by |
|------|------|---------|
| `src/components/admin/FeatureGate.tsx` | `minTier` | SEOTab, SocialTab, ReportsTab |
| `src/components/common/FeatureGate.tsx` | `tier` | BlogTab |

These must be consolidated to ONE component in S28.
**Canonical location after S28:** `src/components/common/FeatureGate.tsx`
**Canonical prop after S28:** `minTier` (matches majority of existing usage)

### Architecture (post-S28 consolidation)
| File | Purpose |
|------|---------|
| `src/context/PlanContext.tsx` | PlanProvider + usePlan — single DB fetch |
| `src/components/common/FeatureGate.tsx` | `minTier` prop — ONLY FeatureGate after S28 |
| `src/components/admin/usePlan.ts` | Re-exports usePlan from PlanContext |

### Tier map
| Tier | Plan | Price | Unlocks |
|------|------|-------|---------|
| 1 | Starter | $149 | Dashboard, CRM, Testimonials, Settings, Locations, Team, SMS |
| 2 | Grow | $249 | SEO suite, Blog, Social scheduling, Standard reports |
| 3 | Pro | $349 | AI keyword research, AI social generation, Advanced reports |
| 4 | Elite | $499 | Social analytics, Ayrshare, LeadFusion |

### Gated tabs (current state — pre-S28 consolidation)
| Tab | Gate | Prop used |
|-----|------|-----------|
| BlogTab | common/FeatureGate | `tier={2}` |
| SEOTab | admin/FeatureGate | `minTier={2}` |
| SocialTab | admin/FeatureGate | `minTier={2}` |
| ReportsTab (Tier 2) | admin/FeatureGate | `minTier={2}` |
| ReportsTab (Tier 3) | admin/FeatureGate | `minTier={3}` |

---

## SMS SYSTEM (added S27)

| File | Purpose |
|------|---------|
| `supabase/functions/send-sms/index.ts` | Textbelt API — DEPLOYED ✅ |
| `src/pages/QuotePage.tsx` | TCPA checkbox + SMS trigger |
| `src/pages/ContactPage.tsx` | TCPA checkbox + SMS trigger |
| `src/components/QuoteFormSteps.tsx` | Extracted steps from QuotePage |

**Manual step:** `TEXTBELT_API_KEY` must be set in Supabase Dashboard →
Settings → Edge Functions → Secrets.

**Migration path:** When moving to Twilio, only `send-sms/index.ts` needs
to change. All frontend code, triggers, and settings keys remain the same.

---

## EDGE FUNCTIONS

| Function | Status | Notes |
|---|---|---|
| `notify-new-lead` | ACTIVE | Sends email on new lead via Resend |
| `send-review-request` | ACTIVE (v2) | From: `PestFlow Pro <no-reply@pestflow.ai>` |
| `publish-scheduled-posts` | ACTIVE | FB Graph API v19.0 + pg_cron hourly |
| `send-sms` | ACTIVE | Textbelt — requires TEXTBELT_API_KEY secret |

**pestflow.ai domain:** Verified in Resend ✅

---

## KEY FILE PATHS

```
src/context/PlanContext.tsx
src/components/common/FeatureGate.tsx          ← canonical after S28
src/components/admin/FeatureGate.tsx           ← DELETE in S28
src/components/admin/usePlan.ts
src/components/admin/dashboard/
  DashboardHome.tsx / PlanOverviewCard.tsx
src/components/admin/crm/
  types.ts / LeadTable.tsx / LeadDetailModal.tsx
src/components/admin/reports/
  ReportsStatCards.tsx / LeadSourceChart.tsx /
  SocialVolumeChart.tsx / LeadFunnel.tsx /
  SocialSeoReport.tsx / BlogAnalyticsSection.tsx
src/components/admin/seo/ (7 files)
src/components/admin/settings/ (8 section files)
src/components/admin/social/ (11 files)
src/components/admin/team/
  TeamTab.tsx / TeamMemberCard.tsx / TeamMemberModal.tsx
src/components/admin/onboarding/ (6 step files)
src/components/admin/DemoBanner.tsx
src/lib/demoSeed.ts
src/pages/QuotePage.tsx
src/pages/ContactPage.tsx
src/components/QuoteFormSteps.tsx
supabase/functions/send-sms/
supabase/functions/send-review-request/
supabase/functions/publish-scheduled-posts/
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
Chart colors:    orange #E87800 (Tier 1), blue #185FA5 (Tier 2), purple #534AB7 (Tier 3)
```

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6 — never anything else
- Single useState object for forms — never per-field state (focus bug)
- NO `@/` path aliases — relative imports only
- Use maybeSingle() not single() for settings queries
- Admin tabs are lazy-loaded with React.lazy()
- PageHelpBanner on EVERY admin tab — above FeatureGate, always visible
- All files <200 lines — split before editing any file at limit
- Social features VERTICAL-AGNOSTIC — industry from settings, never hardcoded
- RLS audit before assuming data is missing
- Pest pages: YELLOW diagonal CTA | Location pages: DARK NAVY CTA — never swap
- Footer always has "Powered by PestFlow Pro" badge
- HolidayBanner ABOVE Navbar on all public pages
- Working directly on main — no PR needed
- Follow the session roadmap exactly — log conflicts in commit messages
- Do NOT generate a context file — plain summary only at end

---

## KNOWN ISSUES / TECH DEBT

- Dual FeatureGate components — consolidate in S28 Task 1
- Instagram posting: saves as draft (requires Meta Business Account OAuth)
- FB publish requires valid FB credentials in integrations settings
- Notification bell: 60s polling, not realtime
- GSC panel shows connection status only — no live GSC data
- PWA icons are placeholder — need real branded assets

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
| 1–19 | Mar 2026 | Full platform build |
| 20 | Apr 2026 | send-review-request deployed, onboarding wizard split |
| 21 | Apr 2026 | author_email + review request button, PageHelpBanner audit |
| 22 | Apr 2026 | Dashboard split, CRMTab split, footer social icons |
| 23 | Apr 2026 | PlanContext + FeatureGate + PlanProvider, BlogTab gated |
| 24 | Apr 2026 | SEOTab split, SettingsTab split, all tabs gated, PlanOverviewCard |
| 25 | Apr 2026 | Demo Mode system, Team management tab |
| 26 | Apr 2026 | LeadSourceChart + SocialVolumeChart in ReportsTab (Tier 3) |
| 27 | Apr 2026 | send-sms edge function (Textbelt), TCPA consent on quote + contact forms, SMS triggers, Integrations settings updated, HolidayBanner added to ContactPage |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S28** | FeatureGate consolidation + Elite tier features (social analytics, Ayrshare) |
| **S29** | LeadFusion live Google reviews (Elite) + remaining polish |

---

## BUILD STATUS (end of S27)

- Build: ✅ 0 errors
- Main bundle: 408.41 kB (limit: 450 kB)
- All files under 200 lines ✅
- SMS: live (requires TEXTBELT_API_KEY secret in Supabase) ✅

---

## SESSION 28 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 27 is complete. SMS notifications via Textbelt are live on quote and
contact forms. TCPA consent checkbox added to both. send-sms edge function
deployed. Build: 408.41 kB, 0 errors.

Session 28 goals — follow this order exactly:
1. Consolidate dual FeatureGate into single component at
   src/components/common/FeatureGate.tsx with minTier prop
2. Delete src/components/admin/FeatureGate.tsx
3. Update all import paths across the codebase
4. Begin Elite tier features: social analytics tab in Social

Do NOT generate the session 29 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
```
