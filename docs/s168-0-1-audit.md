# S168.0.1 — seo2.5 code-side death-audit
Generated: 2026-04-22
Last commit at audit time: 83412e2

---

## 1. Repo snapshot

```
pwd:
/workspaces/pestflow-pro

git log --oneline -5:
83412e2 b17: add image+logo fields to LocalBusiness JSON-LD schema
10abde2 s167.3: add privacy / terms / sms-terms routes + bold-local/clean-friendly footer trio
751b37b s167.2: nav parity — add Blog/Reviews/FAQ to shell navbars
f8a9a36 s167.1: fix rustic-rugged navbar+footer — strip /tenant/${slug} prefix
bec9ffe s166.t4: downgrade error-level tseslint rules to warn, raise ci max-warnings to 200

git status:
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

find . -name "middleware.ts" -not -path "./node_modules/*":
./middleware.ts

find . -maxdepth 4 -name "seoSchema.ts" -not -path "./node_modules/*":
./shared/lib/seoSchema.ts
```

---

## 2. business_info.address callsites

### Grep 1: pattern `business_info.*\.address` / `businessInfo.*\.address`

```
src/components/ironwood/ProspectDetail.Sections.tsx:121
  (form.business_info as any)?.address
  — READ (completeness check for accordion isComplete flag)

src/pages/ContactPage.tsx:39
  address: row.value.address || ''
  — READ (reads from DB settings row into local useState)

src/pages/admin/Onboarding.tsx:63
  value: { name: form.businessName, ..., address: form.address, ... }
  — WRITE (INSERT into settings table during onboarding provisioning)

src/pages/admin/Onboarding.tsx:84
  business_info: { ..., address: form.address, ... }
  — WRITE (writes to context state after save)

src/pages/admin/OnboardingLive.tsx:101
  value: { ..., address: fullAddress, ... }
  — WRITE (INSERT into settings table, note uses `fullAddress` not form.address)
```

### Grep 2: literal `'address'` (not street_/locality/region/country/email/billing/shipping)

```
src/components/ironwood/ProspectDetail.SiteContent.tsx:5
  ['address','Address']
  — TYPE-DEF/CONFIG (column label pair in a field config array)

src/components/admin/client-setup/steps/Step1BusinessInfo.tsx:66
  value={form.address} onChange={f('address')}
  — READ+WRITE (form input, reads/writes form state)

src/components/ironwood/ScrapeResultsTable.tsx:15
  ['address', 'Address']
  — TYPE-DEF/CONFIG (column label pair)

src/shells/metro-pro/MetroProQuotePage.tsx:214
  value={form.address} onChange={e => set('address', e.target.value)}
  — READ+WRITE (customer service-address form input — NOT business_info.address)

src/components/admin/settings/BusinessInfoSection.tsx:60
  { label: 'Street Address', key: 'address', placeholder: '123 Main St, Tyler, TX 75701' }
  — TYPE-DEF/CONFIG (field definition for the settings form)

src/components/admin/onboarding/StepBusinessInfo.tsx:35
  value={form.address} onChange={e => updateField('address', e.target.value)}
  — READ+WRITE (onboarding form input for business address)

src/pages/intake/IntakeStep1Business.tsx:32
  value={form.address || ''} onChange={e => set('address', e.target.value)}
  — READ+WRITE (Ironwood intake form — prospect data entry)

app/tenant/[slug]/_components/forms/QuoteForm.tsx:130
  value={form.address} onChange={e => set('address', e.target.value)}
  — READ+WRITE (customer service-address form input — NOT business_info.address)

src/pages/admin/OnboardingLive.tsx:46
  { key: 'address', label: 'Street address?', ... }
  — TYPE-DEF/CONFIG (field definition array for onboarding live wizard)
```

### Grep 3: literal `"address"` (double-quote, same filters)

```
src/shells/dang/pages/QuoteForm.tsx:89
  {...register("address")}
  — READ+WRITE (react-hook-form customer service-address — NOT business_info.address)
```

### Classification summary

