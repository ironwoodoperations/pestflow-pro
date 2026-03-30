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

## Session 4 — Next Up
- [ ] SEO meta tags — dynamic <title> and <meta description> per page from seo_meta table
- [ ] SEOTab admin — functional read/write for seo_meta table
- [ ] TestimonialsTab admin — CRUD for testimonials (add, edit, delete, toggle featured)
- [ ] BlogTab admin — CRUD for blog posts (add, edit, publish/unpublish)
- [ ] LocationsTab admin — CRUD for location_data (add, edit, toggle is_live)
- [ ] CRMTab admin — leads table view with search, filter, status updates
- [ ] ReportsTab admin — basic analytics (lead count, page views placeholder)
- [ ] SocialTab admin — social post scheduling UI
- [ ] Image upload to Supabase storage for logos, blog images, team photos
- [ ] Sitemap.xml generation for all public routes
- [ ] robots.txt
- [ ] Performance: code-split pest pages with React.lazy
- [ ] PWA support (manifest.json + service worker)
