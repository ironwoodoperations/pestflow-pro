# S273 — Self-Serve Auth Wave, PR #1 (Role-Store SSOT) — SHIPPED EXCEPT ONE BLOCKED STEP

**STATUS:** PR #207 **MERGED** to `main` (squash commit `05a7504`, "Role-store SSOT reconciliation (foundation PR #1 of self-serve-auth wave)"; prior baseline `046e0af`). Reroute is **live + verified in production** (Vercel deploy READY on merge commit `05a7504`). The wave is **NOT done** — PR #1 has one remaining **blocked step** (below), and **PR #2** (the feature wave) hasn't started.

> Cold-start note: this doc is written so the next session can resume **without re-investigating**. Read it top to bottom; the immediate task is the "ONE BLOCKED STEP" section.

---

## What shipped in PR #207 (`05a7504`)

- Rerouted **all 18 tenant-context edge functions** from `profiles.role` → `tenant_users.role` via `supabase/functions/_shared/auth/requireTenantUser.ts`. The membership lookup is **keyed to the requested tenant** (caller in tenant A asking for tenant B → no row → **403**). The inline copy of the helper in `outscraper-reviews/index.ts` was rerouted identically.
- `provision-tenant/index.ts` + dev scripts (`scripts/create-admin-user.mjs`, `scripts/provision-dang-user.ts`) stopped writing `user_roles` / `profiles.role`. `create-admin-user.mjs` gained the previously-missing `tenant_users` insert.
- **DDL APPLIED via MCP:** dropped the dead `user_roles` table + `has_role()` function + its `tenant_access_user_roles` policy (migration `supabase/migrations/20260617120000_s273_drop_user_roles_has_role.sql`). These had **zero callers** — confirmed dead by repo-wide grep (no app code, no RLS policy referenced `has_role()`; `user_roles` was write-only).
- **Cross-tenant isolation test** (`supabase/functions/_shared/auth/requireTenantUser.test.ts`) + the **first CI test-runner step** (`.github/workflows/ci.yml` job `auth-isolation-test`: `supabase start` + `deno test`, mints a **real member-of-A JWT**, asserts requested-tenant-B → 403). All CI green on merge.
- `.claude/hooks/protect-files.sh` was **temporarily relaxed** for the build (commit `9a3c6ff`) and **RESTORED before merge** (commit `9631de3`, verified byte-identical to original). No `.bak` left behind.

---

## ⚠️ THE ONE BLOCKED STEP — THIS IS WHERE THE NEXT SESSION STARTS

The second migration `supabase/migrations/20260617120100_s273_neutralize_profiles_role.sql` (`DROP COLUMN profiles.role`) **FAILED** with:

```
cannot drop column role of table profiles because other objects depend on it
DETAIL: policy master_admin_read_provisioning_status on table provisioning_status
        depends on column role of table profiles
```

**ROOT CAUSE:** PR #1's grep scoped to the auth path (the 18 edge fns) and **missed a standalone RLS policy**. `master_admin_read_provisioning_status` (a `SELECT` policy on `provisioning_status`) reads `profiles.role`. Full definition:

```sql
EXISTS (
  SELECT 1 FROM profiles p
  JOIN tenants t ON t.id = p.tenant_id
  WHERE p.id = auth.uid()
    AND t.slug = 'pestflow-pro'
    AND p.role = 'admin'
)
```

Intent: an **operator gate** — only an admin in the `pestflow-pro` **OPERATOR** tenant may read `provisioning_status`. It is **NOT** a customer-tenant gate.

**DO NOT use `DROP ... CASCADE`** — that silently deletes this operator security gate. Hard no.

### THE FIX PLAN (scoped follow-up, ~15 min)

1. **Rewrite** `master_admin_read_provisioning_status` to read `tenant_users.role` instead of `profiles.role` — same operator intent, expressed as: membership in the `pestflow-pro` operator tenant with `role = 'admin'`, via `tenant_users`. (Operator tenant = the Ironwood operator tenant — confirm `slug = 'pestflow-pro'` resolves to it; `tenant_users` keys on `tenant_id` + `user_id` + `role`.)
2. This touches **RLS → run the validator reflex** (Perplexity + Gemini, conservative-wins) on the rewritten policy before applying.
3. **CC Web** writes the policy-rewrite migration (repo trail). **Claude.ai** applies it via MCP.
4. **THEN re-run** `20260617120100_s273_neutralize_profiles_role.sql` (`DROP COLUMN profiles.role`) — it will now succeed.
5. **Verify:** `profiles.role` gone; `provisioning_status` still readable **ONLY** by operator-tenant admins (test with an operator JWT and a non-operator JWT).

**Before the drop, run a dependency scan** (`pg_depend` + grep policies/functions/views for `profiles.role`) so we don't hit a **THIRD** hidden consumer. The grep already missed one — do **not** trust "this is the last one" without scanning.

### DEFERRED / SAFE STATE

`profiles.role` column still **EXISTS** and is harmless: live code reads `tenant_users`; only this one policy reads `profiles.role` and it still works. **Nothing is half-applied.** `tenant_users.role` and `profiles.role` agreed for all **7 rows** at drop time (zero mismatches), so the eventual column drop changes nothing observable.

---

## LOCKED DESIGN FOR PR #2 (the feature wave — NOT started)

Scope: `invite-team-member` (Settings → new **Users** tab, admin-only) + `password-reset` (shared set-password page) + the **3-role permission layer** (Admin/Manager/User, matrix below) + **content-table write RLS** on the matrix surfaces (sensitive tables held back).

