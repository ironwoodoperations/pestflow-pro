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
    return NextResponse.rewrite(url);   // search (?token_hash=…&type=…) preserved by clone
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

**`'use client'`.** Reads `slug` via `useParams()` (Next 14.2 — params is a plain object; `useParams()`
is the clean client read). Behavior (all carried from #2b unchanged):
1. On mount, read `token_hash` + `type` from the URL query into JS vars, then
   **`history.replaceState({}, '', '/set-password')` BEFORE `await verifyOtp`** (strip the bearer token
   first — correct even if verify then fails).
2. `await sb.auth.verifyOtp({ token_hash, type })` — **one page handles BOTH** `type: 'invite'` and
   `type: 'recovery'` (read from the query). On failure → friendly terminal state ("link expired or
   superseded; request a new one") with a path back to `/admin/login`.
3. Password form — **single `useState` object** (CLAUDE.md rule 4); min-length + confirm-match.
4. `await sb.auth.updateUser({ password })` → `await sb.auth.signOut()` → redirect to
   **`/admin/login`** (same tenant subdomain; middleware rewrites `/admin` → Vite login). **No
   auto-session** (guaranteed by `persistSession:false` + explicit `signOut`).
5. The page **MUST NOT call `notFound()`** and must not gate on `resolveTenantBySlug` — it resolves for
   **every** slug, including standalone tenants (Dang). Branding is **optional/cosmetic**: render neutral
   PestFlow Pro chrome by default; a best-effort client-side branding read (logo/primary color) MAY
   enhance it but must never block or 404.

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

## Validator gate — assertions to confirm before any build
1. Own Next client `detectSessionInUrl:false` AND `persistSession:false`, inline, NOT
   `createBrowserSupabase()` (LOCK 3).
2. `verifyOtp({token_hash,type})` handles **both** `invite` and `recovery` on one route.
3. `history.replaceState` runs **BEFORE** `await verifyOtp`.
4. Success → redirect to tenant `/admin/login`, **no auto-session** (signOut + persistSession:false).
5. Page never calls `notFound()` → resolves for normal **and** standalone tenants.
6. Middleware `/set-password` allowlist is **before** the `STANDALONE_SLUGS` 404 and converges on
   `/tenant/<slug>/set-password`; exact-match; query preserved (LOCK 2).
7. Static `set-password` segment outranks `[service]`; matches only the literal path (LOCK 1).
8. Vite route removal is clean at the three confirmed locations; no other importers.

## /qa plan (post-build)
- Normal tenant (coastal-pest): real invite link → new page renders → set password → `/admin/login` →
  sign in works. Recovery link (`type=recovery`) → same; confirm **not** auto-logged-in before sign-in.
- **LOCK 1 regression check:** a real service/service-area slug on the same tenant still renders via
  `[service]` (no shadowing).
- Standalone tenant (Dang): invite link resolves (allowlist) → full flow.
- Token stripped from URL immediately; expired/superseded token → friendly terminal message.
- Apex unaffected; `/admin*` on subdomains still hits Vite; Vite `/set-password` no longer exists.

**STOP here. No build until validator passes.**
