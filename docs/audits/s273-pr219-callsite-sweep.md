# S273 / PR #219 — pre-merge audit (call-site sweep + downstream tenant-scoping)

Context: `requireTenantUser` (and `requireTenantAdmin`, `requireAiCaller`) now **validate
a SUPPLIED `requestedTenantId` against `tenant_users`** — they no longer DERIVE the
caller's tenant from `profiles`. A caller who belongs to tenant A but asks for tenant B
finds no `(user_id, tenant_id)` row → 403. This audit confirms every caller passes a
real, validated tenant id, and that every post-auth query is scoped to that validated id.

Method: `rg "requireTenantUser\(|requireTenantAdmin\(|requireAiCaller\("` across
`supabase/functions/`, then read each consumer end-to-end.

---

## Item 1 (BLOCKING) — call-site sweep

`requestedTenantId` source for every caller. **No caller relies on tenant-derivation;
none needs a "fall back to the user's single tenant" shim.** Cron/internal/server-to-
server paths bypass the user gate via an explicit service-role / internal-secret check
and pass an explicit `tenant_id` from the body — they never depended on derivation.

| Function | Helper | `requestedTenantId` source | Verdict |
|---|---|---|---|
| list-checkout-sessions | requireTenantUser | `MASTER_TENANT_ID` constant (+ slug defense-in-depth) | ✅ explicit |
| ga4-analytics | requireTenantUser | `body.tenant_id`; service-role JWT skips user gate (cron) | ✅ explicit |
| gsc-analytics | requireTenantUser | `body.tenant_id`; service-role JWT skips user gate (cron) | ✅ explicit |
| seo-analytics | requireTenantUser | `body.tenant_id`; service-role JWT skips user gate (cron) | ✅ explicit |
| zernio-analytics | requireTenantUser | `body.tenant_id` | ✅ explicit |
| pagespeed-proxy | requireTenantUser | `body.tenant_id` | ✅ explicit |
| generate-social-batch | requireTenantUser | `body.tenant_id` | ✅ explicit |
| places-reviews | requireTenantUser | `body.tenant_id` | ✅ explicit |
| tag-image-vision | requireTenantUser | `body.tenant_id` (targeted mode only); internal-secret path is cross-tenant by design | ✅ explicit |
| ai-proxy | requireAiCaller | `rawTenant` (`body.tenant_id`, UUID-validated); operator features take JWT+allowlist | ✅ explicit |
| post-to-social | requireTenantAdmin | `body.tenantId` | ✅ explicit |
| notify-upgrade | requireTenantAdmin | `body.tenant_id` | ✅ explicit |
| create-upgrade-session | requireTenantAdmin | `body.tenant_id` | ✅ explicit |
| apply-finding-fix | requireTenantAdmin | `body.tenant_id` (uses RETURNED `res.tenantId`) | ✅ explicit |
| notify-support-ticket | requireTenantAdmin | `ticket.tenant_id` — derived from the resource being acted on, then caller must be admin of THAT tenant | ✅ resource-bound (not a weakener) |
| outscraper-reviews | **local copy** of requireTenantUser (does not import `_shared`) | `body.tenant_id`; internal-secret path is cron | ✅ explicit; local copy already reads `tenant_users` SSOT |

Notes:
- **notify-support-ticket** fetches the ticket by `ticketId`, derives `tenant_id` from
  it, then requires the caller be **admin of the ticket's tenant**. The auth is bound to
  the resource, so this is not the derivation pattern the validator gate flagged.
- **outscraper-reviews** carries an inline `requireTenantUser` (not the shared helper); it
  already reads role from `tenant_users` keyed to the requested tenant (S273-correct), so
  it is not affected by `_shared` edits but is kept in the redeploy/verify list anyway.
- No cron / queue consumer / webhook handler calls the shared helper without a tenant id.
  Queue/worker functions (`process-campaign-job`, `process-sms-queue`,
  `generate-monthly-report`, `lead-bridge-dispatch`, the `ai-authority-*` set, …) do not
  call these helpers at all — they authenticate via internal-secret/service-role.

## Item 2 (BLOCKING) — downstream tenant-scoping audit

Every `svc.from(...)` after the auth check, checked against the **validated** tenant id.

