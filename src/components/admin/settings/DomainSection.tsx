import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function DomainSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ custom_domain: '', subdomain: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('tenants').select('custom_domain, subdomain').eq('id', tenantId).maybeSingle()
      .then(({ data }) => {
        if (data) setForm({ custom_domain: data.custom_domain || '', subdomain: data.subdomain || '' })
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('tenants').update({ custom_domain: form.custom_domain || null, subdomain: form.subdomain || null }).eq('id', tenantId)
    setSaving(false)
    if (error) toast.error('Failed to save domain settings.'); else toast.success('Domain settings saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Custom Domain</h3>
        <p className="text-sm text-gray-500 mb-5">Connect your own domain to your PestFlow Pro website.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Domain</label>
            <input type="text" value={form.custom_domain} onChange={e => setForm(prev => ({ ...prev, custom_domain: e.target.value }))} placeholder="acmepestcontrol.com" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">Your purchased domain (without www or https://)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subdomain</label>
            <div className="flex items-center gap-1">
              <input type="text" value={form.subdomain} onChange={e => setForm(prev => ({ ...prev, subdomain: e.target.value }))} placeholder="acme" className={inputClass} />
              <span className="text-sm text-gray-400 whitespace-nowrap">.pestflowpro.com</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Free subdomain (used until custom domain is active)</p>
          </div>
        </div>
        {form.custom_domain && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
            <p className="text-sm text-emerald-800">Domain registered: <span className="font-mono font-medium">{form.custom_domain}</span></p>
          </div>
        )}
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Domain Settings'}
        </button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-semibold mb-2">Need Help?</p>
        <p className="text-sm text-blue-700 mb-1">📞 Phone: <a href="tel:+19035550100" className="underline">(903) 555-0100</a></p>
        <p className="text-sm text-blue-700">✉ Email: <a href="mailto:support@pestflowpro.com" className="underline">support@pestflowpro.com</a></p>
      </div>
    </div>
  )
}
