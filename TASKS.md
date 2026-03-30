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

## Session 3 — Next Up
- [ ] Pest service pages — start with SpiderControl.tsx as master template
  - Hero + Intro + Treatment Process + Why Choose Us + CTA + FAQ + East Texas CTA sections
  - Read content from page_content table, fall back to hardcoded defaults
- [ ] All 12 pest pages (Mosquito, Spider, Ant, Wasp, Roach, Flea/Tick, Rodent, Scorpion, Bed Bug, Pest Control, Termite, Termite Inspections)
- [ ] Blog listing page (BlogPage.tsx) — reads from blog_posts table
- [ ] Blog post detail page (BlogPostPage.tsx) — dynamic route /blog/:slug
- [ ] Reviews page (ReviewsPage.tsx) — reads from testimonials table, star ratings
- [ ] About page (About.tsx)
- [ ] FAQ page (FAQPage.tsx)
- [ ] Service Area page (ServiceArea.tsx) — links to all live location pages
- [ ] Wire all pest + blog + static routes in App.tsx (before /:slug)
- [ ] ContentTab admin — functional read/write for page_content table
- [ ] Settings: Social Links (functional)
- [ ] Settings: Notifications (functional)
- [ ] StructuredData.tsx — JSON-LD LocalBusiness schema injected on every public page
