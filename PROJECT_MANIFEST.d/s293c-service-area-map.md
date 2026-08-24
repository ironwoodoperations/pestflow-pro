# Session log — branch `s293c-service-area-map`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-24 15:53 UTC
- Branch: `s293c-service-area-map`
- Commit: `3ea99eb` — task[S293-C]: service-area map — markers on the tenant's own cities
- Author: Claude
- Files changed:
  - app/tenant/[slug]/_components/ServiceAreaMap.tsx
  - app/tenant/[slug]/_components/ServiceAreaPage.tsx
  - app/tenant/[slug]/_components/__tests__/ServiceAreaMap.test.tsx
  - app/tenant/[slug]/_lib/queries.ts
  - app/tenant/[slug]/service-area/page.tsx
  - shared/lib/serviceAreaMap.test.ts
  - shared/lib/serviceAreaMap.ts
  - shared/lib/signStaticMapUrl.ts
  - src/components/admin/LocationsTab.tsx
  - src/lib/service-areas/refreshServiceAreaMap.test.ts
  - src/lib/service-areas/refreshServiceAreaMap.ts
  - supabase/functions/service-area-map/index.ts
  - supabase/migrations/20260824160000_s293c_service_area_coordinates.sql
- PR: #290 (draft) — https://github.com/ironwoodoperations/pestflow-pro/pull/290
- Next recommended action: PR #290 ships NOTHING VISIBLE until three things are
  done by hand, in this order:
    1. Apply `supabase/migrations/20260824160000_s293c_service_area_coordinates.sql`
       via MCP. It adds latitude/longitude AND replaces the `location_data`
       view — the view is the part that is easy to miss, because the public
       render path reads it and it enumerates its columns.
    2. Add `GOOGLE_MAPS_STATIC_KEY` and `GOOGLE_MAPS_SIGNING_SECRET` to Edge
       Function Secrets.
    3. Deploy `supabase/functions/service-area-map` via the Supabase CLI, then
       verify with `get_edge_function`. THIS IS WHERE THE ONE UNVERIFIED THING
       SURFACES: it is the first edge function in the repo to import from
       `shared/lib/`. esbuild resolves the graph, but that is a parse check,
       not a deploy test. If the CLI's bundler excludes files outside
       `supabase/functions/`, add a re-export shim under `_shared/`.
  Until then every tenant renders no map, which is the correct absent-data
  behaviour and is what the Vercel preview shows.
- Open decision blocking other work: Dang has TWO conflicting coordinate sets —
  `business_info` (32.2692, -95.2603) vs `integrations.google_business_*`
  (32.246042, -95.2952175), ~2 miles apart. This PR pins no business address so
  it is not blocked, but which is canonical must be settled before anything maps
  a business location.
- Reported, not fixed (each is its own PR): `ServiceAreaPage.tsx:78`
  `aria-label="Pest control in ..."` hardcoded trade in the public shell;
  `src/components/StructuredData.tsx:29` `areaServed: 'East Texas'`;
  `src/components/common/GoogleMapEmbed.tsx` dead code holding a browser-exposed
  `VITE_GOOGLE_MAPS_API_KEY`; and the `tsconfig.app.json` cleanup carried from
  PR B (37 errors, CI does not typecheck `src/` at all).
