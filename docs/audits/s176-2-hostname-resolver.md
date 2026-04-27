# S176.2 — Hostname → tenant_id Resolver

## Punchline
The resolver is **split across two separate code paths** that each handle part of the
problem. `subdomainRouter.ts` is the correct canonical resolver (has custom domain
support), but `TenantBootProvider.tsx` — the boot-time path that runs first — uses
its own naive `HOST.split('.')[0]` slug extraction and **bypasses `subdomainRouter`
entirely**. Phase 5 cutover to `dangpestcontrol.com` requires fixing the boot path,
not just the component path.

---

## Subdomain pattern (current production for `dang.pestflowpro.com`)

### Boot path (runs first, before React renders)

**`index.html` lines 4–27** — inline `<script>` block. Pure localStorage read, no Supabase call:

```html
<!-- index.html:4-27 -->
(function() {
  try {
    var host = window.location.hostname;                      // line 7
    var key = 'pfp_tenant_boot_v2:' + host;                  // line 8
    var raw = localStorage.getItem(key);                      // line 9
    if (raw) {
      var t = JSON.parse(raw);
      if (t && t.primary_color) {
        // applies CSS vars to document.documentElement         lines 13-21
        if (t.id) window.__TENANT_BOOT__ = t;                // line 23
      }
    }
  } catch(e) {}
})();
```

- Cache key: `pfp_tenant_boot_v2:<window.location.hostname>` (exact hostname, not slug)
- No TTL — stale forever until explicitly cleared
- On cache hit: sets CSS vars + `window.__TENANT_BOOT__` — **no Supabase call**
- On cache miss: no action; React picks up the blank state on mount

**Cache invalidation:** `BrandingHeroMedia.tsx:112` and `BrandingSection.tsx:73` clear the key on admin save:
```ts
localStorage.removeItem(`pfp_tenant_boot_v2:${window.location.hostname}`)
delete (window as any).__TENANT_BOOT__
```

### TenantBootProvider — React boot (runs on cache miss)

**`src/context/TenantBootProvider.tsx`** — the React-level boot component:

- Line 16: `const CACHE_KEY = 'pfp_tenant_boot_v2:' + HOST` (HOST = `window.location.hostname`)
- Line 25–33 `readCache()`: checks `window.__TENANT_BOOT__` first, then localStorage. Returns mapped `TenantBoot` or null.
- Line 36–41 `writeCache()`: writes raw RPC response to both localStorage and `window.__TENANT_BOOT__`
- Line 67–68: **slug extraction** — `const slug = HOST.split('.')[0]` — takes the first `.`-segment with NO `.pestflowpro.com` check
- Line 68–79: on cache miss, calls `supabase.rpc('get_tenant_boot', { slug_param: slug })`
  - On success: calls `applyTheme()`, `writeCache()`, `prefetchAllPageContent()`
  - On failure: sets `status = 'error'`

**Critical gap:** for `dangpestcontrol.com`, `HOST.split('.')[0]` returns `"dangpestcontrol"`.
The RPC lookup `get_tenant_boot({ slug_param: 'dangpestcontrol' })` finds no tenant → boot error.
`TenantBootProvider` has **no custom domain fallback branch**.

### Component path (runs after boot)

**Step 1 — hostname extraction:**
- File: `src/lib/subdomainRouter.ts:8–16`
- Function: `getPestflowSubdomain()` — checks `hostname.endsWith('.pestflowpro.com')`, splits on `.`, returns `parts[0]` if `parts.length === 3`, else `null`
- For `dang.pestflowpro.com` → returns `"dang"`
- For `dangpestcontrol.com` → returns `null` (falls through to custom domain path)

**Step 2 — slug match:**
- File: `src/lib/subdomainRouter.ts:59–70`
- Query: `supabase.from('tenants').select('id').eq('slug', subdomain).maybeSingle()`
- On hit: returns `data.id`
- On miss: returns `fallback` (VITE_TENANT_ID env var)

