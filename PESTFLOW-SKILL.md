# PestFlow Pro — Claude Code Autonomous Dev Skill
## Updated through Session 6

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
- Model: claude-sonnet-4-6 (ALWAYS — never anything else)

---

## SUPABASE
- Project ID: biezzykcgzkrwdgqpsar
- URL: https://biezzykcgzkrwdgqpsar.supabase.co
- Auth: has_role() RPC checks user_roles table (NOT profiles)
- New admin users: insert into BOTH profiles AND user_roles
- exec_sql RPC does NOT exist — use Supabase MCP directly for raw SQL

---

## DATABASE TABLES (13 total)
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

## DESIGN TEMPLATES
`branding.template` values: `bold` | `clean` | `modern`
All page components read via `useTemplate()` hook — never hardcode colors.

| Template | Hero Font  | Hero Bg       | CTA Bg      | Accent    |
|----------|------------|---------------|-------------|-----------|
| bold     | Oswald     | #0a0f1e navy  | emerald-500 | emerald   |
| clean    | serif      | blue-900      | blue-700    | blue      |
| modern   | mono       | gray-950      | teal-500    | teal      |

---

## THEME CONSTANTS (do not change)
- Hero background: `#0a0f1e` (dark navy)
- Primary accent: `#10b981` (emerald)
- East Texas CTA background: `#f5c518` (yellow)
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
2. Set `VITE_TENANT_ID` to the UUID in `.env`
3. `node scripts/create-admin-user.mjs email pass` — creates user + assigns tenant

Custom domain: stored in `tenants.custom_domain`. Tenant lookup checks `custom_domain` first, then `subdomain`.

---

## RULES (NEVER VIOLATE)
1. Routes in App.tsx MUST appear BEFORE `/:slug` catch-all
2. Model is always `claude-sonnet-4-6` — never anything else
3. `has_role()` checks `user_roles` — always insert there for new admins
4. New admin users: insert into BOTH `profiles` AND `user_roles`
5. Tenant ID resolved dynamically — never hardcode beyond `DEMO_TENANT_ID` fallback
6. Template stored in `branding.template`: bold | clean | modern — always read via `useTemplate()`
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
25. `/pricing` route MUST appear before `/:slug` in App.tsx
26. Edge function env vars: `RESEND_API_KEY` — set in Supabase dashboard, never in repo
27. Social posting requires `facebook_page_id` + `facebook_access_token` in `settings.integrations`
28. Google Reviews import requires `VITE_GOOGLE_PLACES_API_KEY` + `google_place_id` in settings
29. `StructuredData` must be added to ALL public pages (pest, static, location, blog) — not just home
30. Location pages: CTA is dark navy — pest pages: CTA is yellow diagonal (`bg-yellow-400`). These are separate templates, never mix.
31. AI content writer uses the same browser Anthropic API pattern — model always `claude-sonnet-4-6`, strip backticks before JSON.parse
32. Hero video player reads `hero_media.youtube_id` from settings — always embed via `youtube-nocookie.com` for privacy
33. `404` page must include `HolidayBanner + Navbar + Footer` — same layout shell as all public pages
34. PWA `manifest.json` lives in `public/` — link in `index.html` with `<link rel="manifest" href="/manifest.json">`
35. Custom domain stored in `tenants.custom_domain` — never store in settings; tenant lookup checks `custom_domain` before `subdomain`

---

## ALL PAGES & ROUTES

### Public Pages
| File | Route | Description |
|------|-------|-------------|
| src/pages/Index.tsx | / | Home (7 sections: hero, features, services, testimonials, CTA, etc.) |
| src/pages/QuotePage.tsx | /quote | 4-step quote wizard → leads table |
| src/pages/ContactPage.tsx | /contact | Contact form page |
| src/pages/About.tsx | /about | Company info page |
| src/pages/FAQPage.tsx | /faq | FAQ page |
| src/pages/ReviewsPage.tsx | /reviews | Testimonials (reads testimonials table) |
| src/pages/ServiceArea.tsx | /service-area | Service area (reads location_data) |
| src/pages/BlogPage.tsx | /blog | Blog listing (reads blog_posts) |
| src/pages/BlogPostPage.tsx | /blog/:slug | Blog post detail |
| src/pages/Pricing.tsx | /pricing | 3-tier pricing + comparison table |
| src/pages/Sitemap.tsx | /sitemap.xml | XML sitemap route |

