# PestFlow Pro — Claude Code Autonomous Dev Skill
## Updated through Session 8

## HOW TO USE
1. Read this file fully before touching any code
2. Read TASKS.md to see what's done and what's next
3. Execute first unchecked [ ] task in the next session queue
4. git add . && git commit -m "..." && git push after each task
5. Mark [x] in TASKS.md and proceed automatically
6. Update this file (PESTFLOW-SKILL.md) at the end of every session

---

## PROJECT IDENTITY
- Product: PestFlow Pro (white-label SaaS for pest control companies)
- GitHub: https://github.com/ironwoodoperations/pestflow-pro
- Stack: React 19 + TypeScript + Vite + Tailwind CSS + Supabase + Vercel
- Demo admin: admin@pestflowpro.com / pf123demo
- Demo Tenant ID: e5d34055-2a35-4e48-8864-d9449cb9da43
- Demo company: Apex Pest Solutions (East Texas)
- Model: claude-sonnet-4-6 (ALWAYS — never anything else)

---

## SUPABASE
- Project ID: biezzykcgzkrwdgqpsar
- URL: https://biezzykcgzkrwdgqpsar.supabase.co
- Auth: has_role() RPC checks user_roles table (NOT profiles)
- New admin users: insert into BOTH profiles AND user_roles
- exec_sql RPC does NOT exist — use Supabase MCP directly for raw SQL

---

## DATABASE TABLES (14 total)
| Table              | Key Fields |
|--------------------|-----------|
| profiles           | user_id, tenant_id, full_name, role, created_at |
| user_roles         | user_id, role |
| tenants            | id, name, subdomain, custom_domain |
| page_content       | tenant_id, page_slug, title, subtitle, intro, video_url |
| seo_meta           | tenant_id, page_slug, meta_title, meta_description, user_edited |
| blog_posts         | tenant_id, title, slug, content, excerpt, published_at |
| location_data      | tenant_id, city, slug, hero_title, is_live, intro_video_url |
| testimonials       | tenant_id, author_name, review_text, rating (1-5), featured, source, google_review_id |
| leads              | tenant_id, name, email, phone, services[], message, status |
| settings           | tenant_id, key, value (JSONB) — unique on (tenant_id, key) |
| keyword_tracker    | tenant_id, keyword, page_slug, volume, difficulty |
| keyword_placements | tenant_id, keyword, page_slug, placement_type, suggested_text, applied |
| page_snapshots     | tenant_id, page_slug, snapshot_type, snapshot_data (JSONB) |
| social_posts       | tenant_id, platform, caption, image_url, status, facebook_post_id, scheduled_for |

---

## SETTINGS KEYS (JSONB stored in settings table)
```
business_info:    { name, phone, email, address, hours, tagline, license }
branding:         { logo_url, favicon_url, primary_color, accent_color, template }
hero_media:       { youtube_id, thumbnail_url }
social_links:     { facebook, instagram, google }
notifications:    { lead_email, cc_email, monthly_report_email }
integrations:     { facebook_access_token, facebook_page_id, google_place_id,
                    google_api_key, google_maps_embed_url }
onboarding_complete: { complete: true | false }
```

---

## DESIGN TEMPLATES (4 options)
`branding.template` values: `bold` | `clean` | `modern` | `rustic`
All page components read via `useTemplate()` hook — never hardcode colors or fonts.

| Template | Hero Font       | Hero Bg        | CTA Bg      | Accent  |
|----------|-----------------|----------------|-------------|---------|
| bold     | Oswald          | #0a0f1e navy   | emerald-500 | emerald |
| clean    | Raleway         | blue-900       | blue-700    | blue    |
| modern   | Space Grotesk   | gray-950       | teal-500    | teal    |
| rustic   | Playfair Display| #1a0f00 brown  | amber-600   | amber   |

