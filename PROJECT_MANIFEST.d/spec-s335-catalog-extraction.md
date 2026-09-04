# Session log — branch `spec/s335-catalog-extraction`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-09-04 17:10 UTC
- Branch: `spec/s335-catalog-extraction`
- Commit: `1cf6f45` — S335: extract the service catalog to shared/lib; record the tenant_services migration
- Author: Claude
- Files changed:
  - app/tenant/[slug]/_lib/serviceData.ts
  - shared/lib/serviceCatalog.ts
  - src/lib/__tests__/adminVerticalPreset.test.ts
  - src/lib/__tests__/serviceCatalog.test.ts
  - src/lib/adminVerticalPreset.ts
  - supabase/functions/_shared/provisioningSeed.test.ts
  - supabase/functions/_shared/provisioningSeed.ts
  - supabase/migrations/s335_tenant_services_inert.sql
  - supabase/migrations/s335_tenant_services_inert_rollback.sql
- Next recommended action: **Build-order step 2 — the `merge_setting_value` PL/pgSQL
  helper**, per-key policy (NOT a generic deep merge: it would corrupt `hours_structured`
  and could assemble a partial address quad that 23514s), tested against the SAME fixture
  corpus as the TypeScript helper in `shared/lib/settingsMerge.ts`. Independent of step 1
  and cannot affect the live pls tenant.
- Carried from S335, do not re-derive:
  - `shared/lib/serviceCatalog.ts` is THE catalog. Three consumers import it; tests assert
    reference IDENTITY, so a re-copied literal fails. Do not restate slugs anywhere.
  - `public.tenant_services` is live, seeded (77 rows / 7 tenants), RLS on with ZERO
    policies, and INERT. Policies land WITH the read path, under a validator gate.
  - Merging #343 fires redeploy-edge-on-shared-change.yml (16 functions). `provision-tenant`
    is NOT on that list, so its deployed bundle keeps the old seed until deployed on purpose.
  - Lawn titles are borrowed from LAWN_CONTENT_MAP.displayName and pinned by a test. REVIEW
    them as page titles if/when SEED_VERTICALS widens — a display name is not a page title.
  - Still LAST: S323 PR C. The vertical CHECK still rejects 'lawn'.
