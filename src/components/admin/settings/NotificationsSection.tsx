import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function NotificationsSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ lead_email: '', cc_email: '', owner_sms_number: '', monthly_report_email: '', notify_new_lead: true, weekly_seo_digest: false })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'notifications').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, lead_email: data.value.lead_email || '', cc_email: data.value.cc_email || '', owner_sms_number: data.value.owner_sms_number || '', monthly_report_email: data.value.monthly_report_email || '', notify_new_lead: data.value.notify_new_lead !== false, weekly_seo_digest: data.value.weekly_seo_digest === true }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'notifications', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save notification settings.'); else toast.success('Notification settings saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="space-y-4">
      <details className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <summary className="text-sm font-semibold text-blue-900 cursor-pointer select-none">🔔 Notifications — How to use this</summary>
        <div className="mt-3 text-sm text-blue-800 space-y-2">
          <p>This controls where you get notified when something happens on your site.</p>
          <ul className="list-none space-y-1">
            <li><strong>LEAD EMAIL</strong> — Where new quote requests get emailed. Use the inbox you check most.</li>
            <li><strong>CC EMAIL</strong> — Optional second email to copy (like an office manager)</li>
            <li><strong>SMS LEAD NOTIFICATIONS</strong> — Your mobile number to get a text the instant a new lead comes in</li>
            <li><strong>MONTHLY REPORT EMAIL</strong> — Where your monthly summary report gets sent</li>
          </ul>
          <p className="text-blue-700 italic">💡 Set your lead email to a phone-connected inbox so you get a notification the moment a lead comes in.</p>
        </div>
      </details>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Notifications</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead Notification Email</label>
            <input type="email" value={form.lead_email} onChange={e => setForm(prev => ({ ...prev, lead_email: e.target.value }))} placeholder="leads@yourbusiness.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CC Email (optional)</label>
            <input type="email" value={form.cc_email} onChange={e => setForm(prev => ({ ...prev, cc_email: e.target.value }))} placeholder="manager@yourbusiness.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SMS Lead Notifications</label>
            <input type="tel" value={form.owner_sms_number} onChange={e => setForm(prev => ({ ...prev, owner_sms_number: e.target.value }))} placeholder="9035551234" className={inputClass} />
            <p className="text-xs text-gray-500 mt-1">Enter your mobile number to receive a text for every new lead.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Report Email (optional)</label>
            <input type="email" value={form.monthly_report_email} onChange={e => setForm(prev => ({ ...prev, monthly_report_email: e.target.value }))} placeholder="owner@yourbusiness.com" className={inputClass} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" checked={form.notify_new_lead} onChange={e => setForm(prev => ({ ...prev, notify_new_lead: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
            <label className="text-sm text-gray-700">Notify on new lead</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.weekly_seo_digest} onChange={e => setForm(prev => ({ ...prev, weekly_seo_digest: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
            <label className="text-sm text-gray-700">Weekly SEO digest email</label>
          </div>
        </div>
        <div className="mt-6">
          <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Notifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
