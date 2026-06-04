# Faithful-Rebuild Runbook — Rebuild-on-Shell Migrations

Operational runbook for migrating a customer with an existing ranking website
onto a **shared PFP shell** (`migration_path: rebuild_on_shell`) without losing
their SEO. This complements the discovery and onboarding prompts:

- `CUSTOMER_SITE_DISCOVERY_PROMPT.md` — Phase 6 produces the redirect map CSV.
- `CUSTOMER_ONBOARDING_PROMPT.md` — Phase 4 step 6 wires redirects in at cutover.

This runbook covers the **redirect-map step concretely** — the single
highest-stakes deliverable of a shell migration. Customer #2 is the first real
consumer.

---

## Build the redirect map

Old URLs change on cutover. Without redirects, every old Google result and
bookmark 404s and rankings collapse within 4–8 weeks. On a shared shell the
mechanism is the **`public.tenant_redirects` table → build-time
`redirects-map.json` → Edge middleware** path shipped in S253/D1.

> **Architecture (do not deviate):** redirects are a **build-time bundled JSON
> projection**, NOT Vercel Edge Config and NOT a per-request DB call in
> middleware. Middleware resolves the tenant slug by pure hostname parsing and
> touches no database; redirect rows are authored once at cutover (a deploy-gated
> event), so a static projection is the correct shape. Postgres
> (`public.tenant_redirects`) is the single source of truth; `redirects-map.json`
> is a derived artifact regenerated on every build by
> `scripts/generate-redirects-map.mjs` (the npm `prebuild` step).

### Schema — `public.tenant_redirects`

| Column        | Notes                                                          |
|---------------|----------------------------------------------------------------|
| `tenant_id`   | FK → `tenants.id`. Scopes the redirect to this customer.        |
| `from_path`   | Old path. **Must start with `/`** (DB CHECK). e.g. `/ant-control/` |
| `to_path`     | New destination path on the shell. e.g. `/services/ants`        |
| `status_code` | `301 \| 302 \| 307 \| 308`. **Default `308`** (preserves HTTP method; Google treats it identically to 301 for link equity). |

`UNIQUE (tenant_id, from_path)` — one redirect per old path per tenant.

### Steps

1. **Finish Phase 6 discovery.** You should have
   `docs/customers/<slug>/discovery/redirect-map.csv` with `old_url, new_url,
   http_status` rows, reviewed and signed off by Scott for the HIGH-priority
   (top-20-clicks) URLs.

2. **Insert one row per redirect** into `public.tenant_redirects`, keyed by the
   customer's `tenant_id`. Use `ON CONFLICT (tenant_id, from_path) DO UPDATE` so
   re-runs are idempotent. Example:

   ```sql
   insert into public.tenant_redirects (tenant_id, from_path, to_path, status_code)
   values
     ('<tenant_id>', '/ant-control/',      '/services/ants',          308),
     ('<tenant_id>', '/termites',          '/services/termite-control', 308),
     ('<tenant_id>', '/austin-pest',       '/service-areas/austin',   308)
   on conflict (tenant_id, from_path) do update
     set to_path = excluded.to_path, status_code = excluded.status_code;
   ```

   RLS already isolates rows per tenant; the Ironwood operator (master tenant
   `9215b06b-3eb5-49a1-a16e-7ff214bf6783`) may write any tenant's rows.

3. **Path normalization is automatic — author paths as they appear.** The build
   step decodes percent-encoding once and canonicalizes each `from_path` key
   (leading slash, collapses `//` → `/`, strips a non-root trailing slash,
   lowercases) so it matches the already-decoded incoming request path. You do
   not need to pre-normalize. `to_path` is stored as authored (it becomes a URL),
   so set the exact destination you want.

4. **Deploy.** The redirect map is **bundled at build time, so redirects are NOT
   live until a deploy runs.** Because shell cutover is deploy-gated anyway, the
   cutover deploy is what regenerates `redirects-map.json` and ships the
   redirects. The build needs `SUPABASE_SERVICE_ROLE_KEY` (and
   `SUPABASE_URL`/`VITE_SUPABASE_URL`) set in the Vercel project (production
   scope); if absent the build emits an empty map and logs a warning rather than
   failing.

5. **Verify after the deploy is READY.** Spot-test the HIGH-priority redirects:

   ```
   curl -I https://<slug>.pestflowpro.ai/<old_path>
   # expect: 308 (or the row's status) with Location: <to_path>, query string preserved
   ```

   UTM/tracking query params on the incoming request are re-appended to the
   destination automatically.

### What changed from older docs

Earlier discovery/onboarding notes treated the shared-shell redirect mechanism
as an "open question" / known gap and suggested pasting redirects into
`vercel.json`. That is **superseded** for `rebuild_on_shell` customers: do not
edit `vercel.json` for shell redirects — author rows in `public.tenant_redirects`
instead. (`vercel.json` redirects remain correct for standalone `custom_build` /
`clone` customers in their own repo.)

### Rollback

The reversal SQL for the table itself is staged at
`docs/migrations/s253-d1-tenant-redirects-rollback.sql`. To undo a bad cutover
without dropping the table, `DELETE` the offending rows and redeploy.
