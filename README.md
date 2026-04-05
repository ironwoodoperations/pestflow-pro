# PestFlow Pro

White-label SaaS platform for home services businesses (pest control, HVAC, plumbing, roofing).
Each client gets a branded subdomain site, admin dashboard, CRM, blog, SEO tools, and social posting.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Supabase (Postgres + Auth + RLS + Storage)
- Vercel (deployment)
- Stripe (payments)
- Resend (email) · Textbelt (SMS) · Pexels (images)

## Local Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in values
4. `doppler run -- npm run dev` (never `npm run dev` directly — env vars come from Doppler)
5. Open `http://localhost:8080`

Demo admin: `admin@pestflowpro.com` / `pf123demo`

## Environment Variables

See `.env.example`. All secrets are managed via Doppler in production.

## Multi-Tenant Architecture

Each tenant has a unique slug (e.g. `ironclad`). The app reads `window.location.hostname`
on load — if a subdomain is present (e.g. `ironclad.pestflowpro.com`), it queries the
`tenants` table for a matching slug and sets the tenant context. All data is scoped by
`tenant_id` via Supabase RLS policies.

Admin panel: `[slug].pestflowpro.com/admin`
Public site: `[slug].pestflowpro.com`

## Deployment

Vercel watches the `main` branch. Push to main → auto-deploy.
GitHub Actions CI runs typecheck + lint + build on every push before Vercel picks it up.

## Supabase

Project ID: biezzykcgzkrwdgqpsar
Dashboard: https://supabase.com/dashboard/project/biezzykcgzkrwdgqpsar