**Roles:**
- **Admin** = everything (site content, settings incl. Users tab, billing, user management, SEO, social, blog, website Team).
- **Manager** = produces public-facing content: edit SEO/social/blog + website Team. No site content, settings, billing, or user management.
- **User** = read-only (views analytics + SEO/Social/Blog/Team screens; edits nothing).

**Two distinct "team" concepts — do not conflate:**
- **Website Team tab** (`team_members`) is **CONTENT** — names/faces/bios on the customer site. Manager+Admin edit, User views.
- **Settings → Users tab** (NEW) is login + role administration — **admin-only**.

**Validator deltas already locked:**
- `generateLink` + Resend email (NOT default GoTrue mail); do not log the link.
- Set-password page: `verifyOtp({token_hash,type})` → `updateUser({password})`; `detectSessionInUrl:false` on its client; `history.replaceState` to strip the token; one route handles invite + recovery; route declared **before** any catch-all.
- Edge-fn caller auth: anon client **with the caller's Authorization header** in `global.headers`, then `getUser()`; re-read role **fresh** from DB every call.
- `verify_jwt` = **true** on invite endpoint / **false** on password-reset-request endpoint. (Toggle silently reverts to ON after every deploy — re-check on both after each deploy.)
- `tenant_id` always **server-derived** (verified host/subdomain → tenant lookup, or caller's own membership row); never from client body/header.
- **CHECK constraint** `role IN ('admin','manager','user')` on `tenant_users` + **DROP the `'admin'` default** (require role explicit on every insert).
- CI: dual **pgTAP (RLS)** + **Deno integration** gate (the Deno test is what satisfies the mandatory isolation gate; RLS-only proves nothing about service-role edge-fn boundaries). Build on the `auth-isolation-test` runner shipped in PR #1.
- `src/lib/permissions.ts` = single typed permission map, read by **both** `ProtectedRoute` (UX gate) and every server write path (security gate). No scattered `if (role==='admin')`.
- `get_my_tenant_role(tenant_id)` SECURITY DEFINER helper for RLS + client.

**Content-table write RLS (PR #2):** `blog_posts, social_posts, seo_meta, page_content, faqs, service_areas, testimonials, image_library/images, team_members` → edit policy `WITH CHECK (get_my_tenant_role(tenant_id) IN ('admin','manager'))`. Site-content/settings tables → `'admin'` only. **Sensitive tables** (`stripe_payments`, `leads`, `ai_proxy_log`, `*_audit`, `*_queue`, `report_*`, etc.) stay admin/service-role only — **untouched**.

**Surface → write-path map (from PR #1 investigation):** admin tabs in `src/pages/admin/Dashboard.tsx` (`TABS` array); Settings sub-tabs in `SettingsTab.tsx` (new Users tab goes here). SEO→`apply-finding-fix`; Social→`generate-social-batch`/`post-to-social`; Blog→direct `blog_posts`+`ai-proxy`; Website Team→direct `team_members`; Content→direct `page_content`; Settings→direct `settings`; Billing→read-only; Analytics→read-only. User-management UI does not exist yet.

**Shared infra confirmed (PR #1 investigation):**
- Email sender: `supabase/functions/_shared/sendEmail.ts` — Resend, `noreply@pestflow.ai`, signature `sendEmail({to,cc,subject,html,text,replyTo,fromName,idempotencyKey})`. New templates use `.ai` (note `send-credentials-email` has `.com` drift at L87/214-215 + `support@homeflowpro.ai` at L78 — do not copy).
- Routing: `src/App.tsx` catch-all is `*`→`NotFound` (no `/:slug` in the Vite SPA — tenant subdomains hit Next.js). No `/set-password` route yet — add **before** `*`.
- Tenant boot: `subdomainRouter.resolveTenantId()` → `get_tenant_boot({slug_param})` in `TenantBootProvider.tsx`. set-password URL target = `https://<subdomain>.pestflowpro.ai/set-password`.
- Supabase client `src/lib/supabase.ts` is created with **no options** (so `detectSessionInUrl` defaults true) → set-password page needs its **own** client with `detectSessionInUrl:false`.

**Prereqs already cleared this session:** Supabase Site URL = `https://pestflowpro.ai`; redirect allowlist = `https://*.pestflowpro.ai/**`.

**Seats UNLIMITED** on PestFlow Pro (per-tech/per-location billing is a separate Platform repo, out of scope).

---

## BACKLOG SURFACED THIS SESSION

- **Migration history NOT replayable from zero:** `supabase/migrations/20260405_fix_rls_policies.sql` references `stripe_payments`, which no earlier migration creates (it exists only on the live remote). A from-scratch `supabase start` dies on it. The CI isolation test works around this with a **focused fixture schema** (`supabase/tests/fixtures/00000000000001_iso_min_schema.sql` — `tenants` + `tenant_users` + grants). Real "make migrations replayable from zero" cleanup is **separate / out of scope**.
- **Parked git stash on `chore/rebuild-2`** ("chore/rebuild-2 wip before switching to PR207 branch") — earlier-session handoff/manifest files, likely already on `main`; check then drop.
- **Claire two-identity setup: DESCOPED** — removed from the wave, no longer needed.

---

## RESUME CHECKLIST (next session, in order)

1. `[ ]` Rewrite `master_admin_read_provisioning_status` policy → `tenant_users.role` (CC Web migration + validator reflex).
2. `[ ]` Dependency scan for any other `profiles.role` consumer (`pg_depend` + grep).
3. `[ ]` Claude.ai applies the policy migration, then re-runs `20260617120100_s273_neutralize_profiles_role.sql`.
4. `[ ]` Verify `profiles.role` dropped + operator gate intact (operator JWT vs non-operator JWT).
5. `[ ]` PR #1 fully closed → start **PR #2** (permission map + ProtectedRoute + invite + reset + content RLS), branch + PR, manual merge.
