# PestFlow Pro — Claude Code Autonomous Dev Skill
## Version 3.0 | Session 10+
*Updated: March 30, 2026*

---

## HOW TO USE THIS SKILL

At the start of every Claude Code session:
1. Read this file fully
2. Read `TASKS.md` in the project root
3. Pick the first unchecked `[ ]` task
4. Execute it completely
5. Mark it `[x]` in TASKS.md
6. Run `git add . && git commit -m "[task description]" && git push`
7. Report what was done + move to next task unless told to stop

**You are autonomous. Do not ask for permission to proceed with tasks in TASKS.md. Just do them.**

---

## PROJECT IDENTITY

- **Product:** PestFlow Pro (white-label SaaS platform for pest control companies)
- **Owner:** Ironwood Operations Group
- **Demo company:** Ironclad Pest Solutions (fictional — for sales demos only)
- **Demo tagline:** "Pest Control You Can Count On."
- **Live demo URL:** https://pestflow-pro.vercel.app
- **Admin URL:** https://pestflow-pro.vercel.app/admin/login
- **Admin login:** admin@pestflowpro.com / pf123demo
- **GitHub:** https://github.com/ironwoodoperations/pestflow-pro
- **Stack:** React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel

⚠️ IMPORTANT: There is NO "Dang Pest Control" in this repo. That was a separate
project and has been removed. This repo is PestFlow Pro ONLY. The demo company
is Ironclad Pest Solutions. Never reference Dang Pest Control anywhere.

---

## DEV ENVIRONMENT

```bash
npm run dev          # → localhost:8080
git add . && git commit -m "description" && git push
npm install [package]
node scripts/create-admin-user.mjs email@example.com password123
PEXELS_API_KEY=xxx node scripts/fetch-pexels-videos.mjs
```

**Environment variables (.env.local + Vercel):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ANTHROPIC_API_KEY`
- `VITE_PEXELS_API_KEY`
- `VITE_TENANT_ID` (demo tenant fallback)

---

## SUPABASE

- **Project ID:** biezzykcgzkrwdgqpsar
- **URL:** https://biezzykcgzkrwdgqpsar.supabase.co
- **Demo Tenant ID:** `9215b06b-3eb5-49a1-a16e-7ff214bf6783`
- **Auth:** `has_role()` RPC checks `public.user_roles` (NOT profiles)
- **New admin users:** insert into BOTH `profiles` AND `user_roles`

---

## SUPABASE SCHEMA

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `profiles` | id, tenant_id, full_name, role | User profiles |
| `user_roles` | user_id, role | Auth gating — has_role() checks THIS |
| `tenants` | id, name, created_at | Tenant registry |
| `page_content` | tenant_id, page_slug, title, subtitle, intro, video_url | Editable page content |
| `seo_meta` | tenant_id, page_slug, meta_title, meta_description, user_edited | SEO per page |
| `blog_posts` | tenant_id, title, slug, content, excerpt, published_at, intro_image | Blog |
| `location_data` | tenant_id, city, slug, hero_title, is_live, intro_video_url, maps_embed | Location pages |
| `testimonials` | tenant_id, author_name, review_text, rating, featured, source, google_review_id | Reviews |
| `leads` | tenant_id, name, email, phone, services, message, status | Quote submissions |
| `settings` | tenant_id, key, value (JSONB) | All business config |
| `keyword_tracker` | tenant_id, keyword, page_slug, volume, difficulty | SEO keywords |
| `keyword_placements` | tenant_id, keyword, page_slug, placement_type, suggested_text, applied | AI keyword mapping |
| `page_snapshots` | tenant_id, page_slug, snapshot_type, snapshot_data | Revert to original |
| `social_posts` | tenant_id, platform, caption, image_url, status, scheduled_for | Social media posts |

---

## SETTINGS KEYS (JSONB in settings table)

```
business_info    → {name, phone, email, address, hours, tagline, license,
                    certifications, npma_member, tpca_member, founded_year,
                    num_technicians, service_radius, after_hours_phone}
branding         → {logo_url, favicon_url, primary_color, accent_color, template}
hero_media       → {youtube_id, thumbnail_url}
holiday_mode     → {enabled, holiday, auto_schedule}
social_links     → {facebook, instagram, google, youtube, twitter}
notifications    → {lead_email, cc_email, monthly_report_email,
                    notify_google_review, weekly_seo_digest}
integrations     → {facebook_access_token, facebook_page_id,
                    instagram_account_id, google_place_id, google_api_key,
                    google_analytics_id, twitter_api_key, youtube_channel_id}
