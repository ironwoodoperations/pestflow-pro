# S273 PR #2b + #2c (Team Invites · Password Reset · Set-Password) — SHIPPED

**STATUS:** Both waves complete end-to-end — **PR #2b squash-merged as #215**, **PR #2c squash-merged as #217** (the set-password placement fix). DDL applied to the live DB via MCP (ledgered + verified live), both edge functions deployed, frontend auto-deployed on merge. **Full smoke test passed on Dang (live paying, standalone tenant).** Nothing in this wave is left open.

> Read top to bottom; this closes the PR #2 feature wave. Carry-forward items are at the bottom under "Open / pending."

---

## What shipped — PR #2b (merged as #215)

### DDL — migration `s273_pr2b_users_admin` (applied via MCP, ledgered + verified live)
- **`list_tenant_members()`** SECURITY DEFINER — **no tenant arg**; derives `current_tenant_id()` internally; strict `= 'admin'` fail-closed; `SET search_path = public, pg_temp`; returns only `user_id / email / role`; granted to `authenticated` + `service_role`.
- **`tenant_users_block_last_admin`** BEFORE UPDATE OR DELETE trigger — blocks demoting/removing a tenant's **last admin** on **every write path**, including the service-role upsert.

### Edge fn `invite-team-member` (`verify_jwt = TRUE`)
- **Two-client pattern:** anon + caller-`Authorization` client for `getUser()` + fresh `get_my_tenant_role` (strict `=== 'admin'`); a **separate service-role client** for `generateLink` + writes.
- `tenant_id` **server-derived** from `profiles.tenant_id`.
- `generateLink(invite)` + **Resend** (`.ai`, link **never logged**).
- **Global-email collision → add-membership branch** (`magiclink` used only to resolve the existing user id, **never delivered**).
- Upsert dup-tolerant; **re-invite updates role**; last-admin trigger violation surfaces as a clean **409**.

### Edge fn `password-reset-request` (`verify_jwt = FALSE`)
- Unauthenticated by definition.
- **Anti-enumeration:** identical `{status:'ok'}` on every path; **700ms response floor**; errors swallowed; Resend send **detached via `EdgeRuntime.waitUntil`** so send latency can't be timed.
- Tenant slug derived from `Origin`/`Referer` host.

### Client
- **`useTenantRole()`** — single role source. `ProtectedRoute` refactored onto it (no split-brain between Login-admits-any-member and the gate).
- **Admin-only Users tab** in `SettingsTab` `CLIENT_TABS`, gated via `can(role, 'user_mgmt', 'view')` — the `user_mgmt` surface already existed in `permissions.ts`, so **no map delta**.
- Login **"Forgot password?"** entry point.
- **Seats unlimited.**

---

## What shipped — PR #2c (merged as #217) — the set-password placement fix

### Root cause
PR #2b put the set-password route in the **Vite SPA**, but tenant subdomains are served by the **Next.js public-site app** via middleware (normal tenants → `[service]` `notFound()`; standalone tenants → `STANDALONE_TENANT_SLUGS` early-404). **Real invite/reset links 404'd on every tenant.**

### Fix — Option 1 (top-level placement)
`/qa` found that a first attempt at `/tenant/[slug]/set-password` **inherited the tenant marketing layout including GA4** → token-leak-before-`replaceState`. So:
- **set-password lives at top-level `app/set-password`** (root layout only — **no GA4, no `notFound`, no marketing chrome**).
- **Middleware rewrites `/set-password` to the top-level route** via `nextUrl.clone()` (query preserved), placed **after** the `/admin` rewrite and **before** the STANDALONE 404, for **both normal and standalone tenants**.
- **Vite route deleted** (`src/App.tsx` + `SetPassword.tsx`).

### Page (top-level `app/set-password`)
- **Dedicated inline Supabase client** (`detectSessionInUrl:false` + `persistSession:false`, component-scoped, **NOT** `createBrowserSupabase()`).
- `token_hash` + `type` read **client-side via `window.location.search` in `useEffect`** — never the server `searchParams` prop (avoids the SSR log leak).
- `type` validated ∈ `{invite, recovery}` before `verifyOtp`.
- `history.replaceState` **before** `await verifyOtp`.
- `verifyOtp({token_hash, type})` → `updateUser`.
- Success → redirect to the tenant `/admin/login` with the **slug validated against the token's tenant** (N1 open-redirect fix); **no auto-session**.
- `Referrer-Policy: no-referrer` + anti-frame header.
- Fail-graceful expired-link UI.

---

## Validation

Both PRs ran **recon → spec → 3-way validator gate (Perplexity + Gemini + ChatGPT, conservative-wins) → build → `/qa` → `/review`**.

- **#2b gate** caught **two HIGH** (two-client `generateLink`, `persistSession:false`) + **4 MEDIUM**.
- **#2c gate** caught the **open-redirect (N1)** + **SSR-token-leak (N2)** + referrer/frame hardening; **`/qa` caught the GA4-layout-inheritance**, which drove the Option-1 top-level placement.

### VERIFIED LIVE (Dang — standalone, live paying tenant)
Full smoke test end-to-end: **add user → invite email → set password → login → logout → forgot password → set new password → login with new password → full access.** Coastal-pest correctly **403s invites** (demo tenant). Server admin gate confirmed live (non-admin → **Forbidden**).

---

## Durable learnings (carry forward — these bit this session)

1. **"Migration applied via MCP" self-reports are not trustworthy.** CC Web's self-report was **FALSE** this session — `schema_migrations` had no row and the objects didn't exist live. Claude.ai verified via MCP, found them absent, reviewed the SQL, and applied for real. The same pattern bit the "DDL already applied" claim. **Verify the artifact (`schema_migrations` row + live object existence), not the success message.**

2. **MCP-deployed edge fns use FLATTENED `./` import paths in the live bundle** (`./sendEmail.ts`, `./authEmails.ts`) vs `../_shared/` in the repo source — the MCP bundler doesn't pull `_shared` automatically, so all imported files must be passed co-located. A future **CLI** redeploy from repo source uses the repo's `../_shared/` form natively. The divergence is expected, not a bug.

3. **`verify_jwt` reverts ON after any redeploy.** Correct at deploy this session (invite TRUE, reset FALSE, verified live in the function list) — but **re-check both** if either fn is ever redeployed.

4. **Frontend auto-deploys; edge fns do NOT.** The Vite admin app auto-deploys on merge to `main` via Vercel; edge functions need a separate MCP deploy. Any feature that's frontend + edge-fn will show **UI live before the functions** unless the functions go first. This session shipped UI ahead of backend on the #2b merge (low-harm: buttons errored until the fns deployed).

---

## Open / pending (carried to next)

- **Demo-deauth wave** (prereq for a strict binding FK). Remove the shared `admin@demo.com` login → convert demo dashboards to no-session forced-read-only demo mode → delete the `admin@demo.com` seed → upgrade `tenant_role_binding_drift` from an audit view to a hard `profiles`↔`tenant_users` FK (that operator-tenant seed row is the one blocking a strict FK today). Real customer auth + `provision-tenant` are OUT of scope for this wave.
- **Production health monitoring (HIGH)** — the S272 outage lesson: automated uptime/health check so a broken deploy is caught by alerting, not a customer call.
- **Remi warm transfer** — configure VAPI assistant with transfer tool + transferPlan (pure VAPI-dashboard work; voice-intake transfer branch already built).
