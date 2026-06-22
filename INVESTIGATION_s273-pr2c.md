# INVESTIGATION — S273 PR #2c: set-password page is in the wrong app

**Type:** Production bug — confirmed live. `/investigate` gate before any fix.
**Reported:** Real invite/reset links 404 ("Site not found") on every tenant subdomain.
**Predecessor:** PR #2b (#215, `f520122`) shipped the backend + a set-password page **in the Vite SPA**.
**Fix direction (locked, not re-litigated):** Option A — build `/set-password` as a **Next.js** route in the
public-site app so `<tenant>.pestflowpro.ai/set-password` resolves on the subdomain the link already
targets; the link URL does not change; remove the dead Vite SPA route.

No code written. Findings only.

---

## Symptoms
- Clicking a real invite link `https://<tenant>.pestflowpro.ai/set-password?token_hash=…&type=invite`
  renders **"Site not found"** (Next.js `app/tenant/[slug]/not-found.tsx`).
- Confirmed live on **coastal-pest** (normal tenant) and **dang** (standalone tenant).
- Backend is correct and deployed: `invite-team-member` (verify_jwt=true) + `password-reset-request`
  (verify_jwt=false) ACTIVE; Resend sends; tokens mint. **Only the landing page is in the wrong app.**

## Root cause — CONFIRMED (two distinct 404 mechanisms, same symptom)

The set-password route was built in the **Vite SPA** (`src/App.tsx`). But `middleware.ts` only ever
serves the Vite SPA at a tenant subdomain for `/admin*` (rewrite to `/_admin/index.html`,
`middleware.ts:153-155`). Every other subdomain path is handled by Next.js. So a real invite link never
reaches the Vite route. What happens instead:

