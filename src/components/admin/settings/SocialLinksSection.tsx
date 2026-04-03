import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function SocialLinksSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ facebook: '', instagram: '', google: '', yelp: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'social_links').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, facebook: data.value.facebook || '', instagram: data.value.instagram || '', google: data.value.google || '', yelp: data.value.yelp || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'social_links', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save social links.'); else toast.success('Social links saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  const fields = [
    { label: 'Facebook URL', key: 'facebook' as const, placeholder: 'https://facebook.com/yourpage' },
    { label: 'Instagram URL', key: 'instagram' as const, placeholder: 'https://instagram.com/yourpage' },
    { label: 'Google Business Profile URL', key: 'google' as const, placeholder: 'https://g.page/yourbusiness' },
    { label: 'Yelp URL (optional)', key: 'yelp' as const, placeholder: 'https://yelp.com/biz/yourbusiness' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Social Links</h3>
      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            <input type="url" value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className={inputClass} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Social Links'}
        </button>
      </div>
    </div>
  )
}
