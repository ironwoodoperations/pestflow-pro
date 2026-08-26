# Session log — branch `feat/s300-pls-turf-swap`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-26 16:58 UTC
- Branch: `feat/s300-pls-turf-swap`
- Commit: `91c05ef` — feat(s300): artificial-turf replaces retaining-walls across seven surfaces
- Author: Claude
- Files changed:
  - app/tenant/[slug]/page.tsx
  - scripts/generate-authority-backfill.ts
  - src/lib/__tests__/adminVerticalPreset.test.ts
  - src/lib/__tests__/irrigationServiceSurfaces.test.ts
  - src/lib/adminVerticalPreset.ts
  - supabase/functions/_shared/authorityPrompts.test.ts
  - supabase/functions/_shared/provisioningSeed.test.ts
  - supabase/functions/_shared/provisioningSeed.ts
- Open item: `IRRIGATION_CONTENT_MAP` still holds `retaining-walls`. The turf
  entry is blocked on five owner facts (product and pile, base prep, infill,
  specialty work, warranty). Named as a self-retiring exception in
  `src/lib/__tests__/irrigationServiceSurfaces.test.ts`.
- Next recommended action: write the content entry once the facts land, THEN
  the `page_content` row, THEN the `tenant_redirects` 301. That order is
  load-bearing: the router's irrigation slug set is derived from the content
  map (`serviceData.ts`) and the home tile is filtered against `page_content`,
  so a DB row added first makes the tile appear pointing at a 404.
