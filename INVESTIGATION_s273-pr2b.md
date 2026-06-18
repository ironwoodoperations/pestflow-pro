# INVESTIGATION — S273 PR #2b recon (invite + password-reset + set-password)

**Type:** Pre-implementation recon (not a bug). `/investigate` gate before spec.
**Scope:** `invite-team-member` edge fn + Settings→Users tab (admin-only) + `password-reset-request` edge fn + shared `set-password` page.
**Predecessor:** PR #2a (permission foundation) FULLY CLOSED on main — PR #212, squash `9562029`. Migration applied + verified live via MCP.
**Locked design:** `docs/handoffs/pestflow-pro-handoff-S273-pr2a-CLOSED.md`.

No code written. Findings only.

---

## 1. Invite path — GREENFIELD
No `invite-team-member` (or any customer-tenant invite) edge function exists under `supabase/functions/`. The only `invite` hits in `src/` are Ironwood **salesperson** invites (`TeamTab.tsx`, `ProspectDetail.Provisioning.tsx`) — unrelated. `invite-salesperson` is named in CLAUDE.md's edge-fn table but is **not present on disk**. No partial/abandoned customer-invite code. Build fresh.

## 2. Password-reset path — GREENFIELD
No `reset-request` / `reset` / `password-reset` / `set-password` edge fn or client flow exists. Zero `resetPasswordForEmail` / `verifyOtp` / `recovery` usages anywhere. No GoTrue default-mail override to undo — clean slate. Mint links via `auth.admin.generateLink` + Resend per locked design.

## 3. Email-send infra — CONFIRMED + drift flagged
`supabase/functions/_shared/sendEmail.ts` matches the locked signature exactly:
`sendEmail({ to, cc, subject, html, text, replyTo, fromName, idempotencyKey })` — Resend,
`from: ${fromName} <noreply@pestflow.ai>` (**.ai**, correct, L29), Idempotency-Key header (L42).

**Drift in `send-credentials-email/index.ts` — confirmed exact lines, DO NOT COPY:**
- **L78**: `mailto:support@homeflowpro.ai` — wrong brand domain (`homeflowpro`)
- **L87**: `https://pestflowpro.com` / `pestflowpro.com` — **.com** drift
- **L214**: `resolvedSiteUrl || \`https://pestflowpro.com\`` — **.com** drift
- **L215**: `resolvedAdminUrl || \`https://pestflowpro.com/admin\`` — **.com** drift
- (L219: `replyTo: 'support@homeflowpro.ai'` — same wrong-domain pattern)

New invite/reset templates use **`.ai`** only (`https://pestflowpro.ai`, `https://<sub>.pestflowpro.ai/set-password`).

## 4. SettingsTab.tsx — CONFIRMED + role-source gap flagged
`src/components/admin/settings/SettingsTab.tsx`:
```
CLIENT_TABS   = ['Business Info','Branding','Social Links','Notifications','Master Hero Image','Holiday Mode']
IRONWOOD_TABS = [...CLIENT_TABS, 'Domain']
const isIronwood = tenant.slug === 'pestflow-pro'   // operator-only Domain gate idiom
const SUB_TABS = isIronwood ? IRONWOOD_TABS : CLIENT_TABS
```
Domain = **operator**-gated (slug). Users tab must be **role**-gated (admin-only, customer-tenant) — a different gate in kind. SettingsTab has only `useTenant()`, no role in scope.

**DISCREPANCY with locked design's "Settings is admin-gated":** At the Dashboard nav level (`Dashboard.tsx` L131-150) the `TABS` map gates **only by TIER** (`gatedTabs = {blog:2, seo:2, social:2, analytics:2}`). There is **NO role gate on Settings** — a customer-tenant manager/user can open Settings today. The Users tab therefore needs its OWN explicit admin-only gate; it cannot inherit a non-existent one. (Resolution = spec, item below.)

## 5. src/App.tsx — CONFIRMED
Route order: `/` → `/admin/login` → `/admin/onboarding` → `/admin/onboarding-live` → `/admin` → `/ironwood/login` → `/ironwood/*` → `/payment-success` → `/intake/:token` → `/intake-success` → `/demos` → `/demos/admin` → `/terms` → `/privacy` → **`<Route path="*" element={<NotFound />} />` (L115, last)**. No `/:slug` route (tenant subdomains route via middleware to Next.js, never reach this SPA). New `/set-password` route declared **before L115**, single route handling both invite + recovery.

## 6. src/lib/supabase.ts — CONFIRMED
```ts
export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
```
No third options arg → `detectSessionInUrl` defaults `true`. Set-password page must build its OWN client with `detectSessionInUrl:false` so the shared client doesn't auto-consume the token hash on load.

## 7. Carry-forward helpers — ALL CONFIRMED present & callable
- `get_my_tenant_role(p_tenant_id uuid)` — `20260618000000_s273_pr2a_*.sql` L28-40: sql/stable/security definer, `select role from tenant_users where user_id=auth.uid() and tenant_id=p_tenant_id`; revoke public/anon + grant authenticated, service_role.
- `operator_tenant_id()` — `20260617121500_*.sql` L16-23: `SELECT id FROM tenants WHERE slug='pestflow-pro'`.
- `current_tenant_id()` — `20260405_fix_rls_policies.sql` L6-9: `select tenant_id from profiles where id=auth.uid()` (binding stays on `profiles.tenant_id`).

---

## Role-source path (dumped for the spec)
`ProtectedRoute` (`src/components/ProtectedRoute.tsx`) resolves the caller's role by a **direct Supabase query** — NOT `get_my_tenant_role` RPC, NOT a store, NOT a JWT decode:
```ts
const { data } = await supabase
  .from('tenant_users').select('role')
  .eq('tenant_id', tenantId).eq('user_id', session.user.id).maybeSingle()
setAuthed(isValidRole(data?.role))
```
It then **discards the role** after computing the `authed` boolean — nothing holds the role for components. `src/lib/permissions.ts` already declares `settings: { view: ADMIN_ONLY }` with the comment "(incl. the future Users tab)" and a `can(role, surface, action)` predicate, but no component currently provides a role to feed `can()`.

**Resolution (spec):** extract that exact `tenant_users` select into one shared `useTenantRole()` hook; refactor `ProtectedRoute` to consume it (so it stays the ONE source — no second fetch / no split-brain); gate the Users sub-tab button AND panel via `can(role, 'settings', 'view')` from that same hook. The client gate is UX-only; the server gate (`invite-team-member` re-reading `get_my_tenant_role` fresh) is the real boundary.

---

## Net assessment
Greenfield on both edge fns and the set-password page; all shared infra (sendEmail, route table, no-options client, three SECURITY DEFINER helpers) is in place and matches the locked design. One gap the spec must close: the client admin-only role source for the Users tab (resolved above by reusing the #2a ProtectedRoute role path via a single `useTenantRole()` hook). No blockers.

**Next:** spec → validator gate → /qa → /review → STOP. No build until validator passes.
