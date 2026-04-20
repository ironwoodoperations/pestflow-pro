# S160.4 diagnostic — T9 post-ship frontend regressions

## Context
DB is clean. Both bugs are in the React form layer. Source inspection below.

---

## BusinessInfoSection.tsx — full source

```tsx
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { triggerRevalidate } from '../../../lib/revalidate'

interface BusinessInfoForm {
  name: string; phone: string; email: string; address: string; hours: string
  tagline: string; license: string; after_hours_phone: string; founded_year: string
  industry: string
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function BusinessInfoSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<BusinessInfoForm>({ name: '', phone: '', email: '', address: '', hours: '', tagline: '', license: '', after_hours_phone: '', founded_year: '', industry: 'Pest Control' })
  // Preserve extra DB fields (num_technicians, owner_name, certifications, etc.) not exposed in this form
  const extraDbFields = useRef<Record<string, unknown>>({})

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value
          setForm(prev => ({ ...prev, name: v.name || '', phone: v.phone || '', email: v.email || '', address: v.address || '', hours: v.hours || '', tagline: v.tagline || '', license: v.license || '', after_hours_phone: v.after_hours_phone || '', founded_year: v.founded_year || '', industry: v.industry || 'Pest Control' }))
          // Store extra fields that are in the DB but not in this form (prevent data loss on save)
          // year_founded: legacy key dropped in s159.3.3-t7; excluded so it never reappears
          // in extras. CHECK constraint on settings.business_info enforces this at the DB layer too.
          const { name: _n, phone: _p, email: _e, address: _a, hours: _h, tagline: _t, license: _l, after_hours_phone: _ah, founded_year: _fy, year_founded: _yf, industry: _i, ...extras } = v
          extraDbFields.current = extras
        }
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    // Merge form with extra fields so provisioned data (num_technicians, owner_name, etc.) isn't erased
    const value = { ...extraDbFields.current, ...form }
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'business_info', value }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) { toast.error(`Failed to save business info: ${error.message}`); return }
    toast.success('Business info saved!')
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (accessToken && tenantId) await triggerRevalidate({ type: 'settings', tenantId }, accessToken)
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  const fields: { label: string; key: keyof BusinessInfoForm; type?: string; placeholder?: string }[] = [
    { label: 'Business Name', key: 'name', placeholder: 'Acme Pest Control' },
    { label: 'Phone Number', key: 'phone', placeholder: '(903) 555-0100' },
    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'info@acmepest.com' },
    { label: 'Street Address', key: 'address', placeholder: '123 Main St, Tyler, TX 75701' },
    { label: 'Business Hours', key: 'hours', placeholder: 'Mon-Fri 8am-6pm, Sat 9am-2pm' },
    { label: 'Tagline', key: 'tagline', placeholder: 'Fast. Effective. Guaranteed.' },
    { label: 'License Number', key: 'license', placeholder: 'TPCL #12345' },
    { label: 'After-Hours Phone', key: 'after_hours_phone', placeholder: '(903) 555-0199' },
    { label: 'Year Founded', key: 'founded_year', placeholder: '2010' },
    { label: 'Industry / Business Type', key: 'industry', placeholder: 'e.g. Pest Control, HVAC, Plumbing, Roofing' },
  ]

  return (
    <div className="space-y-4">
      <details className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <summary className="text-sm font-semibold text-blue-900 cursor-pointer select-none">🏢 Business Info — How to use this</summary>
        <div className="mt-3 text-sm text-blue-800 space-y-2">
          <p>This is your business profile. Everything here appears on your website and helps Google understand who you are and where you operate.</p>
          <ul className="list-none space-y-1">
            <li><strong>BUSINESS NAME</strong> — Your company name exactly as you want it to appear</li>
            <li><strong>PHONE</strong> — Your main customer-facing number. Shows in the header and footer.</li>
            <li><strong>EMAIL</strong> — Your business contact email</li>
            <li><strong>ADDRESS</strong> — Your physical or mailing address</li>
            <li><strong>HOURS</strong> — When you are open. Shows on your contact page and Google listing.</li>
            <li><strong>TAGLINE</strong> — A short phrase that describes your business (1 sentence max)</li>
            <li><strong>LICENSE NUMBER</strong> — Your state pest control license number (builds trust)</li>
          </ul>
          <p className="text-blue-700 italic">💡 Fill this out completely before sharing your site with anyone.</p>
        </div>
      </details>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Business Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key]} onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className={inputClass} />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Business Info'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## BrandingSection.tsx — full source

```tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { applyTheme } from '../../../lib/shellThemes'
import BrandingLogo from './BrandingLogo'
import PalettePicker from '../../shared/PalettePicker'
import { triggerRevalidate } from '../../../lib/revalidate'

