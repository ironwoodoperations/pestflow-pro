import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function HolidayModeSection() {
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ enabled: false, holiday: '', message: '', auto_schedule: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'holiday_mode').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, enabled: data.value.enabled || false, holiday: data.value.holiday || '', message: data.value.message || '', auto_schedule: data.value.auto_schedule || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function save(updated?: Partial<typeof form>) {
    if (!tenantId) return
    const value = updated ? { ...form, ...updated } : form
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'holiday_mode', value }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save.'); else toast.success('Holiday mode updated!')
  }

  async function toggleEnabled() {
    const enabled = !form.enabled
    setForm(p => ({ ...p, enabled }))
    await save({ enabled })
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Holiday Mode</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Enable Holiday Banner</p>
            <p className="text-xs text-gray-500 mt-0.5">Shows a yellow banner on all public pages</p>
          </div>
          <button onClick={toggleEnabled} className={`relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Holiday Name</label>
          <select value={form.holiday} onChange={e => setForm(p => ({ ...p, holiday: e.target.value }))} className={`${inputClass} bg-white`}>
            <option value="">Select holiday...</option>
            {['Christmas', 'Thanksgiving', "New Year's", 'Memorial Day', 'Labor Day', 'Fourth of July', 'Custom'].map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Message</label>
          <input value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="We may have modified hours. Call to confirm." className={inputClass} />
        </div>
        <button onClick={() => save()} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Holiday Settings'}
        </button>
      </div>
    </div>
  )
}
