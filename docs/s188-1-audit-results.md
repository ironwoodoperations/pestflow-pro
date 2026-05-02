# S188 Tenant Fossil Audit Results

## Summary
- Total hits: 23
- By category: A: 1, B: 11, C: 2, D: 3, E: 3, F: 10, G: 0
- Files touched: 15 unique source files (src + supabase functions + migrations)

---

## Existing tenant-resolution infrastructure

- TenantBootProvider lives at: `/workspaces/pestflow-pro/src/context/TenantBootProvider.tsx`
- useTenant (hook) lives at: `/workspaces/pestflow-pro/src/hooks/useTenant.ts`
- useTenantBoot (context hook) lives at: same `TenantBootProvider.tsx` file (exported alongside the provider)
- subdomainRouter lives at: `/workspaces/pestflow-pro/src/lib/subdomainRouter.ts`
- tenant.ts shim lives at: `/workspaces/pestflow-pro/src/lib/tenant.ts`

**Provider gates render:** Yes — `TenantBootProvider` returns `<TenantBootSkeleton />` when `status === 'loading'`. Children do NOT render until tenant is resolved. Exception: admin/ironwood paths (`isAdminPath()`) skip the boot fetch entirely and start with `status: 'idle'`.

**Resolution sources:**
1. `?tenant=<slug>` query param (dev/preview testing)
2. Custom domain match via `tenant_domains` table (verified only)
3. `*.pestflowpro.com` subdomain slug lookup
4. `VITE_TENANT_ID` env var fallback (localhost / root domain)

**localStorage keys:**
- `pfp_tenant_boot_v2:<hostname>` — full boot payload (id, slug, name, theme, colors, logo, cta_text)
- `pf_tenant_id` — written by `setTenantId()` in `src/lib/tenant.ts` (appears unused as a read path)

**Two separate hook flavors:**

`useTenant()` in `src/hooks/useTenant.ts` (OLD pattern — does its own async resolve):
```typescript
export function useTenant() {
  const [tenantId, setTenantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  // ...calls resolveTenantId() in useEffect...
  return { tenantId, loading }
}
```
Return type: `{ tenantId: string; loading: boolean }`

`useTenant()` in `src/context/TenantBootProvider.tsx` (NEW pattern — reads from context):
```typescript
export function useTenant(): TenantBoot {
  const { tenant, status } = useTenantBoot()
  if (!tenant || status !== 'ready') throw new Error('useTenant called before boot is ready')
  return tenant
}
```
Return type: `TenantBoot`

```typescript
export type TenantBoot = {
  id: string; slug: string; name: string; template: string
  primaryColor: string; accentColor: string; logoUrl: string | null; ctaText: string
}
```

**Critical discrepancy:** There are TWO exports named `useTenant()` — one in `src/hooks/useTenant.ts` (returns `{ tenantId, loading }`) and one in `src/context/TenantBootProvider.tsx` (returns `TenantBoot`). Components that import from `../hooks/useTenant` get the OLD hook that calls `resolveTenantId()` async — which falls back to `VITE_TENANT_ID` (= the demo UUID `9215b06b...`) on localhost but also on any domain where the subdomain lookup fails or is slow.

---

## Hits by category

### A — RESOLVER DEFAULT
- `src/lib/subdomainRouter.ts:27` — `const fallback = (import.meta.env.VITE_TENANT_ID as string) || ''` — this is the legitimate last-resort fallback used when hostname is `localhost`, `*.vercel.app`, or subdomain lookup fails. The problem: `VITE_TENANT_ID` is hardcoded to `9215b06b...` in `.env.local`, meaning ANY failed subdomain resolution silently queries the demo tenant.

### B — DIRECT DATA FETCH
These files import `VITE_TENANT_ID` at module-top as a constant and pass it directly to Supabase queries. They do NOT use `useTenant` or wait for async resolution — the constant is baked in at module load time. On `dang.pestflowpro.com`, if `VITE_TENANT_ID` is bundled as `9215b06b...` at build time, every query hits the wrong tenant.