onboarding_complete → {complete: true}
```

---

## DESIGN TEMPLATES

`branding.template` values: `bold` | `clean` | `modern` | `rustic`
All page components read this via `useTemplate()` hook.

| Template | Vibe | Hero | Accent |
|----------|------|------|--------|
| bold | Aggressive, high-energy | Orange | Yellow #f5c518 |
| clean | Professional, trustworthy | Navy | Blue #1d4ed8 |
| modern | Sleek, dark | Black | Teal #14b8a6 |
| rustic | Warm, established | Warm brown | Amber |

**Template token definitions:** `src/lib/templates.ts`
**Template hook:** `src/hooks/useTemplate.ts`

---

## DEMO COMPANY — IRONCLAD PEST SOLUTIONS

All hardcoded demo defaults should use:
```
Name:          Ironclad Pest Solutions
Phone:         (903) 555-0142
Email:         info@ironclad-pest.com
Address:       1204 S. Main Street, Tyler, TX 75701
Hours:         Mon–Fri 7am–6pm | Sat 8am–2pm
Tagline:       Pest Control You Can Count On.
License:       TPCL #0123456
Founded:       2009
Technicians:   12
Service area:  East Texas & Nationwide
```

---

## ANTHROPIC API PATTERN (browser)

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  }),
})
const data = await response.json()
const text = data.content[0].text
// Always strip backticks before JSON.parse: text.replace(/```json|```/g, '').trim()
```

---

## PEXELS API PATTERN

```typescript
const res = await fetch(
  `https://api.pexels.com/videos/search?query=${query}&per_page=5&orientation=landscape`,
  { headers: { Authorization: import.meta.env.VITE_PEXELS_API_KEY } }
)
// Photo search: https://api.pexels.com/v1/search?query=${query}&per_page=5
```

Video constants: `src/data/pestVideos.ts` (auto-generated by scripts/fetch-pexels-videos.mjs)

---

## KEY FILE PATHS

```
src/
├── App.tsx                                  ← Routes (SPECIFIC routes BEFORE /:slug)
├── data/
│   └── pestVideos.ts                        ← Pexels video URLs (auto-generated)
├── lib/
│   ├── supabase.ts
│   ├── tenant.ts                            ← Tenant resolution
│   └── templates.ts                         ← Template token definitions
├── hooks/
│   ├── useTenant.ts
│   ├── useTemplate.ts                       ← Reads branding.template from Supabase
│   └── useHolidayMode.ts
├── components/
│   ├── Navbar.tsx                           ← Services dropdown, 150ms close delay
│   ├── Footer.tsx                           ← Has "Powered by PestFlow Pro" badge
│   ├── HolidayBanner.tsx                    ← Goes ABOVE Navbar on all public pages
│   ├── HeroVideo.tsx                        ← Muted autoplay Pexels background video
│   ├── VideoImage.tsx                       ← Static poster + play button → Pexels video
│   ├── StructuredData.tsx                   ← JSON-LD injection via useEffect
│   ├── ScrollToTop.tsx                      ← Fires on every route change
│   ├── ProtectedRoute.tsx                   ← Admin auth guard
│   ├── CustomerRoute.tsx                    ← Customer portal auth guard
│   └── admin/
│       ├── ContentTab.tsx                   ← Page content editor (left sidebar + right panel)
│       ├── BlogTab.tsx                      ← Blog CRUD
│       ├── LocationsTab.tsx                 ← Location CRUD + new page creator
│       ├── SEOTab.tsx                       ← SEO + SERP preview + keyword research
│       ├── SocialTab.tsx                    ← AI social media composer (Marky-style)
│       ├── TestimonialsTab.tsx              ← Reviews CRUD + Google import
│       ├── LeadsTab.tsx                     ← Lead management + CSV export
│       ├── ReportsTab.tsx                   ← Analytics + SEO performance
│       ├── KeywordPowerBox.tsx              ← Bulk keyword sync + AI placement
│       ├── PageHelpBanner.tsx               ← Collapsible "How to use" per tab
│       ├── seo/
│       │   ├── KeywordResearch.tsx
│       │   └── AIOTab.tsx
│       └── settings/
│           ├── SettingsBusinessInfo.tsx
│           ├── SettingsBranding.tsx
│           ├── SettingsIntegrations.tsx
│           ├── SettingsNotifications.tsx
│           └── SettingsHeroMedia.tsx
├── pages/
│   ├── Index.tsx                            ← Home page (HeroVideo background)
│   ├── About.tsx                            ← Ironclad Pest Solutions about page
│   ├── ContactPage.tsx
│   ├── QuotePage.tsx                        ← 4-step wizard
│   ├── FAQPage.tsx
│   ├── BlogPage.tsx
│   ├── BlogPostPage.tsx
│   ├── ReviewsPage.tsx
│   ├── ServiceArea.tsx
│   ├── Pricing.tsx                          ← REMOVED in Session 8
│   ├── NotFound.tsx                         ← Branded 404
│   ├── Sitemap.tsx                          ← /sitemap.xml
│   ├── AccessibilityPage.tsx
│   ├── SpiderControl.tsx                    ← MASTER pest page template
│   ├── MosquitoControl.tsx
│   ├── AntControl.tsx
│   ├── WaspHornetControl.tsx
│   ├── RoachControl.tsx
│   ├── FleaTickControl.tsx
│   ├── RodentControl.tsx
│   ├── ScorpionControl.tsx
│   ├── BedBugControl.tsx
│   ├── PestControlPage.tsx
│   ├── TermiteControl.tsx
│   ├── TermiteInspections.tsx
│   ├── SlugRouter.tsx                       ← Routes /:slug to LocationPage
│   ├── LocationPage.tsx                     ← Dynamic location template
│   └── admin/
│       ├── Login.tsx
│       ├── Dashboard.tsx                    ← 10-tab admin shell
│       └── Onboarding.tsx                   ← 5-step guided wizard