### Pest Service Pages (12 total — all use PestPageTemplate)
| File | Route |
|------|-------|
| src/pages/SpiderControl.tsx | /spider-control ← MASTER template |
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
| src/pages/admin/Onboarding.tsx | /admin/onboarding | 5-step tenant onboarding wizard |

---

## ALL ADMIN TABS (10 total)

| Tab | File | Status | Description |
|-----|------|--------|-------------|
| Dashboard | (inline in Dashboard.tsx) | ✅ Live | Summary cards |
| Content | src/components/admin/ContentTab.tsx | ✅ Live | Read/write page_content (sidebar + edit panel) |
| SEO | src/components/admin/SEOTab.tsx | ✅ Live | Meta editor + SERP preview + AI keyword research |
| Blog | src/components/admin/BlogTab.tsx | ✅ Live | Full CRUD — title, content, excerpt, slug, publish toggle |
| Social | src/components/admin/SocialTab.tsx | ✅ Live | Post composer + Meta Graph API + schedule + history |
| Testimonials | src/components/admin/TestimonialsTab.tsx | ✅ Live | Full CRUD — stars, featured toggle, source |
| Locations | src/components/admin/LocationsTab.tsx | ✅ Live | Full CRUD — city, slug, hero_title, is_live toggle |
| Reports | src/components/admin/ReportsTab.tsx | 🔲 Stub | Polished placeholder cards — ready for analytics |
| CRM | src/components/admin/CRMTab.tsx | ✅ Live | Leads table — filters, date range, CSV export, detail modal, auto-save status |
| Settings | src/components/admin/settings/SettingsTab.tsx | ✅ Live | 7 sections: Business Info, Branding, Social Links, Notifications, Integrations, Hero Media, Holiday Mode |

---

## ALL SCRIPTS
| Script | Usage | Description |
|--------|-------|-------------|
| scripts/create-admin-user.mjs | `node scripts/create-admin-user.mjs email pass` | Create admin user → inserts profiles + user_roles + seeds default settings |
| scripts/create-demo-tenant.mjs | `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-demo-tenant.mjs` | Seed second demo tenant (Lone Star Pest Control) + settings + location |

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

## KEY FILE PATHS
```
src/lib/supabase.ts               Supabase client
src/lib/tenant.ts                 Tenant resolution (localStorage → env fallback)
src/lib/templates.ts              Template token definitions (bold|clean|modern)
src/hooks/useTenant.ts            Hook: { tenantId, loading }
src/hooks/useTemplate.ts          Hook: { tokens, template, loading }
src/components/ProtectedRoute.tsx Auth guard for admin routes
src/components/Navbar.tsx         Template-aware nav (mobile hamburger + services dropdown)
src/components/Footer.tsx         Template-aware footer (3-column)
src/components/PestPageTemplate.tsx  Shared pest page layout (yellow diagonal CTA)
src/components/StructuredData.tsx    JSON-LD LocalBusiness + WebPage injection
src/components/HolidayBanner.tsx     Holiday hours banner (reads settings)
src/components/admin/             All admin tab components
src/pages/admin/Login.tsx
src/pages/admin/Dashboard.tsx
src/pages/admin/Onboarding.tsx
src/pages/Index.tsx               Public home page (7 sections)
src/pages/QuotePage.tsx           4-step quote wizard → leads table
src/pages/ContactPage.tsx
src/pages/About.tsx
src/pages/FAQPage.tsx
src/pages/ReviewsPage.tsx         Reads testimonials table
src/pages/ServiceArea.tsx         Reads location_data table
src/pages/BlogPage.tsx            Reads blog_posts table
src/pages/BlogPostPage.tsx        /blog/:slug detail
src/pages/Pricing.tsx             3-tier pricing + comparison table
src/pages/Sitemap.tsx             /sitemap.xml route
src/pages/LocationPage.tsx        Dynamic /location/:slug pages
src/pages/SlugRouter.tsx          Catch-all /:slug → LocationPage
src/pages/SpiderControl.tsx       MASTER pest page template
src/pages/[12 pest pages]
src/App.tsx                       All route definitions
public/robots.txt                 Search engine directives
supabase/functions/notify-new-lead/index.ts
scripts/create-admin-user.mjs
scripts/create-demo-tenant.mjs
vercel.json                       Vercel config (SPA rewrite + build settings)
```

