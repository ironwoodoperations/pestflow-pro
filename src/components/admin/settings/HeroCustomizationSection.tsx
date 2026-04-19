import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { triggerRevalidate } from '../../../lib/revalidate'

interface CustomizationForm {
  hero_headline: string
  show_license: boolean
  show_years: boolean
  show_technicians: boolean
  show_certifications: boolean
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

const INITIAL: CustomizationForm = {
  hero_headline: '',
  show_license: true,
  show_years: true,
  show_technicians: false,
  show_certifications: false,
}

export default function HeroCustomizationSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<CustomizationForm>(INITIAL)

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm({
          hero_headline: data.value.hero_headline || '',
          show_license: data.value.show_license ?? true,
          show_years: data.value.show_years ?? true,
          show_technicians: data.value.show_technicians ?? false,
          show_certifications: data.value.show_certifications ?? false,
        })
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert(
      { tenant_id: tenantId, key: 'customization', value: form },
      { onConflict: 'tenant_id,key' }
    )
    setSaving(false)
    if (error) { toast.error(`Failed to save customization: ${error.message}`); return }
    toast.success('✅ Customization saved')
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (accessToken && tenantId) await triggerRevalidate({ type: 'settings', tenantId }, accessToken)
  }

  if (loading) return null

  const BADGES = [
    { label: 'License Number', key: 'show_license' as const },
    { label: 'Years in Business', key: 'show_years' as const },
    { label: 'Number of Technicians', key: 'show_technicians' as const },
    { label: 'Certifications', key: 'show_certifications' as const },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1 pb-3 border-b border-gray-100">Hero Customization</h3>
      <p className="text-xs text-gray-400 mb-4">Controls the headline and trust badges shown on your homepage hero.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Headline</label>
          <input
            type="text"
            maxLength={80}
            value={form.hero_headline}
            onChange={(e) => setForm(prev => ({ ...prev, hero_headline: e.target.value }))}
            placeholder="Leave blank to use your tagline"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">The main headline visitors see on your homepage</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Show in Hero</label>
          <div className="flex flex-wrap gap-4">
            {BADGES.map((b) => (
              <label key={b.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form[b.key]}
                  onChange={(e) => setForm(prev => ({ ...prev, [b.key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                />
                {b.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Badge only appears if the corresponding value is set in Business Info</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Customization'}
        </button>
      </div>
    </div>
  )
}