**Step 3 — cache write:**
- The component path (`resolveTenantId`) does NOT write to localStorage — it returns a bare string `tenant_id` on every call
- Cache is written only by `TenantBootProvider.writeCache()` at line 37–41
- localStorage key: `pfp_tenant_boot_v2:<window.location.hostname>`
- TTL: **none** — persists until cleared by admin save or browser clear

---

## Custom domain pattern (post-Phase-5 for `dangpestcontrol.com`)

### Component path (subdomainRouter) — works correctly

**Step 1 — hostname detection:**
- File: `src/lib/subdomainRouter.ts:41–43`
- Logic: `isPestflowDomain = hostname === 'pestflowpro.com' || hostname.endsWith('.pestflowpro.com')`
- If NOT pestflowpro.com and NOT localhost/vercel.app → enters custom domain branch

**Step 2 — tenant_domains query:**
- File: `src/lib/subdomainRouter.ts:45–52`
```ts
const { data } = await supabase
  .from('tenant_domains')
  .select('tenant_id')
  .eq('custom_domain', hostname)   // exact match on full hostname
  .eq('verified', true)            // verified filter IS present client-side
  .maybeSingle()
```
- Returns `data.tenant_id` directly — no secondary `tenants` row fetch needed

**Step 3 — tenants row:**
- Not fetched by `resolveTenantId()` — it returns only `tenant_id`
- Individual components call their own Supabase queries keyed on the returned `tenant_id`

**Boot path (TenantBootProvider) — does NOT work for custom domains:**
- File: `src/context/TenantBootProvider.tsx:67–68`
- Uses `HOST.split('.')[0]` as slug → yields `"dangpestcontrol"` for `dangpestcontrol.com`
- Calls `get_tenant_boot({ slug_param: 'dangpestcontrol' })` → no match → boot error
- **There is no custom domain branch in TenantBootProvider**

---

## Inline boot script (index.html)

```html
<!-- index.html:4-27 — runs synchronously before React bundle -->
<script>
  (function() {
    try {
      var host = window.location.hostname;
      var key = 'pfp_tenant_boot_v2:' + host;
      var raw = localStorage.getItem(key);
      if (raw) {
        var t = JSON.parse(raw);
        if (t && t.primary_color) {
          var r = document.documentElement;
          r.style.setProperty('--color-primary', t.primary_color);
          r.style.setProperty('--color-accent', t.accent_color || '#f59e0b');
          r.style.setProperty('--color-nav-bg', t.primary_color);
          r.style.setProperty('--color-footer-bg', t.primary_color);
          r.style.setProperty('--color-btn-bg', t.accent_color || '#f59e0b');
          r.style.setProperty('--color-bg-hero', t.primary_color);
          r.style.setProperty('--color-heading', t.primary_color);
          r.style.setProperty('--color-nav-text', '#ffffff');
          r.style.setProperty('--color-footer-text', '#ffffff');
          if (t.id) window.__TENANT_BOOT__ = t;
        }
      }
    } catch(e) {}
  })();
</script>
```

Note: this script applies only a subset of CSS vars (no `--font-heading`, `--font-body`,
etc.). The full `applyTheme()` call happens in `TenantBootProvider:56` after React mounts.

---

## Title-update path (Vite SPA)

Two mechanisms exist — neither is Helmet-based for the main shell:

**General shell (non-Dang):**
- File: `src/components/seo/SEOHead.tsx:91–93`
- Mechanism: `useEffect(() => { document.title = fullTitle }, ...)` — direct DOM mutation
- `fullTitle` is computed client-side from `businessInfo.name` + page type
- Canonical URL hardcodes `https://${tenantSlug}.pestflowpro.com` at line 81 — **will be wrong for custom domains**

**Dang shell specifically:**
- File: `src/shells/dang/SEO.tsx:1–36`
- Mechanism: `react-helmet-async` — `<Helmet><title>{fullTitle}</title></Helmet>`
- The Dang shell has its own SEO component separate from the main SEOHead

---

## Middleware (S175.A anchor)

- File: `middleware.ts` (repo root)
- `extractSubdomain` definition: `middleware.ts:8`
- Full function (lines 8–26):