### Font Stack (loaded via Google Fonts in index.html)
- **Oswald** (bold template) — strong, clean condensed sans-serif
- **Raleway** (clean template) — elegant, refined sans-serif
- **Space Grotesk** (modern template) — techy geometric sans-serif
- **Playfair Display** (rustic template) — classic editorial serif
- **Inter** — body font for all templates (font-sans)
- **NO Bangers** — removed in Session 8, too cartoonish

### Tailwind Font Classes
```
font-oswald         → Oswald (bold heroFont + headingClass)
font-raleway        → Raleway (clean heroFont + headingClass)
font-space-grotesk  → Space Grotesk (modern heroFont + headingClass)
font-playfair       → Playfair Display (rustic heroFont + headingClass)
```

---

## THEME CONSTANTS (do not change)
- Hero background: `#0a0f1e` (dark navy — bold template default)
- Primary accent: `#10b981` (emerald)
- East Texas CTA background: `#f5c518` (yellow)
- Rustic background: `#1a0f00` (warm brown)
- Admin accent: `hsl(185, 65%, 42%)` (teal)
- Admin bg: `#0f1117`
- Admin card bg: `#1a1d26`
- NO orange anywhere in PestFlow Pro templates

---

## ANTHROPIC API PATTERN (browser direct — no backend)
```ts
const res = await fetch('https://api.anthropic.com/v1/messages', {
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
    messages: [{ role: 'user', content: prompt }]
  })
})
const data = await res.json()
const text = data.content[0].text
// Always strip backtick fences before JSON.parse — AI sometimes wraps output
const json = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
```

---