- `src/components/admin/social/useSocialData.ts:4,55,56,57` — `const TENANT_ID = import.meta.env.VITE_TENANT_ID` used in three live Supabase queries: `social_posts`, `social_campaigns`, and `settings.integrations`. Called on component mount. High-risk: loads wrong tenant's social data.
- `src/components/admin/social/ContentQueueTab.tsx:12` — `const TENANT_ID = import.meta.env.VITE_TENANT_ID` used in post status updates: approve, bulk-approve, archive, and restore operations. Critical: mutations write to wrong tenant.
- `src/hooks/useLeadNotifications.ts:4,21,34,48` — `const TENANT_ID = import.meta.env.VITE_TENANT_ID` used in `leads` table fetch and `setInterval` polling (every 60s) and `markAsContacted` mutation. Runs at admin dashboard boot. High-risk: cross-tenant lead data leak + write.
- `src/hooks/useGoogleAnalytics.ts:4,13` — `const TENANT_ID = import.meta.env.VITE_TENANT_ID` used to fetch `settings.integrations` for `google_analytics_id`. Runs at boot via `useEffect`. Injects wrong tenant's GA ID into `<head>`.
- `src/components/admin/SocialTab.tsx:17` — `const TENANT_ID = import.meta.env.VITE_TENANT_ID` — declared at module top; used in queries within the component (integrations fetch). Delegates heavy lifting to `useSocialData` (also broken).
- `src/components/admin/dashboard/DashboardSeoWidget.tsx:1,30` — `const TENANT_ID = import.meta.env.VITE_TENANT_ID` used as localStorage key suffix `lighthouse_score_${TENANT_ID}`. Not a Supabase query but will read/write the wrong tenant's cached SEO scores.
- `src/components/ironwood/IronwoodSEO.tsx:6,46,47,76,78` — `const DEMO_TENANT = '9215b06b...'` literal used in two Supabase queries (settings + seo_meta load) and two upserts. This is Ironwood-only (Scott's admin panel); intentional use for PestFlow Pro's own marketing site SEO — NOT a cross-tenant bug, but the hardcoding is fragile.
- `src/components/ironwood/IronwoodSEOPageCard.tsx:5,21` — `const DEMO_TENANT = '9215b06b...'` literal used in `seo_meta` upsert. Same as above — Ironwood panel, intentional scope.

### C — FEATURE GATE
- `src/components/admin/settings/SettingsTab.tsx:12,20` — `const IRONWOOD_TENANT_ID = '9215b06b...'` then `const isIronwood = tenantId === IRONWOOD_TENANT_ID` — uses `useTenant()` from the OLD hook (`src/hooks/useTenant.ts`, returns `{ tenantId }`). Gate shows/hides the "Domain" settings tab for Ironwood-only. If `tenantId` resolves incorrectly to the demo UUID (via fallback), the Domain tab would incorrectly appear for any tenant.
- `src/components/admin/dashboard/DashboardHome.tsx:11,102` — `const DEMO_TENANT_ID = '9215b06b...'` then `{tenantId === DEMO_TENANT_ID && ...}` — compares to `tenantId` from `useTenant()` (OLD hook). Shows `<DemoControls>` only for the demo tenant. Since `DashboardHome` also queries leads via `tenantId` from the same hook, this is secondary risk (the query on line 43 is correct; only the gate comparison could misfire).

### D — RETIRED TOOL CODE
These are in active (non-archived) code paths with live logic that references retired integrations.

- `src/components/admin/social/useSocialData.ts:39` — `active_social_provider?: 'export' | 'diy' | 'buffer' | 'bundle' | 'full_auto'` — type definition in the live `IntegrationSettings` interface includes `'buffer'` as a valid enum value, consumed by `AnalyticsTab.tsx:31`. Buffer is a retired integration but the type still routes display logic around it.
- `supabase/functions/publish-scheduled-posts/index.ts:49,187-207` — `ayrshare_api_key` field in integration type and a live `if (intg.ayrshare_api_key)` branch that makes real HTTP calls to `app.ayrshare.com/api/post`. This is an active code path in a deployed edge function. Ayrshare is listed as a legacy fallback but the code executes.
- `supabase/functions/provision-tenant/index.ts:272` — `ayrshare_api_key: ''` written to every new tenant's `integrations` settings row on provisioning. New tenants get a vestigial `ayrshare_api_key` field in their settings.

### E — RETIRED TOOL TYPE/COMMENT
- `src/components/ironwood/IronwoodSocial.tsx:3` — comment block: `// (9215b06b... / slug: pestflow-pro)` — documentation comment, no runtime effect.
- `src/components/admin/settings/_archived_IntegrationsSection.tsx` — entire file is prefixed `_archived_` and not imported anywhere (confirmed by grep). Contains `pexels_api_key`, `buffer_access_token`, Pexels UI, and Buffer UI. Dead code — no risk.
- `src/pages/terms-content.ts:17,86` — references "Buffer" in legal copy strings (plan features table and third-party integrations clause). No runtime behavior.
- `src/pages/privacy-content.ts:69` — "Buffer: Multi-platform social publishing when you connect your Buffer account" in privacy policy text. No runtime behavior.
- `src/components/admin/dashboard/DashboardPlanSection.tsx:48` — `'Buffer multi-platform posting'` in a plan feature display array. Shown in the admin plan section as a feature name. No data fetch.
- `supabase/functions/provision-tenant/index.ts:269` — `pexels_api_key: ''` seeded in new tenant integrations row. Vestigial field, no active behavior unless `useSocialData` or `useComposer` reads it (they do check for it but only to conditionally enable Pexels search — which is still an active feature in `useComposer.ts`).

### F — TEST/MIGRATION/SEED
- `supabase/migrations/20260406_s61_seed_missing_page_content.sql:5-12` — 8 rows inserted for the demo tenant UUID into `page_content`. Applied migration, cannot be modified.
- `supabase/migrations/20260414_ironwood_admin_settings_write_bypass.sql:9,12` — Two RLS policy conditions `current_tenant_id() = '9215b06b...'`. Applied migration. These are legitimate RLS bypass rules for the Ironwood admin; changing them would break Scott's admin write access.

### G — UNKNOWN
None.

---

## Risk notes

**Cross-tenant data leak risk (HIGH):**
- `src/hooks/useLeadNotifications.ts` — polls `leads` table every 60 seconds using `VITE_TENANT_ID`. On a real client subdomain where `VITE_TENANT_ID` is bundled as `9215b06b...` at build time, this would continuously expose the demo tenant's leads to the wrong admin dashboard, and the `markAsContacted` mutation would write status changes to the demo tenant's lead records.
- `src/components/admin/social/useSocialData.ts` — fetches `social_posts`, `social_campaigns`, and `settings.integrations` on mount using the wrong tenant ID. Exposes demo social data to every client admin.
- `src/components/admin/social/ContentQueueTab.tsx` — writes post status mutations (approve, archive, restore) with the wrong tenant ID guard. Cross-tenant write risk.

**Runs at boot/load (not on-demand):**
- `src/hooks/useGoogleAnalytics.ts` — fires once on initial admin app mount via `useEffect([], [])`. Injects wrong GA tracking ID into page.
- `src/hooks/useLeadNotifications.ts` — fires on mount AND sets a 60-second polling interval.
- `src/components/admin/social/useSocialData.ts` — fires on `SocialTab` mount.

**Root cause of the production bug:**
`VITE_TENANT_ID` is a build-time constant (`import.meta.env.VITE_TENANT_ID`). It is baked into the compiled JS bundle at build time. If the Vercel deployment bakes in `9215b06b...` as the env var value, then every client subdomain (`dang.pestflowpro.com`, etc.) running that same bundle will have `TENANT_ID = '9215b06b...'` hardcoded in the compiled output. The files using this pattern bypass the runtime subdomain resolution entirely.

The correct pattern is to call `useTenant()` from `src/context/TenantBootProvider.tsx` (returns `TenantBoot.id`) or `useTenant()` from `src/hooks/useTenant.ts` (returns `{ tenantId }` resolved at runtime via `resolveTenantId()`). Six files skip both patterns and use a build-time constant instead.

---

## Open questions for human review

1. **`VITE_TENANT_ID` in Vercel env vars** — What is the value set in Vercel's production environment variables? If it is `9215b06b...`, then ALL of the Category B hits become instant cross-tenant leaks for every deployed client. If Vercel's env var is empty/unset, the behavior in `subdomainRouter.ts` is `fallback = ''` (returns empty string), which would cause queries to fail with RLS errors rather than silently return wrong data.

2. **Two `useTenant` exports** — `src/hooks/useTenant.ts` and `src/context/TenantBootProvider.tsx` both export a function named `useTenant()` with different return shapes. `SettingsTab.tsx` and `DashboardHome.tsx` both import from `../hooks/useTenant` (old hook). Which is the canonical going-forward hook? The old hook does async resolution but shares no state with TenantBootProvider.

3. **`BundleSocialSetup.tsx`** — The component name contains "Bundle" but it is actually a Zernio account status panel (not Ayrshare/bundle_social). The grep matched on the component name, not a retired tool reference. This is safe — no action needed.

4. **Pexels in active feature** — `useComposer.ts` reads `pexels_api_key` from settings and makes live Pexels API calls. `PestImagePicker.tsx` also calls Pexels. These are active features (not retired). The "pexels" grep hits in these files are expected/intentional. Only the mentions in `_archived_IntegrationsSection.tsx` are truly retired. Confirm whether Pexels integration is intentionally kept or should be phased out.

5. **`publish-scheduled-posts` Ayrshare branch** — This is a deployed edge function with an active `if (intg.ayrshare_api_key)` code path. No tenant currently has `ayrshare_api_key` set (seeded as empty string), so it is dormant but not removed. If left in place, any tenant settings write that accidentally sets this field would activate the legacy Ayrshare path.
