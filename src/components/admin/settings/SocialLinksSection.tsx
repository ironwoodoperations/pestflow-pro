import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function SocialLinksSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ owner_sms_number: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      .then(({ data }) => {
        if (data?.value?.owner_sms_number) {
          setForm({ owner_sms_number: data.value.owner_sms_number })
        }
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { data: existing } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
    const merged = { ...(existing?.value || {}), owner_sms_number: form.owner_sms_number }
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'integrations', value: merged }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save.'); else toast.success('Saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Owner Cell / SMS Number</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Cell / SMS Number</label>
          <input
            type="tel"
            value={form.owner_sms_number}
            onChange={e => setForm({ owner_sms_number: e.target.value })}
            placeholder="(512) 555-0100"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">Used for internal notifications only — not shown on your website.</p>
        </div>
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