## ENVIRONMENT VARIABLES
**Frontend (.env.local):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TENANT_ID=           # optional — demo/single-tenant mode
VITE_ANTHROPIC_API_KEY=   # AI features (keyword research, content writer)
VITE_GOOGLE_PLACES_API_KEY=  # Google Reviews auto-import
```
**Edge Function (set in Supabase dashboard — never in .env):**
```
RESEND_API_KEY=
SUPABASE_URL=             # auto-injected by Supabase runtime
SUPABASE_SERVICE_ROLE_KEY=  # auto-injected by Supabase runtime
```

---

## MULTI-TENANCY
Tenant resolution priority (src/lib/tenant.ts):
1. `localStorage.getItem('pf_tenant_id')` — set via `setTenantId()` during onboarding
2. `VITE_TENANT_ID` env var — demo mode / single-tenant Vercel deploy

Every Supabase query filters by `tenant_id`. RLS enforces isolation at DB level.

To provision a new tenant:
1. `node scripts/create-demo-tenant.mjs` — seeds tenants + settings + location_data
2. `TENANT_ID=xxx node scripts/seed-page-content.mjs` — seed default page copy for all 20 pages
3. Set `VITE_TENANT_ID` to the UUID in `.env`
4. `node scripts/create-admin-user.mjs email pass` — creates user + assigns tenant

Custom domain: stored in `tenants.custom_domain`. Tenant lookup checks `custom_domain` first, then `subdomain`.

---

## RULES (NEVER VIOLATE)
1. Routes in App.tsx MUST appear BEFORE `/:slug` catch-all
2. Model is always `claude-sonnet-4-6` — never anything else
3. `has_role()` checks `user_roles` — always insert there for new admins
4. New admin users: insert into BOTH `profiles` AND `user_roles`
5. Tenant ID resolved dynamically — never hardcode beyond `DEMO_TENANT_ID` fallback
6. Template stored in `branding.template`: bold | clean | modern | rustic — always read via `useTemplate()`
7. After every task: `git add . && git commit -m "..." && git push`
8. Read files before editing them
9. Single `useState` object for forms — never per-field state (prevents focus-loss bug)
10. `exec_sql` RPC does NOT exist — use Supabase MCP directly for raw SQL
11. `vercel.json` rewrites rule is required — all routes must return `index.html` for SPA routing
12. `/quote` route MUST appear before `/:slug` in App.tsx — quotes are not a location
13. `/blog/:slug` route MUST appear before `/:slug` in App.tsx
14. `StructuredData` injects JSON-LD via `useEffect` script tag — not Helmet
15. `ContentTab` uses left sidebar (page list) + right panel (edit form) pattern
16. Pest pages: YELLOW diagonal East Texas CTA | Location pages: dark navy CTA — NEVER swap
17. THEME: Hero bg = `#0a0f1e` | Primary = `#10b981` | CTA yellow = `#f5c518` — NO orange
18. `HolidayBanner` goes ABOVE `<Navbar />` on all public pages — add to every new public page
19. AI keyword research: prompt must request JSON-only response, strip backticks before `JSON.parse`
20. Blog slugs are auto-generated from title (kebab-case) — always editable before save
21. CSV export uses browser-side `Blob + URL.createObjectURL` — no backend needed
22. Leads status updates are auto-save on dropdown change — no Save button needed
23. `QuotePage` is a 4-step wizard — single `useState` object, never lose state between steps
24. `/sitemap.xml` route MUST appear before `/:slug` in App.tsx
25. Edge function env vars: `RESEND_API_KEY` — set in Supabase dashboard, never in repo
26. Social posting requires `facebook_page_id` + `facebook_access_token` in `settings.integrations`
27. Google Reviews import requires `VITE_GOOGLE_PLACES_API_KEY` + `google_place_id` in settings
28. `StructuredData` must be added to ALL public pages (pest, static, location, blog) — not just home
29. Location pages: CTA is dark navy — pest pages: CTA is yellow diagonal (`bg-yellow-400`). Never mix.
30. AI content writer uses the same browser Anthropic API pattern — model always `claude-sonnet-4-6`, strip backticks before JSON.parse
31. `NotFound.tsx` is the `*` catch-all — always import in App.tsx, never use inline div
32. PWA icons: replace `public/icons/icon-192.png` + `icon-512.png` with real branded assets before client launch
33. `seed-page-content.mjs` — run once per new tenant: `TENANT_ID=xxx node scripts/seed-page-content.mjs`
34. Hero video: set `youtube_id` in Settings → Hero Media — falls back to gradient if not set. Embed via `youtube-nocookie.com`
35. Location pages fetch `otherLocations` for "We Also Serve" — needs 2+ live locations to render
36. Pricing page route REMOVED in Session 8 — file kept at `src/pages/Pricing.tsx` for future Stripe integration
37. Hero fonts: Oswald (bold), Raleway (clean), Space Grotesk (modern), Playfair Display (rustic) — NO Bangers anywhere
38. `OnboardingLive` is a separate route (`/admin/onboarding-live`) — distraction-free, 22 steps, one field per screen. For screen-share client demos.
39. Pest pages accept optional `introImage` prop (Pexels stock photos) — passed from each pest page component to `PestPageTemplate`
40. `404` page must include `HolidayBanner + Navbar + Footer` — same layout shell as all public pages

---

## ALL PAGES & ROUTES

### Public Pages
| File | Route | Description |
|------|-------|-------------|
| src/pages/Index.tsx | / | Home (7 sections: hero, features, services, testimonials, CTA, etc.) |
| src/pages/QuotePage.tsx | /quote | 4-step quote wizard → leads table |
| src/pages/ContactPage.tsx | /contact | Contact form page |
| src/pages/About.tsx | /about | Apex Pest Solutions — story, team, values, stats |
| src/pages/FAQPage.tsx | /faq | FAQ page |
| src/pages/ReviewsPage.tsx | /reviews | Testimonials (reads testimonials table) |
| src/pages/ServiceArea.tsx | /service-area | Service area (reads location_data) |
| src/pages/BlogPage.tsx | /blog | Blog listing (reads blog_posts) |
| src/pages/BlogPostPage.tsx | /blog/:slug | Blog post detail |
| src/pages/Sitemap.tsx | /sitemap.xml | XML sitemap route |
| src/pages/NotFound.tsx | * | Branded 404 — bug emoji, quick links, full chrome |
| src/pages/Pricing.tsx | (no route) | File kept for future Stripe — route removed Session 8 |

