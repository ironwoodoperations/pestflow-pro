# S273 PR #2a (Permission Foundation) — FULLY CLOSED → PR #2b resume doc

**STATUS:** PR #2a complete end-to-end — **PR #212 squash-merged** (`9562029` on main), migration applied to the live DB via MCP and **verified live**. **PR #2b (the feature wave) NOT started.** This is the cold-start resume doc for #2b.

> Read top to bottom; a cold session can start #2b without re-investigating.

---

## What closed (PR #2a)

- **`get_my_tenant_role(tenant_id)`** SECURITY DEFINER helper — customer-tenant role lookup (`select role from tenant_users where user_id=auth.uid() and tenant_id=$1`).
- **`tenant_users` hardened:** dropped the `'admin'` default; added CHECK `role IN ('admin','manager','user')`; composite index `(user_id, tenant_id)`.
- **Split per-command content RLS** on 9 surfaces (blog_posts, social_posts, seo_meta, page_content, faqs, service_areas, testimonials, image_library, team_members): SELECT tenant-only (any member views); INSERT/UPDATE/DELETE gated on `get_my_tenant_role(tenant_id) IN ('admin','manager')` — closes the FOR-ALL DELETE hole. `REVOKE TRUNCATE` from `authenticated` on all 9.
- **`tenant_role_binding_drift`** audit view (excludes operator tenant via `operator_tenant_id()`).
- **`ironwood_admin_*_write`** operator policies + anon-read + `image_library_tenant_select` preserved untouched. Sensitive tables (leads, stripe_payments, ai_proxy_log, *_audit, *_queue, report_*) untouched.
- **Client:** `src/lib/permissions.ts` (typed surface→role map + `can()`/`isValidRole()`); `ProtectedRoute` admits any valid role (admin/manager/user), resolving the prior admin-only-vs-Login-any-member mismatch.
- **Validator-PASSED** (Perplexity + Gemini + ChatGPT converged: split shape strictly safer than FOR ALL; no OR-stack widening; UPDATE tenant-hop prevented; NULL role fails closed; recursion guard verified — `tenant_users` has only the `auth.uid()=user_id` self-policy, does not call `get_my_tenant_role`).
- **CI green** incl. pgTAP role-RLS (16-assertion role×command×table matrix) + Deno cross-tenant isolation.

### Post-apply live verification (MCP)
- `get_my_tenant_role` exists; `tenant_users` default gone; CHECK + composite index present.
- **0 leftover old policies** (`tenant_isolation_*` / `faqs_auth_all` replaced), **13 `ironwood_admin` policies preserved**, **0 TRUNCATE grants** to authenticated on the 9, **`tenant_role_binding_drift` = 0 rows**.

---

## Carry-forward into PR #2b (REUSE — do NOT re-derive)
- **`operator_tenant_id()`** — operator-tenant identity.
- **`get_my_tenant_role(tenant_id)`** — customer-tenant role; use for the **admin-only gate on the invite endpoint** and any server-side role check.
- **`current_tenant_id()` stays on `profiles.tenant_id`** (validator-unanimous; Scenario A confirmed — operators run one tenant at a time; `active_tenant_id`/JWT-context multi-tenant switching is deferred indefinitely).
- **`src/lib/permissions.ts` `can()`** — per-surface UX gating now reads this map (no scattered role checks).

---

## PR #2b — LOCKED DESIGN (not started)

**Scope:** `invite-team-member` edge fn + Settings→new **Users** tab (admin-only) + `password-reset` + shared **set-password** page. Seats UNLIMITED (per-tech/per-location billing is the separate Platform repo).

**Validator-locked deltas:**
- **Invite/reset links:** `auth.admin.generateLink` mints; **embed in a branded Resend email — do NOT send via default GoTrue mail, do NOT log the link** (bearer credential). "Resend invite" re-issues invalidate the prior token — handle gracefully.
- **Set-password page:** own Supabase client with **`detectSessionInUrl:false`**; consume token via **`verifyOtp({ token_hash, type })`** then **`updateUser({ password })`**; **`history.replaceState`** to strip the token from the URL immediately after verify; **one route handles both invite + recovery**, declared **BEFORE the `*` catch-all** in `src/App.tsx` (catch-all is `*`→`NotFound`; there is no `/:slug` in the Vite SPA).
- **Edge-fn caller auth:** build the anon client **with the caller's `Authorization` header in `global.headers`**, then `getUser()` (NOT service-role `getUser`, NOT token-as-arg). **Re-read role FRESH from DB every call** (never trust a JWT claim — stale after demotion).
- **`verify_jwt`:** **TRUE** on the invite endpoint / **FALSE** on the password-reset-request endpoint (caller is unauthenticated by definition). Toggle silently reverts to ON after every deploy — **re-check BOTH after every deploy.**
- **`tenant_id` always server-derived** (verified host/subdomain → tenant lookup, or the caller's own membership row). Never from client body/header.
- **Invite authz:** admin-only via `get_my_tenant_role(server-derived tenant) = 'admin'`; insert `tenant_users {tenant_id (server-derived), user_id, role ∈ ('admin','manager','user')}` dup-tolerant on 23505.

**Shared infra (confirmed):**
- **`supabase/functions/_shared/sendEmail.ts`** — Resend, `noreply@pestflow.ai`, `sendEmail({to,cc,subject,html,text,replyTo,fromName,idempotencyKey})`. New templates use `.ai`. **Do NOT copy `send-credentials-email`** — it has `.com` drift at L87/214-215 and `support@homeflowpro.ai` at L78.
- **`src/lib/supabase.ts`** is created with **no options** (so `detectSessionInUrl` defaults true) → the set-password page needs its **own** client.
- **Set-password URL target:** `https://<subdomain>.pestflowpro.ai/set-password` (tenant via `subdomainRouter.resolveTenantId()` → `get_tenant_boot`).
- **Users tab** lands in `src/components/admin/settings/SettingsTab.tsx` `CLIENT_TABS`, **admin-only** (Settings is admin-gated; the operator-only Domain tab already uses the `tenant.slug==='pestflow-pro'` pattern).
- Supabase **Site URL + redirect allowlist already cleared** (`https://pestflowpro.ai`, `https://*.pestflowpro.ai/**`).

---

## PR #2b protocol (CC Web)
`/investigate` (grep the invite/reset/email-send paths + `SettingsTab` `CLIENT_TABS` + `src/App.tsx` route table & catch-all position; **report before code**) → spec → **validator gate** on auth/edge-fn behavior → `/qa` → `/review` → **STOP**. Branch + PR, manual merge. Migrations write freely on feature branches (hook branch-scoped, PR #209); Claude.ai applies any DDL via MCP after review.
