import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { applyShellTheme, getPalettesForShell } from '../../../lib/shellThemes'
import BrandingLogo from './BrandingLogo'

interface BrandingForm {
  logo_url: string; favicon_url: string; primary_color: string; accent_color: string
  template: 'modern-pro' | 'bold-local' | 'clean-friendly' | 'rustic-rugged'
  cta_text: string
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

const templates: { value: BrandingForm['template']; label: string; desc: string; bg: string; accent: string }[] = [
  { value: 'modern-pro',     label: 'Modern Pro',       desc: 'Dark navy navbar, emerald CTAs, Oswald headlines.',   bg: '#0a0f1e', accent: '#10b981' },
  { value: 'bold-local',     label: 'Bold & Local',     desc: 'Charcoal background, amber accents. High-energy.',    bg: '#1c1c1c', accent: '#d97706' },
  { value: 'clean-friendly', label: 'Clean & Friendly', desc: 'White navbar, sky-blue accents. Approachable.',       bg: '#ffffff', accent: '#0284c7' },
  { value: 'rustic-rugged',  label: 'Rustic & Rugged',  desc: 'Warm brown, rust orange. Established & trustworthy.', bg: '#3b1f0e', accent: '#c2410c' },
]

export default function BrandingSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<BrandingForm>({
    logo_url: '', favicon_url: '', primary_color: '#10b981', accent_color: '#f5c518', template: 'modern-pro', cta_text: ''
  })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, ...data.value }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'branding', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) { toast.error('Failed to save branding settings.'); return }
    applyShellTheme(form.template, form.primary_color, form.accent_color)
    localStorage.setItem('pfp_template', form.template)
    toast.success('Branding settings saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="space-y-4">
      <details className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <summary className="text-sm font-semibold text-blue-900 cursor-pointer select-none">🎨 Branding — How to use this</summary>
        <div className="mt-3 text-sm text-blue-800 space-y-2">
          <p>This controls how your website looks — your colors, logo, and style.</p>
          <ul className="list-none space-y-1">
            <li><strong>LOGO</strong> — Upload your company logo. Best size: 200×60px, PNG with transparent background.</li>
            <li><strong>PRIMARY COLOR</strong> — Your main brand color. Used for buttons and accents.</li>
            <li><strong>TEMPLATE</strong> — Modern Pro | Bold & Local | Clean & Friendly | Rustic & Rugged</li>
          </ul>
        </div>
      </details>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h3 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">Branding</h3>

        {tenantId && (
          <BrandingLogo
            tenantId={tenantId}
            logoUrl={form.logo_url}
            faviconUrl={form.favicon_url}
            onChange={(field, val) => setForm(prev => ({ ...prev, [field]: val }))}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
            <div className="flex gap-2">
              <input type="color" value={form.primary_color} onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value }))}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
              <input type="text" value={form.primary_color} onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value }))} className={`flex-1 ${inputClass}`} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Accent Color</label>
            <div className="flex gap-2">
              <input type="color" value={form.accent_color} onChange={e => setForm(prev => ({ ...prev, accent_color: e.target.value }))}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
              <input type="text" value={form.accent_color} onChange={e => setForm(prev => ({ ...prev, accent_color: e.target.value }))} className={`flex-1 ${inputClass}`} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Template</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map(t => (
              <button key={t.value} onClick={() => setForm(prev => ({ ...prev, template: t.value }))}
                className={`text-left p-4 rounded-xl border-2 transition ${form.template === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex flex-shrink-0">
                    <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: t.bg }} />
                    <div className="w-5 h-5 rounded-full border border-gray-200 -ml-1.5" style={{ background: t.accent }} />
                  </div>
                  <h4 className="text-gray-900 font-bold">{t.label}</h4>
                  {form.template === t.value && <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-gray-500 text-sm">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Color Palette</label>
          <div className="grid grid-cols-3 gap-3">
            {getPalettesForShell(form.template).map(p => {
              const isActive = form.primary_color === p.primary && form.accent_color === p.accent
              return (
                <button key={p.id} type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, primary_color: p.primary, accent_color: p.accent }))
                    applyShellTheme(form.template, p.primary, p.accent)
                  }}
                  className={`rounded-xl border-2 overflow-hidden transition ${isActive ? 'border-emerald-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex h-10">
                    <div className="flex-1" style={{ background: p.primary }} />
                    <div className="w-1/3" style={{ background: p.accent }} />
                  </div>
                  <div className="px-2 py-1.5 bg-white">
                    <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                    {isActive && <p className="text-xs text-emerald-600 font-semibold">Active</p>}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">Pick a preset or use the color pickers below for custom colors.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Button Text</label>
          <input type="text" maxLength={40} value={form.cta_text} onChange={e => setForm(prev => ({ ...prev, cta_text: e.target.value }))}
            placeholder="Get a Free Quote" className={inputClass} />
          <p className="text-xs text-gray-400 mt-1">The primary call-to-action button on your site</p>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  )
}
