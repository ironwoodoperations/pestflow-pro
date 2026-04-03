import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

interface BusinessInfoForm {
  name: string; phone: string; email: string; address: string; hours: string
  tagline: string; license: string; after_hours_phone: string; year_founded: string
  industry: string
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function BusinessInfoSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<BusinessInfoForm>({ name: '', phone: '', email: '', address: '', hours: '', tagline: '', license: '', after_hours_phone: '', year_founded: '', industry: 'Pest Control' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, name: data.value.name || '', phone: data.value.phone || '', email: data.value.email || '', address: data.value.address || '', hours: data.value.hours || '', tagline: data.value.tagline || '', license: data.value.license || '', after_hours_phone: data.value.after_hours_phone || '', year_founded: data.value.year_founded || '', industry: data.value.industry || 'Pest Control' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'business_info', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save business info.'); else toast.success('Business info saved!')
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
    { label: 'Year Founded', key: 'year_founded', placeholder: '2010' },
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
