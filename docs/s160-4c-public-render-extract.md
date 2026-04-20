# S160.4c — public-site render + revalidate extract

## File locations (from step 1)

```
app/api/revalidate/route.ts
app/tenant/[slug]/layout.tsx          ← shell-selection logic lives here
app/tenant/[slug]/page.tsx            ← tenant.template branch logic lives here
app/tenant/[slug]/(all other pages)   ← inherit layout
shared/lib/tenant/resolve.ts          ← resolveTenantBySlug — reads settings.branding
app/_lib/cacheTags.ts
src/lib/revalidate.ts                 ← triggerRevalidate client helper
src/context/TenantBootProvider.tsx    ← admin SPA boot (separate from Next.js path)
src/lib/shellThemes.ts                ← applyTheme (admin SPA only)
```

---

## revalidate route handler — full source
### `app/api/revalidate/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { cacheTags, type RevalidatePayload } from '../../_lib/cacheTags';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // 1. Extract JWT
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
  }

  // 2. Verify JWT
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: 'invalid_jwt' }, { status: 401 });
  }

  // 3. Parse body
  let body: RevalidatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.type || !body.tenantId || !body.tenantSlug) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // 4. Verify tenant admin membership
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: membership } = await serviceClient
    .from('tenant_users')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('tenant_id', body.tenantId)
    .maybeSingle();

  if (!membership || !['admin', 'owner'].includes(membership.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 5. Revalidate by tag + bust Full Route Cache
  if (body.type === 'settings') {
    revalidateTag(cacheTags.settings(body.tenantId));
    revalidatePath('/tenant/[slug]', 'layout');       // ← bracket form, layout scope
  }
  // (other types omitted for brevity — all use same revalidatePath pattern)

  return NextResponse.json({ ok: true });
}
```

---

## triggerRevalidate client helper — full source
### `src/lib/revalidate.ts`

```ts
type Payload =
  | { type: 'page'; tenantId: string; slug: string }
  | { type: 'settings'; tenantId: string }
  | ...;

function getTenantSlug(): string {
  try {
    return window.location.hostname.split('.')[0];
  } catch {
    return '';
  }
}

export async function triggerRevalidate(
  payload: Payload,
  accessToken: string
): Promise<boolean> {
  const body = { ...payload, tenantSlug: getTenantSlug() };
  try {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[revalidate] non-ok ${res.status}`, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[revalidate] call failed:', err);
    return false;
  }
}
```

Note: `Payload` type doesn't declare `tenantSlug` — it's added dynamically at the call site (`body = { ...payload, tenantSlug: getTenantSlug() }`). The route handler requires `tenantSlug` in the body check on line 33. This is consistent.

---

## Tenant resolver — full source (THE CRITICAL FILE)
### `shared/lib/tenant/resolve.ts`

```ts
import { cache } from 'react';
import { getServerSupabaseForISR } from '../supabase/server';
import type { Tenant } from './types';

async function resolveSettings(tenantBase: { id: string; slug: string; name: string }): Promise<Tenant> {
  const supabase = getServerSupabaseForISR();
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('tenant_id', tenantBase.id)
    .in('key', ['branding', 'business_info', 'seo']);

  const byKey = Object.fromEntries(
    (settings ?? []).map((r) => [r.key, r.value ?? {}])
  );
  const branding = byKey.branding ?? {};
  const business = byKey.business_info ?? {};
  const seo = byKey.seo ?? {};

  return {
    id: tenantBase.id,
    slug: tenantBase.slug,
    name: tenantBase.name,

    template: branding.template ?? 'modern-pro',      // ← LINE 29 — reads 'template' key
    primary_color: branding.primary_color ?? '#111111',
    accent_color:  branding.accent_color  ?? '#f97316',
    logo_url:      branding.logo_url      ?? null,
    favicon_url:   branding.favicon_url   ?? null,
    cta_text:      branding.cta_text      ?? null,

    business_name:    business.name           ?? null,
    phone:            business.phone          ?? null,
    email:            business.email          ?? null,
    address:          business.address        ?? null,
    hours:            business.hours          ?? null,
    tagline:          business.tagline        ?? null,
    owner_name:       business.owner_name     ?? null,
    founded_year:     business.founded_year != null ? Number(business.founded_year) : null,
    license_number:   business.license ?? business.license_number ?? null,
    certifications:   business.certifications ?? null,
    num_technicians:  business.num_technicians != null ? Number(business.num_technicians) : null,

    meta_title:       seo.meta_title       ?? null,
    meta_description: seo.meta_description ?? null,
  };
}

export const resolveTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const supabase = getServerSupabaseForISR();
  const { data: tenantBase, error } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !tenantBase) return null;

  return resolveSettings(tenantBase);
});
```

---

## Tenant layout — full source (shell-selection logic)
### `app/tenant/[slug]/layout.tsx`

```tsx
export const revalidate = 300;                        // ← 5-min ISR TTL

// ...imports...

export default async function TenantLayout({ params, children }) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [servicePages, social] = await Promise.all([...]);

  const cssVars = shellCssVarsString(
    computeShellCssVars(tenant.template, tenant.primary_color, tenant.accent_color)
  );

  const theme = tenant.template;    // ← derived from resolveTenantBySlug

  if (theme === 'metro-pro')     { return <MetroLayout ... /> }
  if (theme === 'modern-pro')    { return <ModernProLayout ... /> }
  if (theme === 'clean-friendly'){ return <CleanFriendlyLayout ... /> }
  if (theme === 'bold-local')    { return <BoldLocalLayout ... /> }
  if (theme === 'rustic-rugged') { return <RusticRuggedLayout ... /> }

  return <main><h1>Theme not yet ported: {tenant.template}</h1></main>;
}
```

---

## Tenant public page — key sections
### `app/tenant/[slug]/page.tsx`

```tsx
export const revalidate = 300;

export default async function TenantHome({ params }) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return null;

  // ...fetches...

  if (tenant.template === 'modern-pro')    { return <ModernProHome ... /> }
  if (tenant.template === 'bold-local')    { return <BoldLocalHome ... /> }
  if (tenant.template === 'clean-friendly'){ return <CleanFriendlyHome ... /> }
  if (tenant.template === 'rustic-rugged') { return <RusticRuggedHome ... /> }

  return <MetroHero ... />;   // ← fallback (metro-pro)
}
```

Both layout and page branch on `tenant.template`, which is sourced exclusively from `resolveTenantBySlug`.

---

## Shell resolver / applyTheme
### `src/lib/shellThemes.ts`

Admin SPA only — not used in the Next.js public tenant path. `applyTheme()` sets CSS custom properties on `document.documentElement` for the admin dashboard. The Next.js path uses `computeShellCssVars` / `shellCssVarsString` from `shared/lib/shellCssVars` instead, injected as a `<style>` block in the layout.

---

## TenantBootProvider
### `src/context/TenantBootProvider.tsx`

Admin SPA only — not part of the Next.js public render path. Reads from `get_tenant_boot` RPC (which was fixed in T9.3 to read `branding->>'theme'`). Manages flash-prevention for the admin-side React SPA.

---

## revalidatePath / revalidateTag call sites

```
app/api/revalidate/route.ts:58:  revalidateTag(cacheTags.page(body.tenantId, body.slug));
app/api/revalidate/route.ts:59:  revalidateTag(cacheTags.allPages(body.tenantId));
app/api/revalidate/route.ts:60:  revalidatePath('/tenant/[slug]', 'layout');
app/api/revalidate/route.ts:62:  revalidateTag(cacheTags.settings(body.tenantId));
app/api/revalidate/route.ts:63:  revalidatePath('/tenant/[slug]', 'layout');
app/api/revalidate/route.ts:65:  revalidateTag(cacheTags.testimonials(body.tenantId));
app/api/revalidate/route.ts:66:  revalidatePath('/tenant/[slug]', 'layout');
(all other types: same pattern)
```

`revalidatePath` always uses the bracket form `'/tenant/[slug]'` with `'layout'` as second arg. No interpolated slug-specific paths.

`resolveSettings` uses React's `cache()` — per-request deduplication only, not ISR-tagged caching. There is no `unstable_cache` wrapper with the settings tag. This means `revalidateTag(cacheTags.settings(body.tenantId))` does NOT actually bust `resolveSettings`'s output from the ISR cache. The `revalidatePath('/tenant/[slug]', 'layout')` is the actual ISR cache buster.

---

## Claude Code's observations

### Does the revalidate route use bracket form or interpolated slug?
**Bracket form** — `revalidatePath('/tenant/[slug]', 'layout')`. This revalidates ALL tenant routes (all slugs), not just the one that was saved. This is broader than necessary but correct — it won't miss a tenant.

### Is `'layout'` the second arg to revalidatePath?
**Yes** — `revalidatePath('/tenant/[slug]', 'layout')` on every code path in the route handler.

### Does the tenant page fetch branding at request time, or only at build?
At ISR regeneration time — `revalidate = 300` on both layout and page. No `force-dynamic`, no `revalidate = 0`. `resolveTenantBySlug` is a plain `async` function wrapped in React `cache()`. It runs fresh on each ISR regeneration. **No `unstable_cache` is used**, so `revalidateTag` only affects caches that were tagged with `unstable_cache`. The ISR cache is busted purely via `revalidatePath`.

### Does `__TENANT_BOOT__` get injected with a theme value?
`__TENANT_BOOT__` is used by the **admin SPA** (`src/context/TenantBootProvider.tsx`) for flash prevention. It is NOT injected into the Next.js public tenant layout — there is no inline script in `app/tenant/[slug]/layout.tsx`. The public render path has no client-side theme hydration; the shell is determined server-side by `tenant.template`.

### Is there a `force-dynamic` or `revalidate = 0`?
No. Both layout and page export `revalidate = 300` (5-minute ISR TTL).

---

## Root cause identification (observation only)

**`shared/lib/tenant/resolve.ts` line 29:**
```ts
template: branding.template ?? 'modern-pro',
```

After T9.2 renamed `branding.template` → `branding.theme` across all 5 DB rows, `branding.template` is `undefined` for every tenant. The `?? 'modern-pro'` fallback fires, so `resolveTenantBySlug` returns `template: 'modern-pro'` for every tenant regardless of their actual saved theme.

The layout branch `if (theme === 'bold-local')` etc. never matches (except `modern-pro`), so all tenants render the `ModernProNavbar` / `ModernProFooter` / `ModernProHero` shell. The admin save correctly writes `theme: 'bold-local'` to the DB — the DB is clean — but the resolver can't see it because it reads the wrong key.

This is the same class of bug as the `get_tenant_boot` RPC fix in T9.3: a read-path that wasn't updated when the DB key was renamed.

The revalidation plumbing is correct and would work fine once the resolver reads the right key.