| Function | Post-auth data access | Scoped to validated tenant? |
|---|---|---|
| list-checkout-sessions | Stripe only (+ `tenants` by `MASTER_TENANT_ID`) | ✅ |
| ga4-analytics | `tenants`/`settings`/`ga4_runs` all `.eq('tenant_id', tenantId)` (or `id`) | ✅ |
| gsc-analytics | same pattern, all `.eq('tenant_id', tenantId)` | ✅ |
| seo-analytics | `tenants`/`settings`/RPCs all keyed to `tenantId` | ✅ |
| zernio-analytics | `settings`/`zernio_runs` `.eq('tenant_id', tenantId)` | ✅ |
| pagespeed-proxy | `pagespeed_runs` insert with `tenant_id: tenantId` | ✅ |
| generate-social-batch | `image_library`/`social_campaigns`/`campaign_jobs` all `.eq/.insert tenant_id` | ✅ |
| places-reviews | `settings` `.eq('tenant_id', tenantId)` | ✅ |
| tag-image-vision | targeted path scopes `.eq('tenant_id', jwtTenant)`; batch/reap are internal cross-tenant | ✅ |
| ai-proxy | no tenant-scoped table reads; rate-limit keys + logs use validated `callerTenant` | ✅ |
| notify-upgrade | `tenants` `.eq('id', tenant_id)` | ✅ |
| create-upgrade-session | `settings` (`stripe_billing`) `.eq('tenant_id', tenant_id)` | ✅ |
| apply-finding-fix | `report_findings` + target tables all `.eq('tenant_id', tenant)` in WHERE | ✅ |
| notify-support-ticket | `settings` `.eq('tenant_id', ticket.tenant_id)` (== validated) | ✅ |
| outscraper-reviews | `settings`/`rate_limit_events` `.eq('tenant_id', tenantId)` | ✅ |
| **post-to-social** | **`social_posts` read + 5 writes were keyed by `.eq('id', postId)` ONLY** | ⚠️→ **FIXED** |

### Finding (fixed in this PR) — post-to-social confused-deputy gap

`requireTenantAdmin(req, tenantId)` validated the caller as admin of `tenantId`, but the
`social_posts` lookups/updates were keyed only by `postId`:

- read `image_url, media_type` by `id`
- five `update(...)` by `id` (failure paths + the success path that writes
  `status='published'`, `zernio_post_id`, …)

A validated admin of tenant A could pass a `postId` owned by tenant B and read its media
or flip its status. **Fix:** every `social_posts` op is now double-scoped
`.eq('id', postId).eq('tenant_id', tenantId)`. (`tenant_id`-less branch is the INSERT,
which already sets `tenant_id: tenantId`.)

---

## Constraint check — `UNIQUE(user_id, tenant_id)` on `tenant_users`

`maybeSingle()` on `(user_id, tenant_id)` assumes at most one row. **Confirmed present —
no migration needed:**

- Live DB: constraint `tenant_users_tenant_id_user_id_key` → `UNIQUE (tenant_id, user_id)`
  (verified via `pg_constraint`, contype `u`).
- CI fixture `supabase/tests/fixtures/00000000000001_iso_min_schema.sql` mirrors it:
  `unique (tenant_id, user_id)`.

(Column order in a composite UNIQUE does not affect uniqueness; `(tenant_id, user_id)`
fully enforces the `(user_id, tenant_id)` assumption.)

---

## Item 3 (DESIGN) — verify_jwt SSOT in config.toml

Implemented (replaces PR #219's two-pass shell deploy):
- `supabase/config.toml` now pins `verify_jwt` for **every** shared-auth consumer; the
  redeploy workflow deploys with **no** per-function flag, so config.toml is the single
  source of truth and a redeploy can't drift to the CLI default or the wrong group.
- **places-reviews drift resolved at source**: config.toml `true` → `false` (matches the
  deployed platform; the function does inline auth).
- CLI pinned to **2.84.2** in both `redeploy-edge-on-shared-change.yml` and `ci.yml`.
- Post-deploy verification (`.github/scripts/verify_verify_jwt.py`) asserts the deployed
  `verify_jwt` (Management API) equals config.toml for every consumer; fails on drift or
  on any consumer lacking an explicit config.toml pin.