| File | Line | Classification | Notes |
|------|------|----------------|-------|
| ProspectDetail.Sections.tsx:121 | READ | `(form.business_info as any)?.address` — completeness check |
| ContactPage.tsx:39 | READ | reads from DB settings into local state |
| Onboarding.tsx:63 | WRITE | INSERT settings.business_info with address field |
| Onboarding.tsx:84 | WRITE | writes to context state |
| OnboardingLive.tsx:101 | WRITE | INSERT settings.business_info with `fullAddress` (composed value) |
| ProspectDetail.SiteContent.tsx:5 | TYPE-DEF | label config array |
| Step1BusinessInfo.tsx:66 | READ+WRITE | client-setup wizard form input |
| ScrapeResultsTable.tsx:15 | TYPE-DEF | column config |
| MetroProQuotePage.tsx:214 | READ+WRITE | customer quote form (NOT biz address) |
| BusinessInfoSection.tsx:60 | TYPE-DEF | field config |
| StepBusinessInfo.tsx:35 | READ+WRITE | onboarding form input |
| IntakeStep1Business.tsx:32 | READ+WRITE | Ironwood intake form |
| QuoteForm.tsx (app/):130 | READ+WRITE | customer quote form (NOT biz address) |
| OnboardingLive.tsx:46 | TYPE-DEF | field config array |
| dang/pages/QuoteForm.tsx:89 | READ+WRITE | customer service-address (NOT biz address) |

**Note:** `OnboardingLive.tsx:101` uses `fullAddress` — this is likely a composed/structured address from separate street/city/state/zip fields in the onboarding wizard. Warrants review when S168.3 updates the address shape.

---

## 3. business_info.hours callsites

### Grep 1: pattern `business_info.*\.hours` / `businessInfo.*\.hours`

```
src/components/ironwood/ProspectDetail.Sections.tsx:121
  (form.business_info as any)?.hours
  — READ (completeness check in accordion isComplete flag)

src/pages/ContactPage.tsx:39
  hours: row.value.hours || ''
  — READ (reads from DB settings row into local useState)

src/pages/admin/Onboarding.tsx:63
  value: { ..., hours: form.hours, ... }
  — WRITE (INSERT into settings table during onboarding provisioning)

src/pages/admin/Onboarding.tsx:84
  business_info: { ..., hours: form.hours, ... }
  — WRITE (writes to context state)

src/pages/admin/OnboardingLive.tsx:101
  value: { ..., hours: form.hours, ... }
  — WRITE (INSERT into settings table)
```

### Grep 2: literal `'hours'`

```
src/components/ironwood/ProspectDetail.SiteContent.tsx:5
  ['hours','Hours']
  — TYPE-DEF/CONFIG (column label pair)

src/components/ironwood/ScrapeResultsTable.tsx:16
  ['hours', 'Hours']
  — TYPE-DEF/CONFIG (column label pair)

src/components/admin/client-setup/steps/Step1BusinessInfo.tsx:70
  value={form.hours} onChange={f('hours')}
  — READ+WRITE (form input, single text input — NOT structured)

src/components/admin/settings/BusinessInfoSection.tsx:61
  { label: 'Business Hours', key: 'hours', placeholder: 'Mon-Fri 8am-6pm, Sat 9am-2pm' }
  — TYPE-DEF/CONFIG (field definition — single text input placeholder confirms string shape)

src/components/admin/onboarding/StepBusinessInfo.tsx:39
  value={form.hours} onChange={e => updateField('hours', e.target.value)}
  — READ+WRITE (onboarding form, single text input)

src/pages/intake/IntakeStep1Business.tsx:50
  value={form.hours || ''} onChange={e => set('hours', e.target.value)}
  — READ+WRITE (Ironwood intake form, single text input)

src/pages/admin/OnboardingLive.tsx:48
  { key: 'hours', label: 'Business hours?', placeholder: 'Mon–Fri 8am–6pm, Sat 9am–2pm' }
  — TYPE-DEF/CONFIG (wizard field definition, single text input)
```

### Grep 3: literal `"hours"` (double-quote)
No matches (after filtering after_hours/hours_structured).

### Classification summary

| File | Line | Classification | Notes |
|------|------|----------------|-------|
| ProspectDetail.Sections.tsx:121 | READ | completeness check |
| ContactPage.tsx:39 | READ | reads from DB |
| Onboarding.tsx:63,84 | WRITE | INSERT settings + context state |
| OnboardingLive.tsx:101 | WRITE | INSERT settings |
| ProspectDetail.SiteContent.tsx:5 | TYPE-DEF | label config |
| ScrapeResultsTable.tsx:16 | TYPE-DEF | column config |
| Step1BusinessInfo.tsx:70 | READ+WRITE | text input |
| BusinessInfoSection.tsx:61 | TYPE-DEF | field config — single string shape |
| StepBusinessInfo.tsx:39 | READ+WRITE | text input |
| IntakeStep1Business.tsx:50 | READ+WRITE | text input |
| OnboardingLive.tsx:48 | TYPE-DEF | field config |

