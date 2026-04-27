# S176.5 — Next.js Tenant Render Path

## Punchline (top of file)
Does pestflow-pro Next.js currently SSR any tenant public content?
**YES** — `app/tenant/[slug]/layout.tsx:39` is a full async React Server Component that fetches tenant data from Supabase and renders shell-specific navbars, footers, JSON-LD, and CSS vars server-side on every subdomain request.

---

## App router inventory
- `app/` exists: **yes**
- `src/app/` exists: **no**
- `pages/` exists: **yes (empty — only a `.gitkeep`)**
- Dynamic tenant routes found:
  - `app/tenant/[slug]/` — tenant home page
  - `app/tenant/[slug]/about/`
  - `app/tenant/[slug]/blog/`
  - `app/tenant/[slug]/blog/[post]/`
  - `app/tenant/[slug]/contact/`
  - `app/tenant/[slug]/faq/`
  - `app/tenant/[slug]/privacy/`
  - `app/tenant/[slug]/quote/`
  - `app/tenant/[slug]/reviews/`
  - `app/tenant/[slug]/service-area/`
  - `app/tenant/[slug]/sms-terms/`
  - `app/tenant/[slug]/terms/`
  - `app/tenant/[slug]/[service]/` — individual service pages

---

## Middleware
- File: `middleware.ts`
- Behavior: Hostname-based subdomain routing. Extracts the subdomain from the `host` header and rewrites requests:
  - Apex (`pestflowpro.com`, `www.pestflowpro.com`) → Vite SPA (`/_admin/index.html`)
  - Any subdomain + `/admin` path → Vite SPA (`/_admin/index.html`)
  - Slug `dang` (not yet migrated) → Vite SPA (`/_admin/index.html`) — **hardcoded at `middleware.ts:51`**
  - All other subdomains, public paths → Next.js App Router via internal rewrite to `/tenant/${slug}${pathname}` (`middleware.ts:57-58`)

---

## Vercel / Next config
- Rewrites: **none** in `vercel.json`; no `rewrites` key in `next.config.js`
- Redirects: `vercel.json` contains 34 trailing-slash → no-slash 301 redirects for Dang's legacy URL patterns (all flat paths like `/about/` → `/about`). These were legacy URLs from Dang's previous site.
- No wildcard subdomain rewrite rules exist in either config file — subdomain routing is handled entirely by `middleware.ts`.

---

## Demo render trace
- Public URL where Demo serves: `pestflow-pro.pestflowpro.com` (slug = `pestflow-pro`, subdomain of `pestflowpro.com`)
- Render path: **Next.js SSR (RSC with ISR)**
- Evidence:
  - `middleware.ts:55-59` — subdomain `pestflow-pro` is not `dang` and not apex, so it rewrites to `/tenant/pestflow-pro/…`
  - `app/tenant/[slug]/layout.tsx:1` — `export const revalidate = 300` (ISR, 5-min TTL)
  - `app/tenant/[slug]/layout.tsx:39-51` — async RSC fetches tenant record + settings + service pages + social links + business info from Supabase server-side
  - `app/tenant/[slug]/page.tsx:63-76` — async RSC fetches page content, testimonials, blog posts, hero media server-side
  - `shared/lib/tenant/resolve.ts:53` — `resolveTenantBySlug` is a React `cache()`-wrapped async function querying the `tenants` + `settings` tables on the server

---

## Tenant-aware metadata
- `generateMetadata` instances tied to tenant data: **3**
  - `app/tenant/[slug]/layout.tsx:27` — sets title, description, favicon from `resolveTenantBySlug`
  - `app/tenant/[slug]/terms/page.tsx:12` — sets title/description from tenant
  - `app/tenant/[slug]/sms-terms/page.tsx:13` — sets title/description from tenant
  - `app/tenant/[slug]/privacy/page.tsx:13` — sets title/description from tenant
  *(note: 4 files contain `generateMetadata`; 3 are page-level, 1 is layout-level)*
- `generateStaticParams` for tenant slugs: **present in 10 page files**, but all currently `return []` — meaning no pages are statically pre-built at deploy time; all renders are on-demand ISR (`revalidate = 300`). Representative: `app/tenant/[slug]/page.tsx:7-9`.

---

## youpest slot status
- Exists in codebase: **no**
- Current behavior: No files, directories, or string references to "youpest" exist anywhere in the codebase (`grep` returned zero results across `.ts`, `.tsx`, and `.json` files).
- Suitable for Dang clone Phase 6: Not applicable — the slot does not exist and would need to be built from scratch if the concept were adopted.

---

## Implications for Phase 3A vs 3B
The middleware already implements the full subdomain → Next.js routing pattern, and the `app/tenant/[slug]/` tree contains SSR-rendered shells for all four themes (modern-pro, bold-local, clean-friendly, rustic-rugged). Dang is explicitly carved out at `middleware.ts:51` with a `slug === 'dang'` guard that sends it to the Vite SPA. This means Phase 3A (migrating Dang to the Next.js path) is not a new architecture build — it is a matter of removing that one guard, verifying Dang's data resolves correctly through `resolveTenantBySlug`, and confirming its theme is among the four already ported shells. Phase 3B (maintaining dual-path indefinitely) carries the risk that the Vite SPA and Next.js shell diverge over time, since bug fixes and feature additions would need to be duplicated. The infrastructure clearly anticipates all tenants moving to the Next.js path.

---

## Implications for Phase 6 session count
- If existing SSR exists → **estimated sessions: 3–5** (current state — architecture is in place, Dang migration is primarily a routing guard removal plus data validation)
- If no SSR exists → estimated sessions: 8–12 (hypothetical — not applicable given findings)
- Recommended next step before Phase 6 kickoff: Run a focused spike — remove the `slug === 'dang'` guard in `middleware.ts`, hit `dang.pestflowpro.com` locally, and confirm the theme resolves and all data queries succeed. This one test will reveal whether Dang's settings data is compatible with `resolveTenantBySlug` or needs a data migration. The spike should take less than one session.

---

## Open questions
- What theme is Dang currently configured with in its `settings` row (`key = 'branding'`, field `theme`)? If it's not one of the four ported shells (`modern-pro`, `bold-local`, `clean-friendly`, `rustic-rugged`), the layout falls through to the "Theme not yet ported" stub at `app/tenant/[slug]/layout.tsx:167`.
- The `vercel.json` redirects all point to flat paths that look like Dang's legacy pages (`/ant-control/`, `/bullard-tx/`, etc.). Do these redirects need to be prefixed for the Next.js path (e.g., redirecting to `/tenant/dang/…`) or do they assume the subdomain context handles routing?
- `generateStaticParams` returns `[]` everywhere — intentional to force on-demand ISR? If tenants grow to dozens, pre-building all slugs at deploy could improve cold-start latency. Worth an explicit decision before Phase 6.
- The `dang` hardcode in middleware is the only tenant-specific business logic in the codebase. Are there other tenants in a similar transitional state that would also need guards?
