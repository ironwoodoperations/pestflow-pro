# PestFlow Pro — Claude Code Autonomous Dev Skill
## Session 1+

## HOW TO USE
1. Read this file fully
2. Read TASKS.md
3. Execute first unchecked [ ] task
4. git add . && git commit -m "..." && git push after each task
5. Mark [x] and proceed automatically

## PROJECT IDENTITY
- Product: PestFlow Pro (white-label SaaS for pest control)
- GitHub: https://github.com/ironwoodoperations/pestflow-pro
- Stack: React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel
- Demo admin: admin@pestflowpro.com / pf123demo
- Model: claude-sonnet-4-6 (ALWAYS — never anything else)

## SUPABASE
- Project ID: biezzykcgzkrwdgqpsar
- URL: https://biezzykcgzkrwdgqpsar.supabase.co
- Auth: has_role() RPC checks user_roles table (NOT profiles)
- New admin users: insert into BOTH profiles AND user_roles
- Demo Tenant ID: e5d34055-2a35-4e48-8864-d9449cb9da43

## TABLES
profiles, user_roles, tenants, page_content, seo_meta, blog_posts,
location_data, testimonials, leads, settings, keyword_tracker,
keyword_placements, page_snapshots, social_posts

## SETTINGS KEYS (JSONB in settings table)
- business_info: {name, phone, email, address, hours, tagline, license}
- branding: {logo_url, favicon_url, primary_color, accent_color, template}
- hero_media: {youtube_id, thumbnail_url}
- social_links: {facebook, instagram, google}
- notifications: {lead_email, cc_email, monthly_report_email}
- integrations: {facebook_access_token, facebook_page_id, google_place_id, google_api_key}
- onboarding_complete: {complete: true/false}

## DESIGN TEMPLATES
branding.template values: bold | clean | modern
All page components read this and apply the correct variant.

## ANTHROPIC API PATTERN (browser)
fetch('https://api.anthropic.com/v1/messages', {
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
const text = data.content[0].text

## RULES (NEVER VIOLATE)
1. Routes in App.tsx MUST appear BEFORE /:slug catch-all
2. Model is always claude-sonnet-4-6 — never anything else
3. has_role() checks user_roles — always insert there for new admins
4. New admin users: insert into BOTH profiles AND user_roles
5. Tenant ID resolved dynamically — never hardcode beyond DEMO_TENANT_ID fallback
6. Template stored in branding.template: bold | clean | modern
7. After every task: git add . && git commit -m "..." && git push
8. Read files before editing them
9. Single useState object for forms — never per-field state (prevents focus bug)
10. exec_sql RPC does NOT exist — use Supabase MCP directly for raw SQL

## KEY FILE PATHS
src/lib/supabase.ts
src/lib/tenant.ts
src/hooks/useTenant.ts
src/components/ProtectedRoute.tsx
src/pages/admin/Login.tsx
src/pages/admin/Dashboard.tsx
src/pages/admin/Onboarding.tsx
src/components/admin/ (all tab components)
src/App.tsx
scripts/create-admin-user.mjs
SKILL.md
TASKS.md

## SESSION LOG
| Session | Date     | Completions |
|---------|----------|-------------|
| 1       | Mar 2026 | Scaffold, Supabase migrations, auth, admin shell, onboarding wizard |