---

## SESSION LOG
| Session | Date       | Completions |
|---------|------------|-------------|
| 1 | Mar 2026 | Scaffold repo, Supabase 13-table migration + RLS + storage, Supabase client, auth (Login + ProtectedRoute), admin dashboard shell + tab nav, 5-step onboarding wizard, App.tsx routing, create-admin-user.mjs, demo admin seeded |
| 2 | Mar 2026 | Vercel config (vercel.json), template system (templates.ts + useTemplate hook), Navbar (mobile hamburger), Footer (3-column), Home page (Index.tsx, 7 sections), QuotePage, ContactPage, App.tsx routes, SlugRouter + LocationPage, Settings: Business Info + Branding |
| 3 | Mar 2026 | Theme overhaul (orange → dark navy #0a0f1e + emerald #10b981), SpiderControl.tsx as master pest template, all 12 pest pages, PestPageTemplate.tsx, About/FAQ/Reviews/ServiceArea/Blog/BlogPost pages, StructuredData.tsx, ContentTab, Settings: Social Links + Notifications, Navbar services dropdown, zero TS errors |
| 4 | Mar 2026 | SEO tab + SERP preview + AI keyword research, Testimonials full CRUD, CRM/Leads tab + CSV export + detail modal, Blog full CRUD + publish toggle, Locations full CRUD + is_live toggle, Settings: Integrations + Hero Media, StructuredData on all pages, HolidayBanner + Holiday Mode settings, Reports stub, Social stub |
| 5 | Mar 2026 | 4-step quote wizard rewrite (single useState), lead auto-email (Edge Function + Resend), Google Reviews auto-import (Places API), Facebook social posting (Meta Graph API — live + schedule), sitemap.xml + robots.txt, PageSpeed optimizations (lazy load, preconnects, font preload, code splitting), multi-tenant docs + create-demo-tenant.mjs, Pricing page (3-tier + comparison table) |
| 6 | Mar 2026 | Merged PR #4 (saas branch) — resolved src/index.css conflict (kept font preload comment from PR branch), created PESTFLOW-SKILL.md (full autonomy doc through Session 6) |

---

## SESSION 7 QUEUE
From TASKS.md "Session 6 — Next Up":
- [ ] Client onboarding: custom domain setup guide in admin
- [ ] Real content seeding — pull from Supabase and populate all page_content rows
- [ ] Location pages: Google Maps embed (reads `integrations.google_maps_embed_url` from settings)
- [ ] Location pages: "We Also Serve" section (nearby cities from location_data where is_live=true)
- [ ] Admin: AI content writer — generate pest page copy via Anthropic API (browser pattern)
- [ ] Admin: bulk keyword sync — push tracked keywords to page_content SEO fields
- [ ] Public website: hero video player (reads `hero_media.youtube_id`, embed via youtube-nocookie.com)
- [ ] Mobile PWA manifest + icons (public/manifest.json, linked in index.html)
- [ ] 404 page (custom, branded — HolidayBanner + Navbar + Footer + links back to home)
- [ ] Accessibility audit — aria labels, focus states, contrast check
- [ ] PESTFLOW-SKILL.md + TASKS.md updated