interface BrandingForm {
  logo_url: string; favicon_url: string; primary_color: string; accent_color: string
  theme: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged' | 'youpest' | 'dang' | (string & {})
  cta_text: string; apply_hero_to_all_pages: boolean
}

const inputClass = '...'

const templates: { value: BrandingForm['theme']; label: string; desc: string; bg: string; accent: string; proOnly?: boolean }[] = [
  { value: 'modern-pro',     label: 'Modern Pro',     ... },
  { value: 'bold-local',     label: 'Bold & Local',   ... },
  { value: 'clean-friendly', label: 'Clean & Friendly', ... },
  { value: 'rustic-rugged',  label: 'Rustic & Rugged', ... },
  { value: 'metro-pro',      label: 'Metro Pro',      ..., proOnly: true },
  { value: 'youpest',        label: 'YouPest AI ...',  ..., proOnly: true },
]

export default function BrandingSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tierNum, setTierNum] = useState(1)
  const [form, setForm] = useState<BrandingForm>({
    logo_url: '', favicon_url: '', primary_color: '#10b981', accent_color: '#f5c518',
    theme: 'modern-pro', cta_text: '', apply_hero_to_all_pages: false
  })

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle(),
    ]).then(([brandingRes, subRes]) => {
      if (brandingRes.data?.value) {
        const v = brandingRes.data.value as Partial<BrandingForm>
        setForm(prev => ({
          ...prev,
          logo_url:      v.logo_url      ?? prev.logo_url,
          favicon_url:   v.favicon_url   ?? prev.favicon_url,
          primary_color: v.primary_color ?? prev.primary_color,
          accent_color:  v.accent_color  ?? prev.accent_color,
          theme:         v.theme         ?? prev.theme,       // ← reads 'theme' key
          cta_text:                v.cta_text                ?? prev.cta_text,
          apply_hero_to_all_pages: v.apply_hero_to_all_pages ?? false,
        }))
      }
      ...
      setLoading(false)
    })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    // T9 contract: strip any stray legacy 'template' key
    const { template: _t, ...value } = { ...form } as any   // ← destructures from 'any'
    const { error } = await supabase.from('settings').upsert(
      { tenant_id: tenantId, key: 'branding', value },
      { onConflict: 'tenant_id,key' }
    )
    setSaving(false)
    if (error) { toast.error(`Failed to save branding settings: ${error.message}`); return }
    applyTheme(form.theme, form.primary_color, form.accent_color)
    localStorage.setItem('pfp_template', form.theme)
    ...
  }

  ...

  return (
    ...
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.filter(t => !t.proOnly || tierNum >= 3).map(t => (
          <button key={t.value}
            onClick={() => setForm(prev => ({ ...prev, theme: t.value }))}  // ← sets form.theme
            className={`... ${form.theme === t.value ? 'border-emerald-500 bg-emerald-50' : '...'}`}>
            ...
            {form.theme === t.value && <span>Active</span>}
          </button>
        ))}
      </div>
    </div>
    ...
  )
}
```

---

## Shared helpers (if any)

Neither file imports a shared form helper (`useSettingsSave`, `buildSettingsPayload`, etc.). Both are self-contained.

---

## Grep findings

### 2a: year_founded anywhere in src/
```
src/components/admin/settings/BusinessInfoSection.tsx:31:  // year_founded: legacy key dropped in s159.3.3-t7; excluded so it never reappears
src/components/admin/settings/BusinessInfoSection.tsx:33:  const { name: _n, phone: _p, email: _e, address: _a, hours: _h, tagline: _t,
    license: _l, after_hours_phone: _ah, founded_year: _fy, year_founded: _yf, industry: _i, ...extras } = v