### Pest Service Pages (12 total — all use PestPageTemplate + introImage)
| File | Route |
|------|-------|
| src/pages/SpiderControl.tsx | /spider-control (MASTER template) |
| src/pages/MosquitoControl.tsx | /mosquito-control |
| src/pages/AntControl.tsx | /ant-control |
| src/pages/WaspHornetControl.tsx | /wasp-hornet-control |
| src/pages/RoachControl.tsx | /roach-control |
| src/pages/FleaTickControl.tsx | /flea-tick-control |
| src/pages/RodentControl.tsx | /rodent-control |
| src/pages/ScorpionControl.tsx | /scorpion-control |
| src/pages/BedBugControl.tsx | /bed-bug-control |
| src/pages/PestControlPage.tsx | /pest-control |
| src/pages/TermiteControl.tsx | /termite-control |
| src/pages/TermiteInspections.tsx | /termite-inspections |

### Dynamic Pages
| File | Route | Description |
|------|-------|-------------|
| src/pages/LocationPage.tsx | /location/:slug | Dynamic location pages (reads location_data) |
| src/pages/SlugRouter.tsx | /:slug | Catch-all → LocationPage |

### Admin Pages
| File | Route | Description |
|------|-------|-------------|
| src/pages/admin/Login.tsx | /admin/login | Admin login |
| src/pages/admin/Dashboard.tsx | /admin | Dashboard shell + tab nav |
| src/pages/admin/Onboarding.tsx | /admin/onboarding | 5-step tenant onboarding wizard (polished — step indicators, skip links) |
| src/pages/admin/OnboardingLive.tsx | /admin/onboarding-live | 22-step screen-share mode — one field per screen, distraction-free |

---

## ALL ADMIN TABS (10 total)

| Tab | File | Status | Description |
|-----|------|--------|-------------|
| Dashboard | (inline in Dashboard.tsx) | Live | Summary cards |
| Content | src/components/admin/ContentTab.tsx | Live | Read/write page_content (sidebar + edit panel) + AI content writer |
| SEO | src/components/admin/SEOTab.tsx | Live | Meta editor + SERP preview + AI keyword research + bulk keyword sync |
| Blog | src/components/admin/BlogTab.tsx | Live | Full CRUD — title, content, excerpt, slug, publish toggle |
| Social | src/components/admin/SocialTab.tsx | Live | Post composer + Meta Graph API + schedule + history |
| Testimonials | src/components/admin/TestimonialsTab.tsx | Live | Full CRUD — stars, featured toggle, source |
| Locations | src/components/admin/LocationsTab.tsx | Live | Full CRUD — city, slug, hero_title, is_live toggle |
| Reports | src/components/admin/ReportsTab.tsx | Stub | Polished placeholder cards — ready for analytics |
| CRM | src/components/admin/CRMTab.tsx | Live | Leads table — filters, date range, CSV export, detail modal, auto-save status |
| Settings | src/components/admin/settings/SettingsTab.tsx | Live | 7 sections: Business Info, Branding (4 templates), Social Links, Notifications, Integrations, Hero Media, Holiday Mode |

---

## ALL SCRIPTS (4 total)
| Script | Usage | Description |
|--------|-------|-------------|
| scripts/create-admin-user.mjs | `node scripts/create-admin-user.mjs email pass` | Create admin user → profiles + user_roles + seeds default settings |
| scripts/create-demo-tenant.mjs | `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-demo-tenant.mjs` | Seed demo tenant (Lone Star Pest Control) + settings + location |
| scripts/seed-page-content.mjs | `TENANT_ID=xxx node scripts/seed-page-content.mjs` | Seed default page copy for all 20 pages — run once per new tenant |
| scripts/fetch-pest-images.mjs | `node scripts/fetch-pest-images.mjs` | Download Pexels stock photos for pest pages (intro images) |

