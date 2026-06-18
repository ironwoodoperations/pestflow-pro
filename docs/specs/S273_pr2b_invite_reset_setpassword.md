# SPEC — S273 PR #2b: invite-team-member + password-reset + set-password + Users tab

**Status:** SPEC (no code). Awaiting **validator gate** before build.
**Predecessor:** PR #2a permission foundation — CLOSED, on main (PR #212, `9562029`).
**Recon:** `INVESTIGATION_s273-pr2b.md` (PR #214).
**Locked design source:** `docs/handoffs/pestflow-pro-handoff-S273-pr2a-CLOSED.md` §"PR #2b — LOCKED DESIGN".

Seats UNLIMITED (per-tech/per-location billing lives in the separate Platform repo). All
validator-locked deltas from the pr2a-CLOSED doc are carried verbatim and called out inline.

---

## 0. RESOLVED: the role-source gap (the recon's one open item)

**Problem the recon proved:** the locked design assumed "Settings is admin-gated." It is NOT.
`Dashboard.tsx` (L131-150) gates the `TABS` nav by **TIER only** (`gatedTabs = {blog:2, seo:2,
social:2, analytics:2}`). There is no role gate on Settings — a customer-tenant **manager/user
can open Settings today**. And `SettingsTab` has no role in scope (only `useTenant()`).

**How `ProtectedRoute` resolves role today (dumped):** a **direct Supabase query**, then it
**discards** the role after computing a boolean:
```ts
// src/components/ProtectedRoute.tsx
const { data } = await supabase
  .from('tenant_users').select('role')
  .eq('tenant_id', tenantId).eq('user_id', session.user.id).maybeSingle()
setAuthed(isValidRole(data?.role))   // role thrown away
```
It does **NOT** call `get_my_tenant_role` RPC, does **NOT** read a store, does **NOT** decode a
JWT. `src/lib/permissions.ts` already declares `settings: { view: ADMIN_ONLY }` /
`user_mgmt: { view: ADMIN_ONLY }` with `can()`, but nothing currently feeds `can()` a role.

**Resolution — ONE client role source (no split-brain, the thing #2a closed):**
1. Extract that exact query into a single hook `src/hooks/useTenantRole.ts`:
   ```ts
   // returns { role: Role | null, loading: boolean }
   // SAME query ProtectedRoute already runs: tenant_users.role by (tenant_id, user_id) off getSession()
   ```
2. **Refactor `ProtectedRoute` to consume `useTenantRole()`** — it stops doing its own fetch.
   Behaviour identical (`isValidRole(role)` admits any valid role). One source, one query shape.
3. Gate the Users sub-tab **button AND panel** via `can(role, 'user_mgmt', 'view')` (= `ADMIN_ONLY`)
   read from that same hook. No new `role === 'admin'` literal anywhere.

**Stated explicitly (must remain true in code + comments):**
- The client admin-only gate is **UX-ONLY** — it hides the tab. It is **NOT a security boundary.**
- The **real authority is the server gate**: `invite-team-member` re-reads
  `get_my_tenant_role(server-derived tenant) === 'admin'` **fresh every call**. A demoted admin
  with a stale cached tab is rejected server-side.
- The client role hook may be **as stale as `ProtectedRoute` already tolerates** (no realtime).
  Acceptable for tab visibility precisely because the server is authoritative.

> Faithfulness note: the client hook uses the **same raw `tenant_users` select** as today (NOT the
> `get_my_tenant_role` RPC). The RPC is reserved for the **server** gate by the locked design;
> mixing it onto the client would create a second role path. One path = the existing select.

---

## 1. `invite-team-member` edge function (NEW)

**`verify_jwt = TRUE`** (caller is an authenticated admin). ⚠️ The Supabase toggle silently
reverts to ON after every deploy — **re-check after every deploy** (here it must STAY on; still verify).

**Caller auth (locked):** build the anon client **with the caller's `Authorization` header in
`global.headers`**, then `getUser()`. NOT service-role `getUser`, NOT token-as-arg.
```ts
const caller = createClient(URL, ANON_KEY, {
  global: { headers: { Authorization: req.headers.get('Authorization')! } },
})
const { data: { user } } = await caller.auth.getUser()   // 401 if null
```

**`tenant_id` server-derived (locked) — never from body/header:** resolve from the request host/
subdomain (`<sub>.pestflowpro.ai` → `resolveTenantId()` → `get_tenant_boot`). The body's only
trusted fields are `email` and `role`.

**Admin gate (locked):** re-read FRESH every call via the **caller-authed** client so `auth.uid()`
is the caller:
```ts
const { data: role } = await caller.rpc('get_my_tenant_role', { p_tenant_id: tenantId })
if (role !== 'admin') return 403
```

**Request body:** `{ email: string, role: 'admin' | 'manager' | 'user' }`.
- Validate `role ∈ ('admin','manager','user')` (mirror the DB CHECK) → 400 otherwise.
- Validate email format (must contain a dot after `@`) → 400 otherwise.

**Mint the link (locked) — `generateLink`, NOT GoTrue default mail:** using a **service-role**
admin client:
```ts
const { data } = await admin.auth.admin.generateLink({ type: 'invite', email })
// use data.properties.hashed_token  → build OUR url, do NOT use the default action_link
const url = `https://${subdomain}.pestflowpro.ai/set-password?token_hash=${hashed_token}&type=invite`
```
- **Re-issue / "Resend invite" invalidates the prior token** — handle gracefully (a stale link
  later fails `verifyOtp` on the set-password page; that page shows a friendly "superseded" message).
- **NEVER log the link or the `hashed_token`** — it is a bearer credential.

**Membership row (locked):** insert via **service role**, dup-tolerant on `23505`:
```ts
await admin.from('tenant_users').insert({ tenant_id, user_id, role })  // tenant_id server-derived
// on 23505 (already a member) → treat as success; do NOT change existing role in this PR
```
(`tenant_id` is the server-derived value, never echoed from the client.)

**Email (locked infra):** branded Resend via `_shared/sendEmail.ts`:
```ts
sendEmail({ to: email, subject: `You've been invited to ${businessName}`,
  fromName: businessName, html, text, idempotencyKey: `invite:${tenant_id}:${user_id}:v1` })
```
- **`.ai` only.** Do **NOT** copy `send-credentials-email` — it carries `.com` drift (L87/214/215)
  and `support@homeflowpro.ai` (L78). Links/footer use `https://pestflowpro.ai` /
  `https://<sub>.pestflowpro.ai`.
- `noreply@pestflow.ai` is the From (already baked into `sendEmail`).

**Response:** `{ status: 'invited' | 'already_member' }`. Do **not** return the link/token.

---

## 2. `password-reset-request` edge function (NEW)

**`verify_jwt = FALSE`** (caller is unauthenticated by definition). ⚠️ Toggle reverts to ON after
every deploy — **must be re-set to OFF and re-checked after every deploy.**

**Request body:** `{ email: string }`.

**`tenant_id` server-derived** from host/subdomain (for branding `fromName` + the set-password URL).
Never from body.

**Anti-enumeration:** **always return `200 { status: 'ok' }`** regardless of whether the email
exists or is a member. Branch internally:
- If the email belongs to a **member of the derived tenant**: `admin.auth.admin.generateLink(
  { type: 'recovery', email })` → build `https://<sub>.pestflowpro.ai/set-password?
  token_hash=<hashed_token>&type=recovery` → send branded Resend email
  (`idempotencyKey: recovery:${tenant_id}:${user_id}:${day}`). **Do NOT log the link.**
- Otherwise: do nothing; return the same `200`.

(Service-role admin client used for `generateLink`; the function itself takes no caller JWT.)

**Open follow-up (note, not in #2b):** per-email/IP rate limiting beyond the idempotency key.

---

## 3. Shared `set-password` page (NEW) — one route, invite + recovery

**Route (locked):** add to `src/App.tsx` **BEFORE** the `*` catch-all (L115):
```tsx
<Route path="/set-password" element={<Suspense fallback={LOADING}><SetPassword /></Suspense>} />
```
One route handles **both** `type=invite` and `type=recovery` (query param differentiates copy only).
No `/:slug` exists in this SPA, so no ordering hazard beyond being above `*`.

**Own Supabase client (locked):** the page creates its **own** client with
**`detectSessionInUrl: false`** so the app-wide `supabase` (which defaults `detectSessionInUrl:true`,
recon §6) does not auto-consume the token:
```ts
const sbAuth = createClient(URL, ANON_KEY, { auth: { detectSessionInUrl: false, persistSession: false } })
```

**Flow (locked):**
1. On mount, read `token_hash` + `type` from the URL query into component state.
2. **Immediately `history.replaceState({}, '', '/set-password')`** to strip the token from the URL
   (before any await), so it never lingers in history / referrer.
3. `await sbAuth.auth.verifyOtp({ token_hash, type })` → establishes a transient session.
   - On failure (expired / superseded by a re-issued invite / already used): render a friendly
     terminal state — "This link has expired or was replaced by a newer one." with a path back
     (login + "request a new reset link").
4. Render the password form — **single `useState` object** for form fields (CLAUDE.md rule #4),
   never per-field state. Validate min length + confirm-match client-side.
5. `await sbAuth.auth.updateUser({ password })`.
6. On success → redirect to `/admin` (session is live for invite; for recovery, send to
   `/admin/login` so they sign in with the new password — **decision flagged for validator**).

**Notes:** the page is **public** (no `ProtectedRoute`); it must not import the shared `supabase`
session. Tokens never logged.

---

## 4. Users tab UI (NEW) — in `SettingsTab.tsx`, admin-only

**Gating (per §0):** add `'Users'` to the Settings sub-tabs **only when** `can(role, 'user_mgmt',
'view')` is true (role from `useTenantRole()`). Gate **both** the sub-tab button and the rendered
panel. Mirrors the operator-only `Domain` idiom structurally (`isIronwood` → conditional tab), but
the condition is **role-based**, not `tenant.slug`.

**Panel contents (scope-tight):**
- **Member list** — email + role + status for every `tenant_users` row in this tenant.
  ⚠️ **NEW CONSTRAINT (recon):** `tenant_users` SELECT RLS is **self-row-only** (pr2a kept only the
  `auth.uid() = user_id` self-policy to avoid recursion). An admin therefore **cannot list other
  members via a direct client query.** → list via a **new SECURITY DEFINER RPC**
  `list_tenant_members(p_tenant_id uuid)` (see §5). Do **NOT** add a broad tenant_users SELECT
  policy — that risks the recursion #2a deliberately avoided.
- **Invite form** — email input + role `<select>` (admin/manager/user) → calls
  `invite-team-member`. Show "Seats: unlimited." Success/already-member/﻿error toasts.
- **Resend invite** — re-calls `invite-team-member` for an existing email (re-mints; prior token
  invalidated — surfaced to the user as "a fresh link was sent").

**Out of scope for #2b (explicit follow-ups):** changing an existing member's role, removing a
member. Both need admin-gated SECURITY DEFINER mutations; deferred to keep #2b focused on the
locked scope (invite + reset + set-password + Users tab read/invite).

---

## 5. Migrations (DDL — applied via MCP after review)

**`list_tenant_members(p_tenant_id uuid)`** — SECURITY DEFINER, admin-gated, self-contained
(no policy recursion because function bodies bypass RLS):
```sql
create or replace function public.list_tenant_members(p_tenant_id uuid)
returns table (user_id uuid, email text, role text)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if public.get_my_tenant_role(p_tenant_id) <> 'admin' then
    return;  -- non-admins get zero rows (UX gate already hides the tab)
  end if;
  return query
    select tu.user_id, u.email::text, tu.role
    from public.tenant_users tu
    join auth.users u on u.id = tu.user_id
    where tu.tenant_id = p_tenant_id;
end $$;
revoke all on function public.list_tenant_members(uuid) from public, anon;
grant execute on function public.list_tenant_members(uuid) to authenticated, service_role;
```
- Admin gate re-read fresh inside the function (consistent with the server-authority principle).
- No new RLS policy on `tenant_users` (recursion guard preserved).
- Invite INSERT uses **service role** (bypasses RLS) → no policy change needed for writes.

No other schema changes. `get_my_tenant_role`, `operator_tenant_id`, `current_tenant_id`,
`tenant_users` CHECK + composite index all already live (recon §7).

---

## 6. File manifest (for the build, post-validator)

| File | Change |
|------|--------|
| `src/hooks/useTenantRole.ts` | NEW — single client role source (extracted from ProtectedRoute) |
| `src/components/ProtectedRoute.tsx` | refactor to consume `useTenantRole()` (no own fetch) |
| `src/components/admin/settings/SettingsTab.tsx` | add admin-only `Users` sub-tab via `can()` |
| `src/components/admin/settings/UsersSection.tsx` | NEW — member list + invite + resend |
| `src/pages/SetPassword.tsx` | NEW — own client, verifyOtp→updateUser, replaceState |
| `src/App.tsx` | NEW `/set-password` route before `*` |
| `supabase/functions/invite-team-member/index.ts` | NEW edge fn (`verify_jwt=TRUE`) |
| `supabase/functions/password-reset-request/index.ts` | NEW edge fn (`verify_jwt=FALSE`) |
| `supabase/functions/_shared/emailTemplates/*` | NEW branded invite + recovery templates (`.ai`) |
| `supabase/migrations/<ts>_s273_pr2b_list_tenant_members.sql` | NEW RPC |

---

## 7. Validator gate — assertions to confirm before any build

1. `generateLink` + Resend (NOT GoTrue default mail); link/token never logged.
2. set-password: own client `detectSessionInUrl:false`; `verifyOtp({token_hash,type})` →
   `updateUser({password})`; `history.replaceState` strips token **before** the await.
3. One `/set-password` route, declared before `*`; handles invite + recovery.
4. Edge-fn caller auth = anon client w/ caller `Authorization` in `global.headers` → `getUser()`;
   role re-read **fresh** every call (no JWT claim trust).
5. `verify_jwt`: TRUE on invite / FALSE on reset-request; re-checked after every deploy.
6. `tenant_id` server-derived (host/subdomain), never client body/header.
7. Admin-only invite gate via `get_my_tenant_role(server tenant) === 'admin'`.
8. Membership insert dup-tolerant on `23505`; tenant_id server-derived.
9. Templates `.ai` only — no `send-credentials-email` `.com`/`homeflowpro` copy.
10. ONE client role source: `useTenantRole()` feeds both ProtectedRoute and the Users-tab gate;
    client gate is UX-only; server is authoritative.
11. `list_tenant_members` SECURITY DEFINER, admin-gated, no new `tenant_users` SELECT policy
    (recursion guard intact).

**Open decisions for the validator:**
- (D1) Post-recovery redirect: straight to `/admin` (live session) vs. `/admin/login` (force
  re-auth with new password). Spec leans `/admin/login` for recovery, `/admin` for invite.
- (D2) Re-invite of an **existing member**: re-mint link only (no role change) vs. allow role
  update on re-invite. Spec leans link-only for #2b.

**STOP here.** No build until validator passes.
