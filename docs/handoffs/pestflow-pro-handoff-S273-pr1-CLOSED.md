# S273 PR #1 (Role-Store SSOT) — FULLY CLOSED

**STATUS:** PR #1 complete end-to-end. `profiles.role` column **DROPPED and verified**. The previously-blocked step is done. Next work is **PR #2** (the feature wave), not yet started.

---

## What closed this session

- The blocked `DROP COLUMN profiles.role` is **DONE**. The blocker was the `master_admin_read_provisioning_status` RLS policy (operator gate on `provisioning_status`) still reading `profiles.role`.
- Rewrote that policy off `profiles.role` onto `tenant_users.role` via a new `SECURITY DEFINER` helper `public.operator_tenant_id()` (resolves slug `'pestflow-pro'` → operator tenant id, bypassing `tenants` RLS). Migration: `supabase/migrations/20260617121500_s273_rewrite_provisioning_status_operator_gate.sql` (merged to main as **PR #210 / `c04d3e3`**, applied to the live DB via MCP — both verified in agreement; helper logic reviewed at SHA `b5da87b`).
- Helper hardened: `REVOKE ALL FROM PUBLIC, anon`; `GRANT EXECUTE TO authenticated, service_role`. `STABLE` volatility (correct for a table lookup). Policy is `TO authenticated`, reads **ONLY** `tenant_users` (self-visible row) + the definer constant — no `profiles`, no `tenants` RLS, no recursion.
- **Validator-gated** (Perplexity + Gemini + ChatGPT, all converged, no conflicts). The rewrite differed from the first-reviewed JOIN-`tenants` version because that version transitively depended on `profiles.tenant_id` via `current_tenant_id()` — caught by the live-DB check, sent back through the gate, helper version approved.
- Then re-ran the existing drop migration `20260617120100_s273_neutralize_profiles_role.sql` via MCP. `profiles.role` column now gone (verified: `information_schema` count = 0).
- Dependency scan before the drop was clean (`pg_depend` empty after the rewrite). Verified operator gate intact: operator uid `5181b30a` passes; demo seed `admin@demo.com` (`d3300001-...-deadc0deadc0`) correctly **DENIED** (was the intended access removal); 6 non-operator `tenant_users` rows all denied; `operator_tenant_id()` resolves to `9215b06b-3eb5-49a1-a16e-7ff214bf6783`.

---

## BONUS WIN — protect-files hook permanently fixed

`.claude/hooks/protect-files.sh` was branch-scoped (**PR #209**, merged). `supabase/migrations/` is now blocked **ONLY on `main`**; on any feature branch the write is allowed (PR review is the gate). This **KILLS the per-migration relaxation ritual for good** — CC Web writes migrations on feature branches with no hook dance. All other protected patterns (`_shared/auth/`, `provision-tenant/`, `ironwood-provision/`, `stripe-webhook/`, `create-checkout-session/`, `src/integrations/supabase/client`, `rls.*.sql`) stay all-or-nothing. **Known-still-open:** the hook only registers on Edit/Write/MultiEdit, not Bash, so `mv`/`rm` bypass remains (documented framework limitation, separate fix, out of scope).

---

## Carry-forward into PR #2

- **USE** the new `public.operator_tenant_id()` helper for operator-tenant identity — do **NOT** re-derive. PR #2's `get_my_tenant_role(tenant_id)` helper is the customer-tenant analog.
- `execute_sql` does **NOT** stamp `schema_migrations`; repo files are the trail (consistent with the known non-replayable-from-zero history — the `20260405_fix_rls_policies.sql` / `stripe_payments` gap). Left as-is by decision.

---

## PR #2 — LOCKED DESIGN (not started)

**Scope:** `src/lib/permissions.ts` (single typed permission map, read by **BOTH** the `ProtectedRoute` UX gate **AND** every server write path) + permission-aware `ProtectedRoute` + `get_my_tenant_role(tenant_id)` `SECURITY DEFINER` helper + content-table write RLS, then `invite-team-member` (Settings→new **Users** tab, admin-only) + `password-reset` (shared set-password page).

**Roles:** **Admin** = everything (site content, settings incl. Users tab, billing, user mgmt, SEO, social, blog, website Team). **Manager** = edit SEO/social/blog + website Team only; no site content/settings/billing/user-mgmt. **User** = read-only (views analytics + SEO/Social/Blog/Team; edits nothing).

**Two distinct "team" concepts — do NOT conflate:** Website Team tab (`team_members`) is **CONTENT** (Manager+Admin edit, User views); Settings→Users tab (NEW) is login+role admin (admin-only).

**Content-table write RLS surfaces** (edit policy `WITH CHECK get_my_tenant_role(tenant_id) IN ('admin','manager')`): `blog_posts, social_posts, seo_meta, page_content, faqs, service_areas, testimonials, image_library/images, team_members`. Site-content/settings tables = admin only. **SENSITIVE tables** (`stripe_payments, leads, ai_proxy_log, *_audit, *_queue, report_*`) stay admin/service-role only — **UNTOUCHED**.

**Validator-locked deltas:** `generateLink` + Resend email (not default GoTrue mail), don't log link; set-password page `verifyOtp({token_hash,type})`→`updateUser({password})`, `detectSessionInUrl:false` on its own client, `history.replaceState` to strip token, one route handles invite+recovery declared **BEFORE** the catch-all (`*`→`NotFound` in `src/App.tsx`); edge-fn caller auth = anon client with caller's Authorization header in `global.headers` then `getUser()`, re-read role fresh every call; `verify_jwt=true` on invite endpoint / `false` on password-reset-request (toggle silently reverts ON after each deploy — re-check both); `tenant_id` always server-derived; CHECK constraint `role IN ('admin','manager','user')` on `tenant_users` + DROP the `'admin'` default; CI dual pgTAP(RLS) + Deno integration gate built on the `auth-isolation-test` runner from PR #1.

**Shared infra:** `sendEmail.ts` (Resend, `noreply@pestflow.ai`); `src/lib/supabase.ts` created with no options (`detectSessionInUrl` defaults true) so set-password needs its OWN client; `subdomainRouter.resolveTenantId()`→`get_tenant_boot`; set-password URL target `https://<subdomain>.pestflowpro.ai/set-password`. Supabase Site URL=`https://pestflowpro.ai`, redirect allowlist `https://*.pestflowpro.ai/**` (already cleared). Seats UNLIMITED.

---

## CC Web wave protocol for PR #2

`/investigate` (repo grep for all role-store + permission-check sites; report before code) → spec → validator gate (RLS/auth/caching changes) → `/qa` → `/review` → `/ship`. Branch + PR, manual merge. Migrations now write freely on feature branches (hook fixed).

Branch + PR, manual merge. Stop and report.
