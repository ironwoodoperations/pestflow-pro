import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

const STEPS = [
  { num: 1, title: 'Purchase your domain', desc: 'Buy a domain from any registrar (Namecheap, GoDaddy, Google Domains, etc.). Example: acmepestcontrol.com' },
  { num: 2, title: 'Enter your domain above', desc: 'Type your domain into the Custom Domain field above and click Save.' },
  { num: 3, title: 'Add domain in Vercel', desc: 'Go to your Vercel project → Settings → Domains → Add Domain.' },
  { num: 4, title: 'Configure DNS records', desc: 'At your domain registrar, add these DNS records:\n\n• A Record: @ → 76.76.21.21\n• CNAME Record: www → cname.vercel-dns.com' },
  { num: 5, title: 'Wait for SSL', desc: 'Vercel automatically provisions a free SSL certificate. Usually takes 1-5 minutes after DNS propagation.' },
  { num: 6, title: 'Verify', desc: 'Visit your custom domain in a browser. Your PestFlow Pro site should load with HTTPS.' },
]

export default function DomainSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ custom_domain: '', subdomain: '' })
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

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

  function toggleStep(num: number) {
    setCompletedSteps(prev => prev.includes(num) ? prev.filter(s => s !== num) : [...prev, num])
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Setup Checklist</h3>
        <p className="text-sm text-gray-500 mb-5">Follow these steps to connect your domain. Check each step as you complete it.</p>
        <div className="space-y-4">
          {STEPS.map(step => {
            const done = completedSteps.includes(step.num)
            return (
              <div key={step.num} className={`flex gap-4 p-3 rounded-lg transition-colors ${done ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}>
                <button type="button" onClick={() => toggleStep(step.num)} aria-label={`Mark step ${step.num} as ${done ? 'incomplete' : 'complete'}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 transition-colors border-2 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-gray-400 hover:border-emerald-400'}`}>
                  {done ? '✓' : step.num}
                </button>
                <div>
                  <h4 className={`text-sm font-semibold ${done ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {completedSteps.length === STEPS.length
            ? <span className="text-emerald-600 font-medium">All steps completed — your domain should be live!</span>
            : <span>{completedSteps.length} of {STEPS.length} steps completed</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-1">Need help?</p>
          <p className="text-sm text-blue-700">Domain setup typically takes 5-10 minutes. DNS changes can take up to 48 hours to propagate worldwide, but usually complete within 15 minutes.</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">DNS Records Quick Reference</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th className="pr-4 py-1">Type</th><th className="pr-4 py-1">Name</th><th className="py-1">Value</th></tr></thead>
              <tbody className="text-gray-700 font-mono text-xs">
                <tr><td className="pr-4 py-1">A</td><td className="pr-4 py-1">@</td><td className="py-1">76.76.21.21</td></tr>
                <tr><td className="pr-4 py-1">CNAME</td><td className="pr-4 py-1">www</td><td className="py-1">cname.vercel-dns.com</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
