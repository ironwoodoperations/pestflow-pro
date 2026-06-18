# SPEC — S273 PR #2c: move set-password to the Next.js public-site app

**Status:** SPEC (no code). Awaiting **validator gate** before build.
**Bug:** invite/reset links 404 ("Site not found") on every tenant subdomain — the #2b set-password
route was built in the Vite SPA, which middleware never serves at a tenant-subdomain non-`/admin` path.
**Recon:** `INVESTIGATION_s273-pr2c.md` (PR #216) — accepted.
**Fix (locked, Option A):** new Next.js page `app/tenant/[slug]/set-password/page.tsx` + middleware
`/set-password` allowlist **before** the standalone 404 + delete the dead Vite route. **Link URL
unchanged** (`https://<tenant>.pestflowpro.ai/set-password`). **No DB / no edge-fn change.**

All #2b validator-locked page deltas carry forward verbatim — they don't change because the app changed.

---

## VALIDATOR AMENDMENTS — BUILD AUTHORITY (override the prose below where they conflict)

Three-way convergence (Perplexity + Gemini + ChatGPT), conservative-wins. Core fix is sound. Apply ALL.

### N1 (MUST-FIX) — Open-redirect / phishing via the success-redirect slug
The slug is safe for **identity** (`verifyOtp` resolves the user from the token, not the slug) but it is
the post-success **redirect host**. Attack: victim is sent a valid invite link with the subdomain
swapped (`other.pestflowpro.ai/set-password?token_hash=<victim token>`); victim sets their real password
and is then redirected to a host they were lured to. **Never interpolate the raw URL slug into the
redirect URL.** Validate the current subdomain's tenant against the **token-bound user's membership**:
1. After `verifyOtp` + `updateUser`, get the user (`sb.auth.getUser()`).
2. Resolve the current subdomain's tenant id (RLS-safe, anon): `sb.rpc('get_tenant_boot', { slug_param:
   urlSlug })` → `currentTenantId` (null if the slug isn't a real tenant).
3. Read the user's memberships (self-read under RLS): `sb.from('tenant_users').select('tenant_id')
   .eq('user_id', user.id)` → `myTenantIds`.
4. **If `currentTenantId` is non-null AND ∈ `myTenantIds`** → validated → redirect with the **relative**
   path `/admin/login` (same, now-validated host). **Else** → fall back to apex
   `https://pestflowpro.ai/admin/login`. Never build `https://${urlSlug}.…`.
5. If the membership/boot read errors → fail safe to the apex fallback (never the unvalidated slug).

### N2 (MUST-FIX) — SSR token leak
`'use client'` pages still server-render on the initial request. **Read `token_hash` + `type`
EXCLUSIVELY client-side via `window.location.search` inside `useEffect`** — **never** accept the
Next.js server `searchParams` page prop (that routes the token through the Next server → Vercel/APM
request-URL logs). The token must never touch the server render path. (Confirmed clean: root
`app/layout.tsx` has no analytics/APM/`location`-reading script — H5 — so nothing else captures it.)

### Required hardening
- **H1** — validate `type ∈ {'invite','recovery'}` locally **before** `verifyOtp`; require **both**
  `token_hash` AND `type` present. Fail closed (clean error UI) on any other/missing value.
- **H2** — `Referrer-Policy: no-referrer` on this route (token-in-query is referrer bait before
  `replaceState` runs). Set in the **middleware** rewrite response (authoritative).