scripts/
├── create-admin-user.mjs
├── fetch-pexels-videos.mjs                  ← Regenerates src/data/pestVideos.ts
├── seed-page-content.mjs                    ← Seeds default page copy per tenant
└── create-demo-tenant.mjs

public/
├── banner-img.png                           ← Hero clouds overlay
├── manifest.json                            ← PWA manifest
├── robots.txt
└── icon-192.png / icon-512.png              ← PWA icons

supabase/functions/
├── notify-new-lead/index.ts                 ← Resend email on new quote
└── send-review-request/index.ts             ← Resend review request email

PESTFLOW-SKILL.md                            ← THIS FILE — project brain
TASKS.md                                     ← Autonomous task queue
```

---

## PEST PAGE TEMPLATE (SpiderControl.tsx pattern)

Section order (NEVER deviate):
1. Hero (HeroVideo bg OR orange gradient + halftone + Bangers title + /banner-img.png)
2. Intro (dotted bg, yellow-bordered VideoImage left, text + 2 buttons right)
3. Treatment Process (gray #f1f1ef bg, 2×2 step grid with Pexels intro images)
4. Why Choose Us (white bg, 4 gray cards)
5. [page-specific sections]
6. CTA (text left + dotted bg image right)
7. FAQ (plain list, no accordion)
8. East Texas CTA (YELLOW diagonal clipPath — pest pages ONLY)
9. Footer

---

## LOCATION PAGE TEMPLATE (LocationPage.tsx)

Section order:
1. Hero (orange bg + halftone + Bangers title + /banner-img.png)
2. Intro (VideoImage + text)
3. Services grid (6 cards → pest pages)
4. Why Choose Us (4 gray cards)
5. DARK NAVY CTA (NEVER yellow — that is pest pages only)
6. We Also Serve (other live locations — needs 2+ live locations)
7. Google Maps embed
8. Footer

---

## VIDEOIMAGE COMPONENT

`src/components/VideoImage.tsx`

Props:
- `src` — poster/thumbnail image URL (always shown by default)
- `alt` — alt text
- `videoUrl?` — Pexels MP4 direct URL (if set, shows play button overlay)
- `youtubeId?` — YouTube embed (legacy, still supported)
- `className?`

Behavior:
- Default: shows static image (no play button if no videoUrl)
- With videoUrl: shows pulsing green play button overlay
- On click: replaces image with autoplay video + "✕ Close" button top-right

---

## HERO VIDEO COMPONENT

`src/components/HeroVideo.tsx`

Props: `videoUrl`, `posterUrl?`, `overlayOpacity?` (default 0.65)

- Muted autoplay loop Pexels video as hero background
- Dark overlay (#0a0f1e at overlayOpacity) keeps text readable
- Falls back gracefully to existing gradient if videoUrl is empty
- All hero content needs `position: relative; z-index: 10` to appear above overlay

---

## ADMIN PATTERNS

### PageHelpBanner
Every admin tab has `<PageHelpBanner tab="[tabname]" />` at top.
Collapsible. Written like explaining to a 10-year-old. Covers every field.

### Revert to Original
ContentTab and all editable sections have a "Revert to Original" button.
Saves snapshot to `page_snapshots` table on first edit.
Revert restores from snapshot. Shows confirmation dialog first.

### Toast
Use existing sonner/toast system for all success/error feedback.

### Form pattern
Always use single `useState` object for forms — NEVER per-field state (causes focus bug).

### Supabase query pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false })
```

### Upsert pattern
```typescript
await supabase
  .from('settings')
  .upsert({ tenant_id: tenantId, key: 'branding', value: form },
    { onConflict: 'tenant_id,key' })
```

---

## RULES (NEVER VIOLATE)