**Key finding:** `hours` is universally treated as a freeform string across all callsites. The `parseHours()` function in `seoSchema.parsers.ts` does structured parsing of this string for JSON-LD output. No callsite stores structured hours objects — parsing is always at JSON-LD emit time.

---

## 4. BusinessInfo TS interface inventory

### Declared interfaces/types (grep results)

```
src/components/Footer.tsx:12           interface BusinessInfo
src/shells/modern-pro/ShellHero.tsx:9  interface BusinessInfo
src/shells/modern-pro/ShellFooter.tsx:13  interface BusinessInfo
src/pages/ContactPage.tsx:9            interface BusinessInfo
src/shells/metro-pro/ShellHero.tsx:9   interface BusinessInfo
src/shells/metro-pro/ShellFooter.tsx:12  interface BusinessInfo
src/shells/clean-friendly/ShellFooter.tsx:13  interface BusinessInfo
shared/lib/seoSchema.ts:7              export interface BusinessInfo   ← CANONICAL
```

### Files referencing BusinessInfo (in .ts files only)

```
./shared/lib/seoSchema.ts
./shared/lib/tenant/types.ts
```

### Interface declarations with context

**`shared/lib/seoSchema.ts:7` — CANONICAL (exported)**
```ts
export interface BusinessInfo {
  name: string
  phone: string
  email: string
  address: string
  hours?: string
  license_number?: string
  license?: string
  city?: string
  state?: string
  zip?: string
  logo_url?: string
}
```
NOTE: Has both `license_number` AND `license` — dual keys for backward compat.
Has optional `city`, `state`, `zip` — not yet used by any callsite (forward-compatible placeholders or seo2.5 prep).

**`shared/lib/tenant/types.ts:10` — `TenantBusinessInfo` type**
```ts
export type TenantBusinessInfo = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  tagline?: string;
  industry?: string;
  license_number?: string;
  certifications?: string;
  founded_year?: number | string;
  num_technicians?: number | string;
  owner_name?: string;
};
```
Also defines `Tenant` type with flat fields: `address`, `hours`, `license_number`, `certifications`, `founded_year`, `num_technicians`, `owner_name`, `phone`, `email`, `tagline`.

**`src/components/Footer.tsx:12` — local interface**
```ts
interface BusinessInfo {
  name: string; phone: string; email: string; address: string; hours: string; tagline: string; license: string
}
```
Uses `license` (not `license_number`). Single-line string address. Single-line string hours.

**`src/shells/modern-pro/ShellHero.tsx:9` — local interface**
```ts
interface BusinessInfo {
  name?: string; tagline?: string; phone?: string; address?: string;
  founded_year?: string | number; num_technicians?: number
}
```
Reads address but also founded_year and num_technicians.

**`src/shells/modern-pro/ShellFooter.tsx:13` — local interface**
```ts
interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string; tagline: string; license: string }
```
Same shape as Footer.tsx above. `license` key.

**`src/pages/ContactPage.tsx:9` — local interface**
```ts
interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string }
```
Minimal — no tagline/license.

**`src/shells/metro-pro/ShellHero.tsx:9` — local interface**
```ts
interface BusinessInfo { name?: string; phone?: string; tagline?: string; address?: string; founded_year?: string | number; num_technicians?: number }
```

**`src/shells/metro-pro/ShellFooter.tsx:12` — local interface**
```ts
interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string; tagline: string; license: string }
```

**`src/shells/clean-friendly/ShellFooter.tsx:13` — local interface**
```ts
interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string; tagline: string; license: string }
```

### Inconsistency alert
Local shell interfaces use `license` key. Canonical `seoSchema.ts` has both `license_number` and `license` (aliased). `TenantBusinessInfo` uses `license_number`. The DB column on the `Tenant` type is `license_number`. The admin form saves as `license` key (see BusinessInfoSection.tsx field config). This is a known inconsistency — both keys coexist in the JSONB blob.

---

## 5. Business-info admin form location

### Admin directories found
No `app/(admin)/` or `app/admin/` directory exists — admin is Vite SPA served from `src/`.

