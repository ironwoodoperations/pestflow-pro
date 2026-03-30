# PestFlow Pro — Task Queue

## Session 1 (Complete)
- [x] Scaffold repo (Vite + React TS + Tailwind)
- [x] Supabase migrations — all 13 tables + RLS + storage buckets
- [x] Supabase client + tenant resolution
- [x] Auth: login page + ProtectedRoute
- [x] Admin dashboard shell + tab navigation
- [x] Onboarding wizard (5-step)
- [x] App.tsx routing
- [x] Admin user script + demo admin seeded
- [x] SKILL.md + TASKS.md written

## Session 2 (Complete)
- [x] Vercel deployment config (vercel.json + README)
- [x] Template system (templates.ts + useTemplate hook)
- [x] Navbar (template-aware, mobile hamburger)
- [x] Footer (template-aware, 3-column)
- [x] Home page (Index.tsx — all 7 sections)
- [x] Quote form page + Supabase lead submission
- [x] Contact page
- [x] App.tsx routes (public + admin + slug catch-all)
- [x] SlugRouter + LocationPage (dynamic)
- [x] Settings: Business Info (functional)
- [x] Settings: Branding (functional — template selector + color pickers)
- [x] SKILL.md + TASKS.md updated

## Session 3 (Complete)
- [x] Theme overhaul: orange → dark navy #0a0f1e + emerald #10b981 system-wide
- [x] SpiderControl.tsx — master pest page template (PestPageTemplate.tsx)
- [x] All 12 pest pages (Mosquito, Spider, Ant, Wasp, Roach, Flea/Tick, Rodent, Scorpion, Bed Bug, Pest Control, Termite, Termite Inspections)
- [x] About page
- [x] FAQ page
- [x] Reviews page (reads from testimonials table)
- [x] Service Area page (reads from location_data table)
- [x] Blog listing page (reads from blog_posts table)
- [x] Blog post detail page (/blog/:slug)
- [x] All routes wired in App.tsx (pest + static + blog before /:slug)
- [x] StructuredData.tsx — JSON-LD LocalBusiness + WebPage injection
- [x] ContentTab admin — functional read/write for page_content table
- [x] Settings: Social Links (functional)
- [x] Settings: Notifications (functional)
- [x] Navbar: Services dropdown + full link set
- [x] Build passes with zero TypeScript errors
- [x] SKILL.md + TASKS.md updated

## Session 4 (Complete)
- [x] SEO tab — functional meta editor + SERP preview
- [x] Testimonials tab — full CRUD with star selector + featured toggle
- [x] Leads tab — filters + date range + CSV export + detail modal
- [x] Blog tab — full CRUD with post editor + publish toggle
- [x] Locations tab — full CRUD + is_live toggle
- [x] AI keyword research panel (Anthropic API, in SEO tab)
- [x] Settings: Integrations (Google Place ID, Facebook, Maps embed)
- [x] Settings: Hero Media (YouTube embed + live preview)
- [x] StructuredData — added to all pest + static + location pages
- [x] HolidayBanner component + Holiday Mode settings
- [x] Reports tab stub — polished placeholder cards
- [x] Social tab stub — polished placeholder cards
- [x] Build passes with zero TypeScript errors
- [x] SKILL.md + TASKS.md updated

## Session 5 (Complete)
- [x] Quote wizard — 4-step multi-step form (pest → property → contact → review)
- [x] Lead auto-email — Supabase Edge Function + Resend
- [x] Google Reviews auto-import (Places API → testimonials table)
- [x] Social posting — Meta Graph API live (post composer + schedule + history)
- [x] Sitemap.xml + robots.txt
- [x] PageSpeed optimizations (lazy loading, preconnects, font preload, code splitting)
- [x] Multi-tenant isolation docs + demo script (create-demo-tenant.mjs)
- [x] Pricing page (3-tier + comparison table, Stripe stub)
- [x] Build passes with zero TypeScript errors
- [x] SKILL.md + TASKS.md updated

## Session 6 (Complete)
- [x] Custom domain setup guide (Settings → Domain)
- [x] seed-page-content.mjs script (default copy for all 20 pages)
- [x] Location pages: Google Maps embed (reads integrations settings)
- [x] Location pages: We Also Serve nearby cities (2+ threshold)
- [x] Admin: AI content writer (ContentTab, Anthropic API)
- [x] Hero video player (YouTube via hero_media settings)
- [x] PWA manifest + apple meta tags
- [x] Custom 404 page (NotFound.tsx — branded, bug emoji, quick links)
- [x] Accessibility audit + fixes (skip link, aria labels, focus rings, sr-only)
- [x] Merged PR #4 (saas branch) — resolved src/index.css merge conflict (kept font preload comment)
- [x] PESTFLOW-SKILL.md created (full autonomy doc through Session 6, rules 1-35, all pages/tabs/scripts)
- [x] Build passes with zero TypeScript errors
- [x] SKILL.md + TASKS.md updated

## Session 7 (Complete)
- [x] Admin: bulk keyword sync — push keyword_tracker to seo_meta fields (SEOTab Bulk Keyword Sync panel)
- [x] Public website: hero video player (HeroVideoPlayer.tsx — youtube-nocookie background embed)
- [x] 404 page (NotFound.tsx — HolidayBanner + Navbar + Footer + dark navy hero)
- [x] Mobile PWA manifest + icons (manifest.json, placeholder PNGs, apple meta tags)
- [x] PESTFLOW-SKILL.md + TASKS.md updated

## Session 8 (Complete)
- [x] Remove Pricing page route + nav link (file kept for future use)
- [x] Rustic template — 4th design option (warm brown/amber, Playfair Display serif)
- [x] Pexels stock image script (scripts/fetch-pest-images.mjs) + introImage prop on all 12 pest pages
- [x] About Us populated with Apex Pest Solutions demo company (story, team, values, stats)
- [x] Polished onboarding wizard — step indicators, larger inputs, skip links, editable review summary
- [x] OnboardingLive — distraction-free screen-share mode (/admin/onboarding-live, 22 steps, one field per screen)
- [x] TASKS.md + SKILL.md updated

## Session 9 — Next Up
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
- [ ] Admin: bulk location import (CSV upload → creates location_data rows)
- [ ] Public API endpoint — /api/quote for headless quote form embed on external sites
- [ ] Analytics dashboard — page views, lead sources, conversion tracking (no GA, privacy-first)
- [ ] Mobile app scaffold — Capacitor wrapper for iOS/Android
- [ ] SKILL.md + TASKS.md updated
