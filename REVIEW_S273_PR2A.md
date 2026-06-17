# REVIEW — S273 PR #2a: Permission Foundation

Foundation only. Invite / password-reset / set-password page / Settings→Users tab are **PR #2b** — not built here.

## Pre-build investigation findings
- **faqs naming RESOLVED:** the app (`FaqTab`, `SEOHealthPanel`, `QAGate`, `useRevealReportData`) writes to **`faqs`** everywhere; the repo's `faq_items` table (`20260406_s61`) is orphaned/unused. Target table = **`faqs`**, live policy `faqs_auth_all`. Name-only — no RLS-shape impact.
- **🔴 DELETE hole in the specified FOR ALL doubled predicate:** a single `FOR ALL` policy gates DELETE by `USING` only (no role check), so a `'user'` could DELETE content rows. **Resolved (your call): split per-command policies.**
- **Live policy inventory pulled via MCP (read-only)** — repo was not truth. Exact names below drove surgical DROP/CREATE.

## What this PR builds
**Client**
- `src/lib/permissions.ts` — single typed map (`Role`/`Surface`/`Action`), `can()`, `isValidRole()`, `CONTENT_EDIT_SURFACES`. The matrix the RLS mirrors. No scattered role checks elsewhere.
- `src/components/ProtectedRoute.tsx` — now admits **any valid role** (admin/manager/user) via `isValidRole`, resolving the prior admin-only-vs-Login-any-member mismatch. Per-surface gating is the map's job; the server boundary is RLS.

**DB migration** `supabase/migrations/20260618000000_s273_pr2a_permission_foundation.sql` (+ rollback in `docs/migrations/`)
1. `get_my_tenant_role(uuid)` — SECURITY DEFINER, STABLE, `search_path=public,pg_temp`, REVOKE PUBLIC/anon, GRANT authenticated/service_role (mirrors `operator_tenant_id()`).
2. `tenant_users`: DROP `'admin'` default; ADD CHECK `role IN ('admin','manager','user')` (guarded).
3. `CREATE INDEX IF NOT EXISTS tenant_users (user_id, tenant_id)`.
4. **Split content-table RLS** (SELECT tenant-only; INSERT/UPDATE/DELETE gated to admin/manager):

| Table | Dropped | Created | Preserved (untouched) |
|---|---|---|---|
| blog_posts, social_posts, seo_meta, page_content, testimonials, service_areas, team_members | `tenant_isolation_<t>` | `<t>_select_members`, `<t>_insert_staff`, `<t>_update_staff`, `<t>_delete_staff` | `ironwood_admin_<t>_write`, anon read |
| faqs | `faqs_auth_all` | `faqs_select_members` + 3 staff write | `faqs_anon_read` |
| image_library | `image_library_tenant_insert`, `image_library_tenant_update` | same names, role-gated | `image_library_tenant_select` (User views); **no DELETE policy** |

5. `tenant_role_binding_drift` view (item 7, **audit not FK** — lower-risk choice): non-operator `profiles` bindings with no `tenant_users` row; excludes operator tenant via `operator_tenant_id()` so the `admin@demo.com` seed passes. service_role-only. No runtime trigger on the provisioning hot path. Hard FK deferred to demo-deauth wave.

**Untouched (confirmed):** `leads`, `stripe_payments`, `ai_proxy_log`, `*_audit`, `*_queue`, `report_*`, and all `ironwood_admin_*_write`.

## Tests / CI (`auth-isolation-test` job extended)
- Real PR #2a migration now applied on top of the focused fixture, so tests exercise the **actual** objects.
- **pgTAP** (`supabase/tests/pr2a_permissions.pgtap.sql`): `user` cannot INSERT/UPDATE/DELETE (blog_posts, faqs, image_library); `manager`/`admin` can; user DELETE leaves the row (hole closed); drift view empty with the operator seed excluded. Runs in authenticated context (`SET ROLE authenticated` + jwt claims), not superuser.
- **Deno** cross-tenant isolation test (PR #1) still runs green.

## Validator gate — PASSED
Perplexity + Gemini + ChatGPT converged (conservative-wins): split shape is strictly safer than the FOR ALL it replaces — DELETE hole closed, no OR-stack widening, UPDATE tenant-hop prevented, NULL role fails closed. Recursion guard verified live: `tenant_users` has only the `auth.uid()=user_id` self-policy and does not call `get_my_tenant_role` — no loop.

**ChatGPT-flagged addition folded in:** `REVOKE TRUNCATE ... FROM authenticated` on all 9 content surfaces (RLS does not cover TRUNCATE; `authenticated` held it via grant-all). Operator/sensitive tables excluded. Rollback re-grants it.

## Role × command × table matrix (pgTAP, 16 assertions)
- **blog_posts (simple):** user INSERT/UPDATE/DELETE/**TRUNCATE** all denied (+ rows unchanged); manager INSERT/UPDATE/DELETE allowed; admin INSERT allowed.
- **faqs (divergent):** user INSERT denied, user DELETE denied (row remains), manager INSERT allowed.
- **image_library (divergent, no-delete):** user INSERT denied; manager INSERT + UPDATE allowed; manager DELETE is a no-op (no policy) — row remains.
- **drift view** empty (operator seed excluded).

## ⚠️ Remaining before merge
1. **Apply (Claude.ai via MCP):** migration is idempotent vs live (DROP IF EXISTS + guarded CHECK + IF NOT EXISTS + REVOKE). Re-confirm live policy names match the inventory at apply time, then `NOTIFY pgrst`.
2. CI green (Validate + Deno + pgTAP) on the PR.

## Risk / rollback
- Blast radius: write-RLS on 9 content tables + `tenant_users` constraint. Read paths preserved (SELECT member + anon + operator). Rollback script restores the prior FOR ALL shape and drops #2a objects (re-opens the DELETE hole — only revert if the split itself must go).
- `current_tenant_id()` (profiles-based tenant binding) intentionally kept per validator decision; #2a only adds the role gate on top.