```ts
function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
  if (APEX_HOSTS.has(hostname)) return null;                // pestflowpro.com / www.pestflowpro.com
  if (hostname.endsWith('.pestflowpro.com')) {
    const sub = hostname.slice(0, -'.pestflowpro.com'.length);
    if (!sub || sub === 'www') return null;
    return sub;
  }
  // Local dev: e.g. pestflow-pro.localhost:3000
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    return sub || null;
  }
  return null;                                              // custom domains fall here
}
```

**Behavior for non-`*.pestflowpro.com` hostnames:** returns `null`.
When `slug` is null AND request is not already `/admin`:
- `middleware.ts:41–43`: rewrites to `/_admin/index.html` (Vite SPA)
- Result: `dangpestcontrol.com` → Vite SPA served → TenantBootProvider boot fails (see above)

**`dang` hardcode:** `middleware.ts:51–53`:
```ts
if (slug === 'dang') {
  return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
}
```
This intercepts `dang.pestflowpro.com` before the Next.js RSC path. It is the
only tenant-specific guard in the codebase.

**Current custom domain handling:** none. Middleware has no `tenant_domains` lookup.

**Phase 5 implication:** To route `dangpestcontrol.com` to the Next.js RSC path,
middleware needs two changes:
1. When `extractSubdomain` returns `null` (i.e., not a `*.pestflowpro.com` host),
   query `tenant_domains` to get the `slug`, then rewrite to `/tenant/${slug}${pathname}`
2. The middleware query must use the service-role key (not anon) or rely on RLS
   policy `anon_read_verified` — either way, the `verified = true` filter must be
   applied to avoid serving unverified/pending domains.
Alternatively, a simpler Phase 5 approach: keep Dang on the Vite SPA path but fix
`TenantBootProvider` to handle custom domains before removing the `slug === 'dang'` guard.

---

## Sanity check (DB)

**`tenants` row for slug `dang`:**
```
id: 1611b16f-381b-4d4f-ba3a-fbde56ad425b
slug: dang
```
Matches stable identifier. Confirmed.

**`tenant_domains` for Dang (`tenant_id = 1611b16f-...`):**
```
custom_domain: dangpestcontrol.com       verified: false
custom_domain: www.dangpestcontrol.com   verified: false
```
Both rows exist. Both `verified = false` — correct pre-Phase-5 state. The
`subdomainRouter.ts` custom domain path (line 49: `.eq('verified', true)`) would
correctly skip these rows today and fall through to the subdomain branch.

---

## Open questions

1. **`get_tenant_boot` RPC signature:** The `TenantBootProvider` calls
   `supabase.rpc('get_tenant_boot', { slug_param: slug })`. The RPC is not audited
   here — what columns does it return? Does it support any form of custom domain
   lookup (e.g., a `hostname_param`)? If it already has that param, the
   `TenantBootProvider` fix is a one-line change. If not, a new RPC overload or a
   second query is needed.

2. **localStorage key mismatch at custom domain cutover:** After Phase 5,
   `dang.pestflowpro.com` and `dangpestcontrol.com` are different hostnames → different
   cache keys → separate localStorage entries. A visitor who cached on the subdomain
   will trigger a full re-boot on the custom domain. Not a bug, but worth knowing.

3. **`SEOHead.tsx:81` canonical URL** hardcodes `https://${tenantSlug}.pestflowpro.com`
   — post-Phase-5, this canonical will point back to the `*.pestflowpro.com` subdomain
   instead of the custom domain. This is a separate SEO defect that Phase 5 needs to
   address.

4. **`SlugRouter.tsx`** (`src/pages/SlugRouter.tsx:78–82`) has its own `tenant_domains`
   lookup (lines 81–88) — a third code path for resolving tenant by custom domain,
   separate from both `subdomainRouter.ts` and `TenantBootProvider`. The three paths
   should be consolidated before Phase 5.

5. **Is the localStorage cache TTL'd?** No TTL found in any write path. The only
   invalidation is the explicit `removeItem` call in admin save handlers. A stale boot
   cache on a customer's device would persist indefinitely after a tenant rebrand.
