# Review — S273 PR #2c (set-password → Next.js public-site app) — 2026-06-18

## PR
#217 — fix: move set-password to Next.js public-site app — `fix/s273-pr2c-set-password-next`

## CI status (run locally; mirrors Validate + build)
- typecheck (`npx tsc --noEmit`): **PASS** (0 errors)
- lint (`eslint .`): **PASS** (0 errors; 1 new warning on the page — the ubiquitous
  `set-state-in-effect`; it's in `app/`, outside the `src` deploy cap)
- `vite build`: **PASS**
- `next build`: **PASS** — `/set-password` registers as a top-level route; middleware compiles
- tests: N/A locally (Deno/pgTAP CI job unaffected — no DB/edge-fn change)

## /qa — local (next start + Host headers, REAL anon key)
| Check | Result |
|-------|--------|
| (a) coastal-pest (standard) `/set-password` renders | **200**, page markup present |
| (b) standalone **dang** `/set-password` resolves (allowlist before standalone 404) | **200** |
| (c) coastal-pest `/pest-control` routes to `[service]` (not set-password, not a routing 404) | **reached `[service]`** (500 only from missing service-role secret — see note) |
| standalone gate intact — dang `/pest-control` | **404** |
| apex `/set-password` (subdomain-only) | **404** |
| (f/N2) `token_hash` in server-rendered HTML | **absent (0)** |
| (f/GA4) `gtag`/`googletagmanager` on the set-password page | **absent (0)** — genuinely not loaded (top-level, no tenant layout) |
| (H2/H3) `Referrer-Policy: no-referrer` + `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` | **present** |

**Note on the `[service]`/homepage 500s:** purely a local-env artifact —
`SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase` (the marketing pages do
server-side ISR fetches; the secret isn't available locally). It is **not** a regression: my change
is exact-match `/set-password` only; everything else falls through unchanged, and `/pest-control`
correctly reached `[service]` (a data-fetch 500, not a routing 404, not the set-password page). The
set-password page renders **200 without any service-role key**, confirming it does **no** server-side
Supabase — cleanly client-only.

**Deferred to production /qa** (needs real minted tokens + an authenticated session): (d) invite
end-to-end → land on the correct tenant login; (e) reset end-to-end; slug-tampered redirect rejected.

## Findings

### CRITICAL / HIGH
- none

### MEDIUM
- **Placement corrected during /qa** (documented): the locked path
  `app/tenant/[slug]/set-password` inherited the tenant marketing layout (`notFound()` + GA4
  token-capture-before-replaceState + navbar/footer chrome). Moved to **top-level
  `app/set-password/page.tsx`**; middleware serves it via `next()`. This is a deviation from the
  validator-locked path — **flagged to the human**, rationale in the spec's "QA CORRECTION" section.
  Still Option A; link URL unchanged.

### LOW
- N1 redirect falls back to **apex** `/admin/login` if the post-verify membership read fails (RLS/
  network) even for a legitimate user — safe (never the unvalidated slug) but slightly worse UX in
  that rare case. Acceptable. `app/set-password/page.tsx`.
- Page uses inline styles (no Tailwind) — intentional, keeps the standalone auth page independent of
  tenant CSS/theme.

## Scope / tenant / secret checks
- Scope: matches the spec file manifest (corrected). Drive-by edits: none.
- N1: redirect host validated against the token-bound user's membership (`get_tenant_boot` +
  `tenant_users` self-read); raw URL slug never interpolated. ✓
- N2: token read client-only; never the server `searchParams` prop; absent from SSR HTML (QA). ✓
- Secrets: anon key from `NEXT_PUBLIC_*`; no service-role; token/link never logged. ✓
- Middleware: allowlist before `STANDALONE_SLUGS` 404; exact-match; security headers set. ✓

## Recommendation
**Ready for manual review + merge**, contingent on the human accepting the QA-driven placement
correction (top-level instead of `[slug]`). CI must go green. No DB/edge-fn change. Production /qa
(c)(d)(e) to be run after merge+deploy.