```
`year_founded` appears in src/ ONLY in the exclusion destructure (lines 31 and 33). Not in any payload construction.

### 2b: founded_year pattern (canonical)
```
src/components/admin/client-setup/ClientSetupPayment.tsx:49:  founded_year: '',
src/components/admin/settings/BusinessInfoSection.tsx:9:   founded_year: string
src/components/admin/settings/BusinessInfoSection.tsx:19:  founded_year: '', (initial state)
src/components/admin/settings/BusinessInfoSection.tsx:29:  founded_year: v.founded_year || '', (DB load)
src/components/admin/settings/BusinessInfoSection.tsx:33:  founded_year: _fy, (exclusion in extraDbFields destructure)
src/components/admin/settings/BusinessInfoSection.tsx:65:  { label: 'Year Founded', key: 'founded_year', ... }
```

### 2c: shell / template holdouts in BrandingSection.tsx
```
18: const templates: { value: BrandingForm['theme']; ... }[] = [  ← variable name still 'templates'
68: // T9 contract: strip any stray legacy 'template' key
69: const { template: _t, ...value } = { ...form } as any
74: localStorage.setItem('pfp_template', form.theme)
132: {templates.filter(...)...}
```

### 2d: shell name literal references in admin
Present in: `ShellSelector.tsx`, `Step6Review.tsx`, `ClientSetupPayment.tsx` (as string `'modern-pro'` default), `BrandingSection.tsx` (in `templates` array values), `onboarding/types.ts`, `StepBranding.tsx`. All are valid uses (value lookups/defaults).

### 2e: theme / select / radio in BrandingSection.tsx
```
12:  theme: '...' (BrandingForm interface field)
18:  const templates: { value: BrandingForm['theme']; ... }[] = [
33:  theme: 'modern-pro' (initial state default)
50:  theme: v.theme ?? prev.theme (DB load)
73:  applyTheme(form.theme, ...)
74:  localStorage.setItem('pfp_template', form.theme)
133: onClick={() => setForm(prev => ({ ...prev, theme: t.value }))}
134: className={`... ${form.theme === t.value ? ... : ...}`}
143: {form.theme === t.value && <span>Active</span>}
158: // Only change colors — theme is a separate user choice
160: applyTheme(prev.theme, p, a)
```
No `<select>`, no `<option>`, no radio inputs. Theme selection is via `<button>` grid.

---

## Build output

Build: **GREEN**. 87.3 kB first load shared JS. TypeScript clean. No errors.

## Bundle analysis (`.next/server/chunks/267.js`)

```
      4 bold-local
      5 clean-friendly
      3 founded_year
      2 metro-pro
      5 modern-pro
      3 rustic-rugged
```

`year_founded` — **ZERO hits in compiled output**. The exclusion is working at compile time; `year_founded` never makes it into a payload-constructing code path.

---

## Claude Code's read

### Bug 1 hypothesis (year_founded constraint fire)

**Where does the form state hold Year Founded?**
`form.founded_year` (string). `BusinessInfoForm` interface at line 9. Initial state line 19: `founded_year: ''`.

**What key name does the save payload use?**
`const value = { ...extraDbFields.current, ...form }` — `form.founded_year` spreads in as key `founded_year`. The save payload uses the canonical key.

**Is the destructure-exclusion for `year_founded` present?**
YES — line 33 explicitly destructures `year_founded: _yf` to keep it out of `extras`. The T7 fix is still in place. Compiled bundle confirms `year_founded` never appears in any JS code path.

**What specific line/pattern is causing the constraint to fire?**

Not visible from source inspection of BusinessInfoSection.tsx — the code appears correct. However, the `extraDbFields.current` pattern is the only path where unexpected keys could enter the payload. Three scenarios worth investigating at runtime:

1. **Stale ref from another session/tenant**: `extraDbFields.current` is a `useRef` that persists across React renders. If the component is reused without unmounting (e.g., tab switching within the Settings page without a full unmount), `extraDbFields.current` could retain data from a previous tenant's DB load. If that previous load happened before the T7 fix was deployed (i.e., when `year_founded` was still in the DB and NOT yet in the exclusion list), the ref could hold a stale value containing `year_founded`.

2. **Another write path not in this component**: `provision-tenant` edge function writes to `settings.business_info`. If it writes `year_founded` for a newly provisioned tenant (the function was NOT updated in T7 or T9), that would re-introduce the key and make every subsequent BusinessInfoSection save fail.

3. **Supabase JSONB returning cached/stale data**: Unlikely, but if `data.value` at line 26 contained `year_founded` for some reason, the exclusion destructure on line 33 would correctly strip it from `extras`. The constraint would only fire on SAVE, not on load. If the constraint is firing on save, the payload must contain `year_founded` — and the only payload source is `{ ...extraDbFields.current, ...form }`.

The compiled bundle shows zero `year_founded` in JS output, strongly pointing to **scenario 1 or 2** as the root cause rather than a code logic error in BusinessInfoSection.tsx itself.

---

### Bug 2 hypothesis (theme save not persisting)

**Where is the theme selector rendered?**
Lines 131–149. A `<button>` grid mapping the `templates` array. No `<select>`, no radio, no `<form>` wrapper. Buttons use `type` attribute omitted (defaults to `type="submit"` in a `<form>`, irrelevant here since there is no wrapping form element).

**What state variable backs it?**
`form.theme` (via `useState<BrandingForm>`). Clicking a button calls `setForm(prev => ({ ...prev, theme: t.value }))` (line 133).

**What key does it write to in the save payload?**
Line 69: `const { template: _t, ...value } = { ...form } as any`

The spread `{ ...form }` produces an object with key `theme` (among others). Destructuring `template: _t` from this object extracts a key named `template` — which **does not exist** in `form` after T9.3. `_t` gets `undefined`. The rest operator `...value` collects all remaining keys, which INCLUDES `theme`. So `value` = `{ logo_url, favicon_url, primary_color, accent_color, theme, cta_text, apply_hero_to_all_pages }`. `theme` IS in the payload.

The DB write should succeed and persist `theme`.

**Is the selector wired to something that would prevent updates?**

Not from source inspection — no `disabled`, no `readOnly`, handlers look correct. However, one notable issue:

`v.theme ?? prev.theme` on line 50 reads `v.theme` from the DB response. If the DB `branding` row's JSONB value does NOT have a `theme` key (e.g., for a tenant whose row predates T9.2 and whose branding was never re-saved post-T9.2 to pick up the SQL rename)... wait, T9.2 renamed the key on all 5 rows via SQL UPDATE. So all 5 rows should have `theme`.

The more likely explanation: the `apply_hero_to_all_pages` field is managed by BOTH `BrandingSection` (included in `form`) and `BrandingHeroMedia` (stored in the same `settings.branding` row). When BrandingSection saves, it overwrites the full `settings.branding` value including `apply_hero_to_all_pages: false` (the initial state default). If `BrandingHeroMedia` previously set `apply_hero_to_all_pages: true`, BrandingSection's save clobbers it — but this is unrelated to theme persistence.

**The one suspicious pattern in Bug 2**: `localStorage.setItem('pfp_template', form.theme)` — the localStorage key is `pfp_template`. `TenantBootProvider` reads from `pfp_tenant_boot_v2:${HOST}` (a separate key). `main.tsx` reads from `pfp_tenant_boot_v2:${HOST}` via `readCache()`. So the `pfp_template` key is effectively ORPHANED — nothing reads it to apply the theme on boot. The theme persists in the DB but the flash-prevention mechanism may not pick it up on next page load. If Scott is observing "theme doesn't apply until page settles" rather than "theme is not in the DB", this orphaned localStorage key is the cause — `TenantBootProvider` never reads `pfp_template`, so it always starts from whatever is in `pfp_tenant_boot_v2:${HOST}` (the stale boot cache that has the OLD theme).

The `pfp_tenant_boot_v2` cache is cleared on save (line 75): `localStorage.removeItem(`pfp_tenant_boot_v2:${...}`)`. On next page load, TenantBootProvider refetches via RPC since the cache is gone. The RPC now correctly returns `theme`. So the theme SHOULD apply correctly after a full page reload — but there's a flash window between when the page loads and when the RPC returns where the old theme (from `__TENANT_BOOT__` injected by the HTML boot script, if any) would show.