1. Routes in App.tsx MUST appear BEFORE `/:slug` catch-all
2. Model is ALWAYS `claude-sonnet-4-6` — never anything else
3. `has_role()` checks `user_roles` — always insert there for new admin users
4. New admin users: insert into BOTH `profiles` AND `user_roles`
5. Tenant ID resolved dynamically — never hardcode beyond DEMO_TENANT_ID fallback
6. Template stored in `settings.branding.template` — always read via `useTemplate()`
7. After every task: `git add . && git commit -m "..." && git push`
8. Read files before editing them
9. Single `useState` object for forms — never per-field state (focus bug)
10. `exec_sql` RPC does NOT exist — use Supabase MCP directly for raw SQL
11. `vercel.json` rewrites rule required — all routes return index.html
12. Location pages use DARK NAVY CTA — NEVER yellow (yellow = pest service pages only)
13. `/quote` route BEFORE `/:slug` in App.tsx
14. `/blog/:slug` route BEFORE `/:slug` in App.tsx
15. `/sitemap.xml` route BEFORE `/:slug` in App.tsx
16. `/portal/login` and `/portal/dashboard` routes BEFORE `/:slug` in App.tsx
17. StructuredData injects JSON-LD via useEffect script tag, not Helmet
18. ContentTab uses left sidebar (page list) + right panel (edit form) pattern
19. Pest pages: YELLOW diagonal East Texas CTA | Location pages: DARK NAVY CTA. NEVER swap.
20. THEME: Hero bg = dark navy #0a0f1e | Primary accent = emerald #10b981 | East Texas CTA = yellow #f5c518
21. HolidayBanner goes ABOVE `<Navbar />` on ALL public pages
22. AI prompts must request JSON-only responses — strip backticks before JSON.parse
23. Blog slugs are auto-generated from title (kebab-case) — always editable before save
24. CSV export uses browser-side Blob + URL.createObjectURL — no backend needed
25. Leads table status updates are auto-save on dropdown change
26. QuotePage is a 4-step wizard — single useState object, never lose state between steps
27. Edge function env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
28. NotFound.tsx is the `*` catch-all — always import in App.tsx
29. Hero video uses HeroVideo.tsx with Pexels MP4 + overlay gradient
30. VideoImage supports `videoUrl` prop (Pexels MP4) + poster — click to play inline
31. PEST_VIDEOS constant in `src/data/pestVideos.ts` — regenerate with fetch-pexels-videos.mjs
32. Footer always has "Powered by PestFlow Pro" badge — never remove
33. ScrollToTop.tsx fires on every route change — must be inside BrowserRouter
34. Demo company is ALWAYS "Ironclad Pest Solutions" — no Dang or Apex references ever
35. Every admin tab must have PageHelpBanner written for a 10-year-old
36. Every editable admin section must have a "Revert to Original" button
37. Template save bug: branding upsert must use onConflict: 'tenant_id,key'

---

## TASK EXECUTION PROTOCOL

```
1. Read TASKS.md
2. Find first [ ] task
3. Read relevant source files before editing
4. Make ONLY the changes for that task
5. Test logic mentally — never break existing functionality
6. git add . && git commit -m "[task name]" && git push
7. Update TASKS.md: [ ] → [x]
8. git add TASKS.md && git commit -m "mark task complete: [name]" && git push
9. Report: "✅ Completed: [task]. Next up: [next task]"
10. Proceed to next task automatically unless user says stop
```

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1 | Mar 2026 | Scaffold, Supabase migrations, auth, admin shell, onboarding wizard |
| 2 | Mar 2026 | Template system, Navbar, Footer, Home page, QuotePage, ContactPage, SlugRouter, LocationPage, Settings |
| 3 | Mar 2026 | All 12 pest pages, About, FAQ, Reviews, ServiceArea, Blog, StructuredData, ContentTab, Notifications, Navbar dropdown |
| 4 | Mar 2026 | SEO tab, Testimonials CRUD, Leads tab, Blog CRUD, Locations CRUD, AI keyword research, Integrations, Hero Media, HolidayBanner |
| 5 | Mar 2026 | 4-step quote wizard, lead email (Resend), Google Reviews import, Facebook posting, sitemap.xml, robots.txt, Pricing page, multi-tenant |
| 6 | Mar 2026 | Domain guide, page content seed script, Google Maps embed, We Also Serve, AI content writer, hero video player, PWA, 404 page, a11y fixes |
| 7 | Mar 2026 | HeroVideo (Pexels background), branded 404, PWA manifest, bulk keyword sync |
| 8 | Mar 2026 | Rustic template, Pexels stock images on all pest pages, Ironclad About page, polished onboarding, OnboardingLive screen-share mode |
| 9 | Mar 2026 | Ironclad Pest Solutions rebrand, demo content seed (6 blogs, 8 reviews, SEO meta), Pexels hero video, VideoImage play button, font fix, Powered by PestFlow Pro footer badge, About page rewrite, location page copy |
| 10 | Mar 2026 | [see TASKS.md] |