- **H3** — anti-framing on this route: `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (set in
  the same middleware response).
- **H4** — the inline client is **component-scoped** (constructed in the component), never a
  module-global/singleton; the page tree imports **no** shared browser Supabase client or auth-state
  listener. (Confirmed clean: no `createBrowserSupabase`/`supabase/browser`/`onAuthStateChange` under
  `app/tenant` — H4 grep.)
- **H5** — root layout carries no global script reading `location.href` on init (verified) → nothing to
  exclude.

### Fail-gracefully (build instruction, not a reversal)
`replaceState`-before-`verifyOtp` **stays** (safer order, all three confirm). Because a failed/expired
`verifyOtp` leaves no token in the URL to retry, **capture the error in component state** and render a
clean "this link has expired — request a new one" UI (link to `/admin/login`). Never rely on a URL
reload for retry.

---

## THREE EXPLICIT LOCKS (each a silent-regression risk)

### LOCK 1 — Static-segment precedence (verified property)
In the Next.js App Router, a **static** segment outranks a **dynamic** sibling at the same level. So
`app/tenant/[slug]/set-password/page.tsx` (static `set-password`) **takes priority over**
`app/tenant/[slug]/[service]/page.tsx` (dynamic `[service]`) when the path is `/tenant/<slug>/set-password`.
- The new static route matches **only** the literal `set-password` — it does **not** shadow `[service]`
  for anything else.
- **/qa must prove BOTH directions:** (a) `<tenant>.pestflowpro.ai/set-password` renders the new page;
  (b) a real service slug (e.g. `<tenant>.pestflowpro.ai/mosquito-control` or an existing service-area
  slug) **still** routes through `[service]` and renders normally (no regression to service-area pages).

### LOCK 2 — Middleware diff + order ("before the standalone 404" is load-bearing)
Insert a `/set-password` allowlist in `middleware.ts` **after** the `/admin` Vite rewrite and **before**
the `STANDALONE_SLUGS` 404 branch, converging on the same `/tenant/<slug>/set-password` rewrite the
normal-tenant path already uses. Exact change:

```ts
  // Client admin on any subdomain → Vite SPA
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // S273 PR #2c — set-password (invite + recovery) renders from THIS Next.js app on the tenant
  // subdomain the invite/reset link targets (https://<slug>.pestflowpro.ai/set-password). Allowlisted
  // BEFORE the STANDALONE_SLUGS 404 so standalone tenants (e.g. Dang) resolve it too; converges on the
  // same public-shell rewrite as normal tenants. Exact-match (not startsWith) — the token rides in the
  // query string (?token_hash=…&type=…), which the rewrite preserves.
  if (pathname === '/set-password') {
    const url = req.nextUrl.clone();
    url.pathname = `/tenant/${slug}/set-password`;
    const res = NextResponse.rewrite(url);   // search (?token_hash=…&type=…) preserved by clone
    // S273 PR #2c security headers (H2/H3): token-in-query is referrer bait before replaceState;
    // public subdomain → anti-framing.
    res.headers.set('Referrer-Policy', 'no-referrer');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
    return res;
  }

  // Standalone-repo tenants … (unchanged) — 404s all non-/admin, non-/set-password paths
  if (STANDALONE_SLUGS.has(slug)) {
    return new NextResponse(null, {
      status: 404,
      headers: { 'x-pfp-routing-decision': 'standalone-admin-only-404' },
    });
  }
```
- **Ordering rationale:** placed before `STANDALONE_SLUGS.has(slug)` so the standalone branch can't 404
  it first. For normal tenants this branch and the existing bottom rewrite produce the **same** target,
  so both tenant classes converge on `/tenant/<slug>/set-password`.
- **Exact match** (`=== '/set-password'`), not `startsWith`, to avoid over-matching. The query string
  survives `req.nextUrl.clone()` (only `pathname` is reassigned).
- Apex is **not** touched — invite/reset links are always subdomain-bound (the edge fns build
  `https://${slug}.${APP_BASE_DOMAIN}/set-password`).

### LOCK 3 — Dedicated Next Supabase client (the H2 trap)
The page constructs its **OWN** client inline:
```ts
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { detectSessionInUrl: false, persistSession: false, autoRefreshToken: false } },
)
```
It must **NOT** call `createBrowserSupabase()` (`shared/lib/supabase/browser.ts`) — that factory passes
**no options**, so `detectSessionInUrl`/`persistSession` default **true**, and `verifyOtp` would persist a
session and **auto-log-in the user off the recovery/invite token**. The client is created **inside** the
component (never module-level/exported, never the shared singleton).

---

## The page — `app/tenant/[slug]/set-password/page.tsx`