---

## ALL SUPABASE MIGRATIONS
| File | Description |
|------|-------------|
| supabase/migrations/20260329_initial_schema.sql | All 13 tables + RLS policies + 3 storage buckets (social-uploads, videos, logos) |

---

## ALL EDGE FUNCTIONS
| Function | Trigger | Description |
|----------|---------|-------------|
| supabase/functions/notify-new-lead/index.ts | Webhook on INSERT into leads | Sends HTML email via Resend API — reads notifications settings for tenant |

---

## KEY COMPONENTS
```
src/components/HeroVideoPlayer.tsx   YouTube embed (youtube-nocookie, reads hero_media settings)
src/components/PestPageTemplate.tsx  Shared pest page layout (yellow diagonal CTA, introImage prop)
src/components/StructuredData.tsx    JSON-LD LocalBusiness + WebPage injection
src/components/HolidayBanner.tsx     Holiday hours banner (reads settings)
src/components/Navbar.tsx            Template-aware nav (mobile hamburger + services dropdown)
src/components/Footer.tsx            Template-aware footer (3-column)
src/components/ProtectedRoute.tsx    Auth guard for admin routes
src/components/admin/                All admin tab components
```

---

## KEY FILE PATHS
```
src/lib/supabase.ts               Supabase client
src/lib/tenant.ts                 Tenant resolution (localStorage → env fallback)
src/lib/templates.ts              Template token definitions (bold|clean|modern|rustic)
src/hooks/useTenant.ts            Hook: { tenantId, loading }
src/hooks/useTemplate.ts          Hook: { tokens, template, loading }
src/App.tsx                       All route definitions
src/pages/admin/Login.tsx
src/pages/admin/Dashboard.tsx
src/pages/admin/Onboarding.tsx    Polished 5-step wizard
src/pages/admin/OnboardingLive.tsx  22-step screen-share mode
src/pages/Index.tsx               Home page (7 sections + HeroVideoPlayer)
src/pages/QuotePage.tsx           4-step quote wizard → leads table
src/pages/ContactPage.tsx
src/pages/About.tsx               Apex Pest Solutions company page
src/pages/FAQPage.tsx
src/pages/ReviewsPage.tsx         Reads testimonials table
src/pages/ServiceArea.tsx         Reads location_data table
src/pages/BlogPage.tsx            Reads blog_posts table
src/pages/BlogPostPage.tsx        /blog/:slug detail
src/pages/Pricing.tsx             File kept — route removed Session 8
src/pages/Sitemap.tsx             /sitemap.xml route
src/pages/NotFound.tsx            Branded 404 page (bug emoji, quick links)
src/pages/LocationPage.tsx        Dynamic /location/:slug pages
src/pages/SlugRouter.tsx          Catch-all /:slug → LocationPage
src/pages/SpiderControl.tsx       MASTER pest page template
src/pages/[12 pest pages]         All with introImage prop (Pexels stock photos)
public/robots.txt                 Search engine directives
public/manifest.json              PWA manifest
public/icons/icon-192.png         PWA icon (placeholder — replace before launch)
public/icons/icon-512.png         PWA icon (placeholder — replace before launch)
supabase/functions/notify-new-lead/index.ts
scripts/create-admin-user.mjs
scripts/create-demo-tenant.mjs
scripts/seed-page-content.mjs
scripts/fetch-pest-images.mjs
vercel.json                       Vercel config (SPA rewrite + build settings)
SKILL.md                          Original skill file (legacy — this file supersedes it)
TASKS.md                          Task queue
PESTFLOW-SKILL.md                 This file — primary autonomy doc
```

---