1. **Normal tenants (coastal-pest):** middleware falls through to the public-shell rewrite
   `url.pathname = /tenant/${slug}${suffix}` (`middleware.ts:170-173`) → `/tenant/coastal-pest/set-password`.
   No static `set-password` segment exists under `app/tenant/[slug]/`, so the **`[service]` dynamic
   segment** catches it (`app/tenant/[slug]/[service]/page.tsx`, `service="set-password"`). `set-password`
   is not in `SERVICE_SLUGS`, so it's treated as a service-area lookup: `getLocation(tenant.id,
   "set-password")` → null → **`notFound()`** (`[service]/page.tsx:39`) → `not-found.tsx` "Site not found".

2. **Standalone tenants (dang):** middleware returns **404 earlier** — the `STANDALONE_SLUGS` branch
   (`middleware.ts:162-167`) 404s every non-`/admin` path (`x-pfp-routing-decision:
   standalone-admin-only-404`) so this app never renders a duplicate public site for separate-Vercel
   tenants. `/set-password` is non-`/admin` → 404 before any rewrite.

Reproducible chain, falsifiable: add a static `app/tenant/[slug]/set-password/page.tsx` and (1) resolves
(static segment outranks `[service]`); add a `/set-password` middleware allowlist before the standalone
404 and (2) resolves.

---

## Investigation findings (the six asks)

### 1. Next.js public-site structure + middleware mapping
- Tenant pages live under **`app/tenant/[slug]/…`** (App Router). Existing route segments:
  `/` (page.tsx), `about`, `accessibility`, `blog`, `blog/[post]`, `contact`, `faq`, `privacy`, `quote`,
  `reviews`, `service-area`, `sms-terms`, `terms`, and the **`[service]` dynamic segment** (catch-any
  single segment). `not-found.tsx` renders "Site not found".
- `middleware.ts` flow (matcher excludes `_next`, `_admin`, `_tenant`, `api`, dotted files):
  - `extractSubdomain(host)` → `slug` (apex hosts / `www` → null).
  - **Apex (no slug):** static assets rewrite to `/_admin/index.html`; a fixed allowlist (`/`, `/admin*`,
    `/ironwood*`, `/payment-success`, `/intake/*`, `/intake-success`, `/demos*`, `/terms`, `/privacy`)
    rewrites to the Vite SPA; **everything else 404s**.
  - **Subdomain:** per-tenant redirects → `/admin*` rewrites to Vite SPA → `STANDALONE_SLUGS` 404 →
    else rewrite to `/tenant/${slug}${suffix}` (the public shell). The "Site not found" fallback is the
    App Router `not-found.tsx` reached via `notFound()` in the matched page.

### 2. Where a new utility route lives + precedent
- Correct home: **`app/tenant/[slug]/set-password/page.tsx`** (a real static segment). In App Router a
  static segment **outranks** the sibling `[service]` dynamic segment, so it captures `/set-password`
  before the service-area 404 path — for normal tenants this needs **no middleware change**.
- Precedent for interactive (client) routes on tenant subdomains: `quote/` and `contact/` are server
  pages embedding **`'use client'`** form components (`_components/forms/QuoteForm.tsx`,
  `ContactForm.tsx`). There is **no** fully client utility page (no unsubscribe/callback precedent) — the
  set-password page is a new shape: a `'use client'` page that must **NOT** gate on tenant existence
  (no `resolveTenantBySlug`/`notFound()`), so it resolves for every slug incl. standalone.

### 3. Dang / standalone special-case + allowlist
- **Not a hardcoded `slug==='dang'`.** It's the env-driven set `STANDALONE_TENANT_SLUGS`
  (`middleware.ts:28-33`) → `STANDALONE_SLUGS`; the branch at `middleware.ts:162-167` 404s all non-
  `/admin` paths for those slugs. Dang is a member (set in Vercel prod env).
- **Fix point:** add a `/set-password` allowlist **before** the `STANDALONE_SLUGS` check that rewrites to
  `/tenant/${slug}/set-password` (so the Next page renders for standalone tenants too). For normal
  tenants the existing bottom rewrite already covers it, but placing the explicit allowlist above the
  standalone branch covers BOTH and is order-safe. Dang (live paying tenant) then resolves invites/resets.

### 4. Next.js Supabase client
- Public site uses **`NEXT_PUBLIC_SUPABASE_*`** (S272). Shared factory:
  `shared/lib/supabase/browser.ts` → `createBrowserSupabase()` calls `createClient(url, anon)` **with NO
  options** (so `detectSessionInUrl` and `persistSession` default **true**). `server.ts` is the ISR/server
  client.
- → The set-password page **needs its OWN client** with **`detectSessionInUrl:false` AND
  `persistSession:false`** (validator H2). The shared factory can't be reused — same conclusion as the
  Vite case. (Without `persistSession:false`, `verifyOtp` writes a session to storage → silent auto-login
  off the recovery token.)

### 5. Vite SPA route removal is clean
- Only **two** references to the component, both in the Vite app: `src/App.tsx:26` (lazy import) +
  `src/App.tsx:118` (`<Route path="/set-password">`, declared right before the `*` catch-all at line 115…
  i.e. before `NotFound`). Plus the file `src/pages/SetPassword.tsx` itself. **Nothing else imports it.**
  Removal = delete both App.tsx lines + delete `src/pages/SetPassword.tsx`. Clean, no other consumers.

### 6. `verifyOtp({token_hash, type})` in Next context
- Both apps depend on the **same** `@supabase/supabase-js@^2.100.1`. `verifyOtp` is library-level and
  app-agnostic → behaves **identically** in the Next client. It handles **both** `type:'invite'` (invite
  links) and `type:'recovery'` (reset links); one page reads `type` from the query and passes it through.

---

## Proposed fix (scoped, Option A)
1. **NEW** `app/tenant/[slug]/set-password/page.tsx` — `'use client'`; own client `createClient(url, anon,
   { auth: { detectSessionInUrl:false, persistSession:false, autoRefreshToken:false } })`; read
   `token_hash`+`type` from the URL, **`history.replaceState` BEFORE `await verifyOtp`**;
   `verifyOtp({token_hash, type})` (invite+recovery) → `updateUser({password})` → `signOut` → redirect to
   `/admin/login` (tenant subdomain; **no auto-session**). Does **not** call `notFound()` (resolves for all
   slugs incl. standalone). Single `useState` object for the form.
2. **`middleware.ts`** — add a `/set-password` allowlist that rewrites to `/tenant/${slug}/set-password`
   **before** the `STANDALONE_SLUGS` 404 branch (so dang + other standalone tenants resolve). Normal
   tenants already route via the static segment.
3. **REMOVE** the Vite route: delete `src/App.tsx:26` + `:118` and `src/pages/SetPassword.tsx`.
4. Link URL unchanged (`https://<slug>.pestflowpro.ai/set-password`); backend untouched.

## Risk assessment — LOW
- Static `set-password` segment shadows `[service]` for exactly that path only (no tenant has a
  service-area slug `set-password`). Middleware change is one additive allowlist branch (purely positive
  match; misses fall through unchanged). Vite removal has no other consumers. No DB/schema/edge-fn change.

## Test plan
- coastal-pest invite link → Next page renders → set password → redirect `/admin/login` → login works.
- dang invite link → resolves (allowlist) → same flow.
- recovery link (`type=recovery`) → resolves; after set, **not** auto-logged-in (persistSession:false) →
  must sign in.
- token stripped from URL immediately (replaceState before verify); expired/superseded token → friendly
  terminal message.
- apex unaffected; `/admin*` on subdomains still hits Vite; `/set-password` no longer exists in Vite.

## Rollback plan
- Revert the PR. Links return to the current (already broken) 404 state — no data risk, no schema change.

---

**Next:** spec → validator gate (own Next client `detectSessionInUrl:false`+`persistSession:false` /
verifyOtp both types / `replaceState` before await / redirect to tenant `/admin/login` no auto-session /
Dang allowlist correctness / Vite route removal clean) → /qa → /review → STOP. Branch + PR, manual merge.
