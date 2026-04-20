# BrandingSection.tsx extract for Bug 2 diagnosis

Note: file is at `src/components/admin/settings/BrandingSection.tsx` (not `sections/`).

Total file length: 183 lines

## Snippet A — imports + initial state (lines 1–34)

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

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

const templates: { value: BrandingForm['theme']; label: string; desc: string; bg: string; accent: string; proOnly?: boolean }[] = [
  { value: 'modern-pro',     label: 'Modern Pro',              desc: 'Dark navy navbar, emerald CTAs, Oswald headlines.',        bg: '#0a0f1e', accent: '#10b981' },
  { value: 'bold-local',     label: 'Bold & Local',            desc: 'Charcoal background, amber accents. High-energy.',         bg: '#1c1c1c', accent: '#d97706' },
  { value: 'clean-friendly', label: 'Clean & Friendly',        desc: 'White navbar, sky-blue accents. Approachable.',            bg: '#ffffff', accent: '#0284c7' },
  { value: 'rustic-rugged',  label: 'Rustic & Rugged',         desc: 'Warm brown, rust orange. Established & trustworthy.',      bg: '#3b1f0e', accent: '#c2410c' },
  { value: 'metro-pro',      label: 'Metro Pro',               desc: 'Dark enterprise navbar, strong typography, metropolitan. Pro & Elite.', bg: '#0D2137', accent: '#00ACC1', proOnly: true },
  { value: 'youpest',        label: 'YouPest AI Quick Build',  desc: 'AI-generated layout from your scraped site. Same-day launch.', bg: '#312e81', accent: '#818cf8', proOnly: true },
]

export default function BrandingSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tierNum, setTierNum] = useState(1)
  const [form, setForm] = useState<BrandingForm>({
    logo_url: '', favicon_url: '', primary_color: '#10b981', accent_color: '#f5c518', theme: 'modern-pro', cta_text: '', apply_hero_to_all_pages: false
  })
```

## Snippet B — DB load into form state (lines 36–63)

```tsx
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
          theme:         v.theme         ?? prev.theme,
          cta_text:                v.cta_text                ?? prev.cta_text,
          apply_hero_to_all_pages: v.apply_hero_to_all_pages ?? false,
        }))
      }
      const TIER_RANK: Record<string, number> = { starter: 1, grow: 2, pro: 3, elite: 4 }
      const rawTier = subRes.data?.value?.tier
      if (rawTier != null) {
        const n = typeof rawTier === 'number' ? rawTier : (TIER_RANK[String(rawTier).toLowerCase()] ?? Number(rawTier))
        setTierNum(n || 1)
      }
      setLoading(false)
    })
  }, [tenantId])
```

## Snippet C — Theme card rendering + Active badge + onClick (lines 129–150)

```tsx
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.filter(t => !t.proOnly || tierNum >= 3).map(t => (
              <button key={t.value} onClick={() => setForm(prev => ({ ...prev, theme: t.value }))}
                className={`text-left p-4 rounded-xl border-2 transition ${form.theme === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex flex-shrink-0">
                    <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: t.bg }} />
                    <div className="w-5 h-5 rounded-full border border-gray-200 -ml-1.5" style={{ background: t.accent }} />
                  </div>
                  <h4 className="text-gray-900 font-bold">{t.label}</h4>
                  <div className="ml-auto flex items-center gap-1.5">
                    {t.proOnly && <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Pro</span>}
                    {form.theme === t.value && <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                </div>
                <p className="text-gray-500 text-sm">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
```

## Snippet D — save handler + localStorage (lines 65–80)

```tsx
  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    // T9 contract: strip any stray legacy 'template' key — CHECK constraint enforces at DB layer too
    const { template: _t, ...value } = { ...form } as any
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'branding', value }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) { toast.error(`Failed to save branding settings: ${error.message}`); return }
    applyTheme(form.theme, form.primary_color, form.accent_color)
    localStorage.setItem('pfp_template', form.theme)
    try { localStorage.removeItem(`pfp_tenant_boot_v2:${window.location.hostname}`); delete (window as any).__TENANT_BOOT__ } catch {}
    toast.success('Branding settings saved!')
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (accessToken && tenantId) await triggerRevalidate({ type: 'settings', tenantId }, accessToken)
  }
```

## Bonus — BrandingForm interface (lines 10–14, this file)

```tsx
interface BrandingForm {
  logo_url: string; favicon_url: string; primary_color: string; accent_color: string
  theme: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged' | 'youpest' | 'dang' | (string & {})
  cta_text: string; apply_hero_to_all_pages: boolean
}
```

Defined inline in `BrandingSection.tsx`. Not imported from a shared types file. No other `Branding*` interface exists in this file.