## SESSION LOG
| Session | Date       | Completions |
|---------|------------|-------------|
| 1 | Mar 2026 | Scaffold repo, Supabase 13-table migration + RLS + storage, Supabase client, auth (Login + ProtectedRoute), admin dashboard shell + tab nav, 5-step onboarding wizard, App.tsx routing, create-admin-user.mjs, demo admin seeded |
| 2 | Mar 2026 | Vercel config (vercel.json), template system (templates.ts + useTemplate hook), Navbar (mobile hamburger), Footer (3-column), Home page (Index.tsx, 7 sections), QuotePage, ContactPage, App.tsx routes, SlugRouter + LocationPage, Settings: Business Info + Branding |
| 3 | Mar 2026 | Theme overhaul (orange -> dark navy #0a0f1e + emerald #10b981), SpiderControl.tsx as master pest template, all 12 pest pages, PestPageTemplate.tsx, About/FAQ/Reviews/ServiceArea/Blog/BlogPost pages, StructuredData.tsx, ContentTab, Settings: Social Links + Notifications, Navbar services dropdown |
| 4 | Mar 2026 | SEO tab + SERP preview + AI keyword research, Testimonials full CRUD, CRM/Leads tab + CSV export + detail modal, Blog full CRUD + publish toggle, Locations full CRUD + is_live toggle, Settings: Integrations + Hero Media, StructuredData on all pages, HolidayBanner + Holiday Mode settings, Reports stub, Social stub |
| 5 | Mar 2026 | 4-step quote wizard (single useState), lead auto-email (Edge Function + Resend), Google Reviews auto-import (Places API), Facebook social posting (Meta Graph API), sitemap.xml + robots.txt, PageSpeed optimizations, multi-tenant docs + create-demo-tenant.mjs, Pricing page |
| 6 | Mar 2026 | Domain setup guide, seed-page-content.mjs, Google Maps embed on location pages, We Also Serve section, AI content writer (ContentTab), hero video player, PWA manifest + apple meta tags, custom 404 page, accessibility audit + fixes (focus rings, sr-only, skip link, aria labels), PESTFLOW-SKILL.md created |
| 7 | Mar 2026 | HeroVideoPlayer component (youtube-nocookie embed), branded 404 page (full chrome — HolidayBanner + Navbar + Footer), PWA manifest + icons, bulk keyword sync (keyword_tracker -> seo_meta in SEOTab) |
| 8 | Mar 2026 | Removed Pricing page route (file kept), rustic template (4th option — warm brown/amber, Playfair Display), Pexels stock image script (fetch-pest-images.mjs) + introImage prop on all 12 pest pages, About Us populated (Apex Pest Solutions — story, team, values, stats), polished onboarding wizard (step indicators, larger inputs, skip links), OnboardingLive screen-share mode (22 steps, one field per screen), font overhaul (Bangers -> Oswald/Raleway/Space Grotesk/Playfair Display) |

---

## SESSION 9 QUEUE
- [ ] Client onboarding: custom domain setup guide in admin
- [ ] Real content seeding — pull from Supabase and populate all page_content rows
- [ ] Location pages: Google Maps embed (reads google_maps_embed_url from settings)
- [ ] Location pages: "We Also Serve" section (nearby cities from location_data)
- [ ] Admin: AI content writer — generate pest page copy via Anthropic API
- [ ] Accessibility audit — aria labels, focus states, contrast check
- [ ] Client handoff mode — read-only "preview" admin view for client demos
- [ ] White-label config — swap logo, company name, colors from onboarding wizard output
- [ ] Email templates — branded HTML emails for lead notifications (logo, colors)
- [ ] Stripe integration — real checkout for SaaS subscriptions (Starter/Pro/Agency)
- [ ] Admin: bulk location import (CSV upload -> creates location_data rows)
- [ ] Public API endpoint — /api/quote for headless quote form embed on external sites
- [ ] Analytics dashboard — page views, lead sources, conversion tracking (no GA, privacy-first)
- [ ] Mobile app scaffold — Capacitor wrapper for iOS/Android
- [ ] PESTFLOW-SKILL.md + TASKS.md updated