### Primary admin settings form
**`src/components/admin/settings/BusinessInfoSection.tsx`** — the canonical admin settings form for business info.

**Address input shape:** Single `<input type="text">` with placeholder `'123 Main St, Tyler, TX 75701'`. Expects freeform single-line string. No structured street/city/state/zip fields. This is what feeds `business_info.address` in the DB.

**Hours input shape:** Single `<input type="text">` with placeholder `'Mon-Fri 8am-6pm, Sat 9am-2pm'`. Expects freeform single-line string. No structured day/time picker.

**Save wiring:**
- Direct Supabase client call: `supabase.from('settings').upsert({ tenant_id, key: 'business_info', value }, { onConflict: 'tenant_id,key' })`
- FULL-OBJECT REPLACE (see Step 6 for detail)
- After save: calls `triggerRevalidate` to bust Next.js ISR cache

**Other forms that write business_info:**
- `src/pages/admin/Onboarding.tsx` — provisioning flow, writes address+hours as text
- `src/pages/admin/OnboardingLive.tsx` — live onboarding wizard, writes `fullAddress` (may be composed from separate fields in that wizard's state)
- `src/components/admin/client-setup/steps/Step1BusinessInfo.tsx` — Ironwood client-setup flow

---

## 6. saveBusinessInfo / settings writer helper

No standalone `saveBusinessInfo`, `saveSettings`, `updateSettings`, or `upsertSettings` helper function exists. Every callsite writes directly to Supabase.

### Primary writer: `BusinessInfoSection.tsx handleSave()`

```ts
async function handleSave() {
  if (!tenantId) return
  setSaving(true)
  // Merge form with extra fields so provisioned data (num_technicians, owner_name, etc.) isn't erased
  const value = { ...extraDbFields.current, ...form }
  const { error } = await supabase.from('settings').upsert(
    { tenant_id: tenantId, key: 'business_info', value },
    { onConflict: 'tenant_id,key' }
  )
  setSaving(false)
  if (error) { toast.error(`Failed to save business info: ${error.message}`); return }
  toast.success('Business info saved!')
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (accessToken && tenantId) await triggerRevalidate({ type: 'settings', tenantId }, accessToken)
}
```

**Answer (a): FULL-OBJECT REPLACE** — `upsert({ value: mergedObject })` replaces the entire JSONB value column with one atomic write. It does NOT use `jsonb_set` or the `||` JSONB merge operator.

**Answer (b): ACCEPTS ARBITRARY KEYS via extraDbFields merge** — The component reads the existing DB row on mount and strips out the 10 known form keys (`name, phone, email, address, hours, tagline, license, after_hours_phone, founded_year, industry`) into `extraDbFields.current`. On save, it merges `{ ...extraDbFields.current, ...form }`. Any key not in the form but present in the DB survives because it's in `extraDbFields`. NEW keys added to the DB by S168 that are not in the form's field list will also survive as long as they are not one of the stripped keys in the destructure line. There is no whitelist that would BLOCK new keys.

**Answer (c): Implication for S168.3 admin form writer** — The existing guard (`extraDbFields`) already prevents data loss for unknown keys. However, if S168 adds NEW known fields (e.g., `address_street`, `address_city`, `address_state`, `address_zip`) to the form, they must be ADDED to the form's `BusinessInfoForm` interface AND added to the destructure strip line in the `useEffect`. If they are not in the strip, they will remain in `extraDbFields.current` AND in `form`, resulting in a double-write (benign but messy). The bigger risk: if S168.3 introduces structured address as separate fields, the old `address` string field must remain for backward compat with Vite shells that still read it — or all shells must be migrated simultaneously.

**Other writers (direct upsert, no extraDbFields guard):**

`src/pages/admin/Onboarding.tsx:63`:
```ts
{ tenant_id: tenantId, key: 'business_info', value: {
    name: form.businessName, phone: form.phone, email: form.email,
    address: form.address, hours: form.hours, tagline: form.tagline,
    license: form.license, industry: form.industry
}}
```
This is a FULL-OBJECT REPLACE with a HARDCODED FIXED KEY SET. No extraDbFields guard. Writing only these 8 keys — any other keys that exist in the DB will be LOST on this path.

`src/pages/admin/OnboardingLive.tsx:101`:
```ts
{ tenant_id: tenantId, key: 'business_info', value: {
    name: form.businessName, phone: form.phone, email: form.email,
    address: fullAddress, hours: form.hours, tagline: form.tagline, license: form.license
}}
```
Same issue — FULL-OBJECT REPLACE with HARDCODED FIXED KEY SET. `fullAddress` is assembled from separate fields in the wizard.

**Risk for S168.3:** Both `Onboarding.tsx` and `OnboardingLive.tsx` will cause data loss if S168 adds new keys to `business_info` that are not in these hardcoded value objects. However, these paths are only triggered during initial provisioning (before the tenant has any custom data), so the practical risk is low if the provisioning edge function (`provision-tenant`) seeds the canonical shape.

---

## 7. shared/lib/seoSchema.ts current state

**Full file contents:**

```ts
// JSON-LD schema generation library for PestFlow Pro tenant sites.
// Pure functions: take settings objects, return schema-ready objects.
import { parseHours, parseAddress } from './seoSchema.parsers'
export type { OpeningHoursSpecification, PostalAddressComponents } from './seoSchema.parsers'
export { parseHours, parseAddress }

export interface BusinessInfo {
  name: string
  phone: string
  email: string
  address: string
  hours?: string
  license_number?: string
  license?: string
  city?: string
  state?: string
  zip?: string
  logo_url?: string
}

export interface SeoSettings { ... }
export interface SchemaConfig { ... }
export interface SocialLinks { ... }
export interface BlogPostInput { ... }

export function generateLocalBusinessSchema(business, seo, _schema, social, siteUrl): object
export function generateServiceSchema(serviceName, serviceDescription, serviceUrl, siteUrl): object
export function generateFAQSchema(faqs): object
export function generateBreadcrumbSchema(siteUrl, crumbs): object
export function generateWebsiteSchema(businessName, siteUrl): object
export function generateRatingSchema(businessName, rating, reviewCount): object
export function generateAboutSchema(business, seo, siteUrl): object
export function generateBlogPostingSchema(post, siteUrl): object
```

**(a) BusinessInfo interface declared at line 7** — exported. Fields: `name`, `phone`, `email`, `address` (required strings). Optional: `hours`, `license_number`, `license`, `city`, `state`, `zip`, `logo_url`.

**(b) PostalAddress emitter** — delegates to `parseAddress(business.address)` from `seoSchema.parsers.ts`. The parser:
- Splits on commas
- Scans last 3 parts for a 5-digit ZIP (`\b(\d{5}(?:-\d{4})?)\b`)
- Extracts state from ZIP part remainder or preceding part (2-char uppercase, validated against `US_STATES` set)
- City = part immediately before state/zip segment
- Street = everything before city joined with ", "
- Returns `{ streetAddress, addressLocality, addressRegion, postalCode }` or `undefined`
- Emits `result.address = { '@type': 'PostalAddress', ...parsedAddress, addressCountry: 'US' }`
- Silently omits the address block if parsing fails (graceful degradation)

**(c) GeoCoordinates emitter** — ABSENT. No lat/lng in the schema output.

**(d) openingHoursSpecification emitter** — PRESENT. Delegates to `parseHours(business.hours)` from `seoSchema.parsers.ts`. The parser:
- Splits on `,`, `|`, `;`
- For each segment: extracts day-part + time range via regex
- Day-part: single day or range (dash/en-dash/em-dash/through)
- Time: 12h (am/pm) or 24h, converts to HH:MM
- Returns `OpeningHoursSpecification[]` or `undefined` on any parse failure
- Emits `result.openingHoursSpecification = spec` if spec is non-null

**(e) All exported functions:**
- `generateLocalBusinessSchema` — main LocalBusiness + HomeAndConstructionBusiness schema
- `generateServiceSchema` — Service schema for individual service pages
- `generateFAQSchema` — FAQPage schema
- `generateBreadcrumbSchema` — BreadcrumbList schema
- `generateWebsiteSchema` — WebSite schema with SearchAction
- `generateRatingSchema` — standalone LocalBusiness with AggregateRating
- `generateAboutSchema` — AboutPage schema
- `generateBlogPostingSchema` — BlogPosting schema
- Re-exports: `parseHours`, `parseAddress`, types `OpeningHoursSpecification`, `PostalAddressComponents`

---

## 8. middleware.ts tenant rewrite

**Full file contents:**

```ts
import { NextRequest, NextResponse } from 'next/server';

const APEX_HOSTS = new Set([
  'pestflowpro.com',
  'www.pestflowpro.com',
]);

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
  if (APEX_HOSTS.has(hostname)) return null;
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
  return null;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const hostname = host.split(':')[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // Local dev pure localhost: pass through
  if (process.env.NODE_ENV !== 'production' && hostname === 'localhost') {
    return NextResponse.next();
  }

  const slug = extractSubdomain(host);

  // Apex (prod) → Vite SPA handles marketing + /ironwood
  if (!slug) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Client admin on any subdomain → Vite SPA
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Dang is NOT migrated — stays on Vite
  if (slug === 'dang') {
    return NextResponse.rewrite(new URL('/_admin/index.html', req.url));
  }

  // Subdomain public shell → Next.js App Router
  const url = req.nextUrl.clone();
  const suffix = pathname === '/' ? '' : pathname;
  url.pathname = `/tenant/${slug}${suffix}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next|_admin|_tenant|api|.*\\..*).*)',],
};
```

**Analysis:**

**(a) Rewrite destination format:**
- Apex/no-slug → `/_admin/index.html` (Vite SPA)
- Any subdomain `/admin/*` → `/_admin/index.html` (Vite SPA)
- `dang` subdomain → `/_admin/index.html` (Vite SPA, explicit bypass)
- Any other subdomain → `/tenant/${slug}${pathname}` (Next.js App Router)

**(b) Subdomains/hosts that trigger rewrite:**
- Any subdomain of `.pestflowpro.com` (excluding `www`) is extracted as slug
- Local dev: any subdomain of `.localhost`
- Apex (`pestflowpro.com`, `www.pestflowpro.com`) → slug is null → Vite SPA

**(c) Dang handling:**
`dang.pestflowpro.com` triggers the middleware. `extractSubdomain` returns `'dang'`. The explicit `if (slug === 'dang')` guard fires BEFORE the Next.js App Router rewrite, routing it to `/_admin/index.html` (Vite SPA). Dang is FULLY ISOLATED from Next.js App Router. Any S168 changes to `app/tenant/[slug]/` will NOT affect Dang.

---

## 9. Dang callsites (S168 MUST NOT TOUCH)

### Files with `.address` matches in src/shells/dang/

```
src/shells/dang/pages/ContactPage.tsx:5
  const [form, setForm] = useState({ ..., address: '', ... })
  — Customer form field (visitor's service address), NOT business_info.address

src/shells/dang/pages/ContactPage.tsx:100
  value={form.address} onChange={e => setForm({...form, address: e.target.value})}
  — Customer form input, NOT business_info.address

src/shells/dang/pages/QuoteForm.tsx:9
  address: string;  (TypeScript interface for customer form)
  — Customer form type definition, NOT business_info.address

src/shells/dang/pages/QuoteForm.tsx:89
  {...register("address")}
  — Customer form input (react-hook-form), NOT business_info.address
```

### Files with `.hours` matches in src/shells/dang/
None found.

### Files with `business_info` matches in src/shells/dang/
None found.

### Dang freeze verdict
The two files that contain `.address` in dang are **customer quote/contact forms** (visitor enters their service address). Neither reads nor writes `business_info.address` from Supabase settings. The dang shell gets business info via `hooks/useSiteConfig.ts` (confirmed no business_info match in that file).

**Files S168 MUST NOT TOUCH:**
- All files under `src/shells/dang/` (any subdirectory)
- Middleware rule: `if (slug === 'dang')` block in `middleware.ts` — must not be removed

---

## 10. Gaps / anomalies

1. **Dual license keys:** `shared/lib/seoSchema.ts` BusinessInfo has both `license_number` and `license`. Local shell interfaces use `license`. Admin form saves as `license`. `TenantBusinessInfo` uses `license_number`. The `Tenant` type (from `shared/lib/tenant/types.ts`) has `license_number`. The `generateLocalBusinessSchema` function does not emit either key to JSON-LD currently (no `license` field in the output object). The issue is purely about which DB key is authoritative — but both may exist in the same JSONB blob.

2. **`OnboardingLive.tsx` uses `fullAddress`:** Line 101 writes `address: fullAddress` instead of `form.address`. The wizard collects address in structured fields (street, city, state, zip) and composes them into `fullAddress`. This means the provisioned `address` value is already a well-formatted string like "123 Main St, Tyler, TX 75701" — exactly what `parseAddress()` expects. This is the BEST path for S168.

3. **`Onboarding.tsx` writes only 8 hardcoded keys:** No `extraDbFields` guard. If S168 adds new keys to `business_info`, they will be lost if a re-provisioning flows through `Onboarding.tsx`. Low risk (only used for fresh provisions) but worth noting.

4. **`app/tenant/[slug]/layout.tsx` is the JSON-LD emit point for Next.js shells:** It calls `generateLocalBusinessSchema` at server-render time using `tenant.address` and `tenant.hours` from `resolveTenantBySlug`. The `Tenant` type has these as flat fields resolved from the JSONB. Any S168.1 changes to `parseAddress` or `parseHours` will take effect here automatically — no layout changes needed.

5. **No `getBusinessInfo` query function in `app/tenant/[slug]/_lib/queries.ts`:** The tenant layout reads business info via `resolveTenantBySlug` which flattens the JSONB. Individual pages that need business info (e.g., contact page) would need a separate query. Currently no such page-level query exists in the App Router layer.

6. **`seoSchema.ts` BusinessInfo has `city`, `state`, `zip` optional fields** that are not written anywhere in the codebase. These appear to be forward-looking placeholders for seo2.5 structured address — no callsite reads or writes them yet.

7. **`parseHours` is strict — returns `undefined` on ANY parse failure:** If a segment can't be parsed, the entire hours string is dropped (returns `undefined` for the whole input, not just the bad segment). This means a business with partially structured hours (e.g., "Mon-Fri 8am-6pm, By appointment Sat") would get NO `openingHoursSpecification` emitted.

8. **`parseAddress` requires ZIP code to be present:** No ZIP = no `PostalAddress` in JSON-LD. Tenants with PO Box or incomplete addresses will silently skip the address block. No error is surfaced to the admin.

---

## 11. Recommendations for S168.1 prompt

### Files S168.1 will need to edit

**Primary targets (seoSchema layer):**
- `/workspaces/pestflow-pro/shared/lib/seoSchema.ts` — may need `BusinessInfo` interface updates if new fields added
- `/workspaces/pestflow-pro/shared/lib/seoSchema.parsers.ts` — core changes for `parseAddress` / `parseHours` improvements

**Next.js App Router layer (if JSON-LD output changes):**
- `/workspaces/pestflow-pro/app/tenant/[slug]/layout.tsx` — JSON-LD emit; may need to pass new fields to `generateLocalBusinessSchema`

**Shared types (if address shape changes):**
- `/workspaces/pestflow-pro/shared/lib/tenant/types.ts` — `TenantBusinessInfo` and `Tenant` types

**Admin form (S168.3 — NOT S168.1):**
- `/workspaces/pestflow-pro/src/components/admin/settings/BusinessInfoSection.tsx` — if adding structured address fields

### Design-doc assumptions that need revisiting before S168.1

1. **Address is a freeform string everywhere.** If S168 wants structured address (separate street/city/state/zip), the admin form, all onboarding writers, and the `Tenant` flat-field resolver all need updates. The parsers already handle the freeform string gracefully for JSON-LD — the question is whether S168 needs editable structured fields or just better parsing of the existing string.

2. **`parseHours` fail-fast is intentional but aggressive.** If S168 wants partial hours (e.g., only Mon-Fri, skip Sat if unparseable), the parser needs a segment-level graceful fallback instead of whole-string failure. Current behavior: any bad segment → no `openingHoursSpecification` at all.

3. **GeoCoordinates are absent by design.** If S168 wants lat/lng in JSON-LD, a new field must be added to `business_info` (or `seo` settings), a geocoding call must happen somewhere, and the result stored. No infrastructure for this exists today.

4. **`license` vs `license_number` key ambiguity should be resolved in S168.3** when the admin form is touched — pick one, add a migration to normalize the JSONB, update `BusinessInfo` interface to drop the alias.

5. **Dang bypass is hardcoded in middleware** — this is correct and intentional. Do not touch it.

6. **The `city`, `state`, `zip` optional fields already exist in `seoSchema.ts BusinessInfo`** — if S168.1 wants to use these as inputs to `generateLocalBusinessSchema` (bypassing `parseAddress`), the function signature already accepts them. The layout.tsx would need to pass them from the tenant object, and the Tenant type would need new flat fields.
