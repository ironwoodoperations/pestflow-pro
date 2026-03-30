import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const PEST_OPTIONS = [
  'Mosquitoes', 'Spiders', 'Ants', 'Wasps/Hornets', 'Cockroaches',
  'Rodents', 'Termites', 'Bed Bugs', 'Fleas/Ticks', 'Scorpions', 'Other',
]

const REFERRAL_OPTIONS = ['Google', 'Facebook', 'Referral', 'Yard Sign', 'Other']

interface FormState {
  name: string
  phone: string
  email: string
  address: string
  pests: string[]
  referral: string
  message: string
}

export default function QuotePage() {
  const [tenantId, setTenantId] = useState('')
  const [businessName, setBusinessName] = useState('PestFlow Pro')
  const [businessPhone, setBusinessPhone] = useState('(903) 555-0100')
  const [businessHours, setBusinessHours] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', phone: '', email: '', address: '', pests: [], referral: '', message: '' })

  useEffect(() => {
    resolveTenantId().then(async (tid) => {
      if (!tid) return
      setTenantId(tid)
      const { data } = await supabase.from('settings').select('value').eq('tenant_id', tid).eq('key', 'business_info').maybeSingle()
      if (data?.value) {
        if (data.value.name) setBusinessName(data.value.name)
        if (data.value.phone) setBusinessPhone(data.value.phone)
        if (data.value.hours) setBusinessHours(data.value.hours)
      }
    })
  }, [])

  function updateField(field: keyof FormState, value: string) { setForm((prev) => ({ ...prev, [field]: value })) }
  function togglePest(pest: string) {
    setForm((prev) => ({ ...prev, pests: prev.pests.includes(pest) ? prev.pests.filter((p) => p !== pest) : [...prev.pests, pest] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) { setError('Please fill in your name, phone, and email.'); return }
    setSubmitting(true)
    const { error: insertError } = await supabase.from('leads').insert({
      tenant_id: tenantId, name: form.name, email: form.email, phone: form.phone, services: form.pests,
      message: [form.address && `Address: ${form.address}`, form.referral && `Referral: ${form.referral}`, form.message].filter(Boolean).join('\n'),
    })
    setSubmitting(false)
    if (insertError) { setError('Something went wrong. Please call us directly.'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="font-bangers tracking-wide text-4xl text-gray-900 mb-4">Quote Request Received!</h1>
          <p className="text-gray-600 text-lg mb-2">We'll call you within 2 hours!</p>
          <p className="text-gray-500">Need immediate help? Call us at <a href={`tel:${businessPhone}`} className="text-emerald-600 font-bold hover:underline">{businessPhone}</a></p>
        </div>
        <Footer />
      </div>
    )
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-12 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-2">Get a Free Quote</h1>
          <p className="text-gray-600 text-center mb-10">Fill out the form below and we'll get back to you fast.</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label><input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label><input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} className={inputClass} /></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pest Problem (select all that apply)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PEST_OPTIONS.map((pest) => (
                    <label key={pest} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={form.pests.includes(pest)} onChange={() => togglePest(pest)} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />{pest}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
                <select value={form.referral} onChange={(e) => updateField('referral', e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  {REFERRAL_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message / Additional Details</label>
                <textarea value={form.message} onChange={(e) => updateField('message', e.target.value)} rows={4} className={`${inputClass} resize-none`} />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-4 text-lg transition disabled:opacity-50">
                {submitting ? 'Sending...' : 'Request My Free Quote'}
              </button>
            </form>

            <div className="space-y-6">
              <div className="bg-[#0a0f1e] text-white rounded-xl p-6">
                <h3 className="font-bangers tracking-wide text-xl text-emerald-400 mb-3">{businessName}</h3>
                <a href={`tel:${businessPhone}`} className="text-2xl font-bold text-white hover:underline block mb-4">{businessPhone}</a>
                <h4 className="font-bold text-sm text-gray-400 uppercase mb-2">Why Call Us?</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>✅ Free Estimates</li><li>✅ Same-Day Service</li><li>✅ Licensed & Insured</li><li>✅ Satisfaction Guaranteed</li>
                </ul>
                {businessHours && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="font-bold text-sm text-gray-400 uppercase mb-1">Hours</h4>
                    <p className="text-gray-300 text-sm">{businessHours}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