**`'use client'`.** Reads `slug` via `useParams()` for display only (Next 14.2 — params is a plain
object). Behavior (carried from #2b, amended by N1/N2/H1 above):
1. On mount, inside `useEffect`, read `token_hash` + `type` **from `window.location.search`** (client
   only — **never** the server `searchParams` prop; N2). Then **`history.replaceState({}, '',
   '/set-password')` BEFORE `await verifyOtp`** (strip the bearer token first — correct even if verify
   then fails).
2. **H1 fail-closed:** require BOTH `token_hash` and `type` present, and `type ∈ {'invite','recovery'}`,
   **before** calling `verifyOtp`. Otherwise render the clean error UI (no `verifyOtp` call).
3. `await sb.auth.verifyOtp({ token_hash, type })` — **one page handles BOTH** `invite` and `recovery`.
   On failure → **capture the error in state** and render the friendly terminal UI ("this link has
   expired or was replaced — request a new one", link to `/admin/login`). No URL-reload retry.
4. Password form — **single `useState` object** (CLAUDE.md rule 4); min-length + confirm-match.
5. `await sb.auth.updateUser({ password })` → `await sb.auth.signOut()` → **N1-validated redirect**:
   resolve `currentTenantId` via `sb.rpc('get_tenant_boot', { slug_param: urlSlug })`, read the user's
   `tenant_users.tenant_id` self-rows; if `currentTenantId ∈ myTenantIds` → `location.assign('/admin/
   login')` (relative, validated host); else (or on read error) → `location.assign('https://
   pestflowpro.ai/admin/login')`. **Never** interpolate the raw `urlSlug` into the redirect URL. **No
   auto-session** (`persistSession:false` + explicit `signOut`).
6. The page **MUST NOT call `notFound()`** and must not gate on `resolveTenantBySlug` — it resolves for
   **every** slug, including standalone tenants (Dang). Branding is **optional/cosmetic** (the
   `get_tenant_boot` result already fetched for N1 MAY supply logo/primary color); never block or 404.
7. **H4:** the Supabase client is constructed **inside** the component (not module-global); the page
   imports no shared browser client / auth-state listener.

(It is a client component, so it does not use the server `resolveTenantBySlug`/ISR path the marketing
pages use — that path's `if (!tenant) notFound()` is exactly what we must avoid.)

---

## Vite route removal (confirmed clean — no other importers)
Exactly three locations, verified by grep (`SetPassword` appears only here):
- `src/App.tsx:26` — `const SetPassword = lazy(() => import('./pages/SetPassword'))` → **delete**
- `src/App.tsx:118` — `<Route path="/set-password" … />` (the comment block above it too) → **delete**
- `src/pages/SetPassword.tsx` → **delete the file**

No other module imports `SetPassword`. Removal is clean; the Vite catch-all `*`→`NotFound` is unaffected.

---

## File manifest (for the build, post-validator)
| File | Change |
|------|--------|
| `app/tenant/[slug]/set-password/page.tsx` | **NEW** — `'use client'` page; own client (LOCK 3); verifyOtp invite+recovery; replaceState-before-verify; redirect `/admin/login`; no `notFound()` |
| `middleware.ts` | **EDIT** — `/set-password` allowlist before the standalone 404 (LOCK 2) |
| `src/App.tsx` | **EDIT** — remove lazy import (`:26`) + route (`:118`) |
| `src/pages/SetPassword.tsx` | **DELETE** |

---

## Validator gate — assertions (build authority)
1. Own Next client `detectSessionInUrl:false` AND `persistSession:false`, inline/component-scoped, NOT
   `createBrowserSupabase()` (LOCK 3 / H4).
2. `verifyOtp({token_hash,type})` handles **both** `invite` and `recovery`; **H1** validates type ∈
   {invite,recovery} + both params present **before** the call (fail closed).
3. `token_hash`+`type` read **only** from `window.location.search` in `useEffect`; **never** the server
   `searchParams` prop (N2).
4. `history.replaceState` runs **BEFORE** `await verifyOtp`; verify failure → error-in-state UI (no
   reload retry).
5. **N1:** success redirect validates `currentTenantId` (`get_tenant_boot`) ∈ user's `tenant_users`
   self-rows → relative `/admin/login`; else apex fallback. Raw slug never interpolated. No auto-session.
6. Page never calls `notFound()` → resolves for normal **and** standalone tenants.
7. Middleware `/set-password` allowlist is **before** `STANDALONE_SLUGS` 404, exact-match, converges on
   `/tenant/<slug>/set-password` via `clone()`, and sets **H2** `Referrer-Policy: no-referrer` + **H3**
   `X-Frame-Options: DENY` / CSP `frame-ancestors 'none'` (LOCK 2).
8. Static `set-password` segment outranks `[service]`; matches only the literal path (LOCK 1).
9. Vite route removal is clean at the three confirmed locations; no other importers.

## /qa plan (post-build) — must prove
- (a) `/set-password` renders the new Next page on a **normal** tenant (coastal-pest) **and** a
  **standalone** tenant (dang).
- (b) a real service slug (e.g. `/mosquito-control` or an existing service-area slug) **still** renders
  via `[service]` (no shadowing — LOCK 1).
- (c) **invite** link end-to-end: set password → land on the **correct** tenant login → sign in works.
- (d) **reset** link (`type=recovery`) end-to-end; confirm **not** auto-logged-in before sign-in.
- (e) **slug-tampered redirect (N1):** a token used on a subdomain the user is **not** a member of →
  redirect is **rejected / falls back to apex**, never the tampered host.
- (f) **N2:** `token_hash` does **not** appear in the server-rendered HTML (view-source on first paint)
  or server logs; token stripped from the address bar immediately (replaceState).
- Apex unaffected; `/admin*` on subdomains still hits Vite; Vite `/set-password` no longer exists.

**STOP here. No build until validator passes.**
