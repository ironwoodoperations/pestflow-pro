import { useState, useEffect } from 'react'
import { CheckCircle, Bug, Home, User, ClipboardCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HolidayBanner from '../components/HolidayBanner'

const PEST_OPTIONS = [
  'Mosquitoes', 'Spiders', 'Ants', 'Wasps/Hornets', 'Cockroaches',
  'Rodents', 'Termites', 'Bed Bugs', 'Fleas/Ticks', 'Scorpions', 'Other',
]

const PROPERTY_TYPES = ['Single Family Home', 'Apartment/Condo', 'Townhouse', 'Commercial', 'Rental Property', 'Other']
const URGENCY = ['Routine / Not Urgent', 'Within a Week', 'Within 48 Hours', 'Same Day Emergency']
const REFERRAL_OPTIONS = ['Google', 'Facebook', 'Referral', 'Yard Sign', 'Nextdoor', 'Other']

interface FormState {
  pests: string[]
  propertyType: string
  urgency: string
  address: string
  name: string
  phone: string
  email: string
  referral: string
  message: string
}

const INITIAL: FormState = { pests: [], propertyType: '', urgency: '', address: '', name: '', phone: '', email: '', referral: '', message: '' }

const STEPS = [
  { num: 1, label: 'Pest Type', icon: Bug },
  { num: 2, label: 'Property', icon: Home },
  { num: 3, label: 'Contact', icon: User },
  { num: 4, label: 'Review', icon: ClipboardCheck },
]

export default function QuotePage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [tenantId, setTenantId] = useState('')
  const [businessName, setBusinessName] = useState('PestFlow Pro')
  const [businessPhone, setBusinessPhone] = useState('(903) 555-0100')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [heroTitle, setHeroTitle] = useState('Get a Free Quote')
  const [heroSubtitle, setHeroSubtitle] = useState("Complete these 4 quick steps and we'll get back to you fast.")

  useEffect(() => {
    resolveTenantId().then(async (tid) => {
      if (!tid) return
      setTenantId(tid)
      const [bizRes, contentRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tid).eq('key', 'business_info').maybeSingle(),
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tid).eq('page_slug', 'quote').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        if (bizRes.data.value.name) setBusinessName(bizRes.data.value.name)
        if (bizRes.data.value.phone) setBusinessPhone(bizRes.data.value.phone)
      }
      if (contentRes.data?.title) setHeroTitle(contentRes.data.title)
      if (contentRes.data?.subtitle) setHeroSubtitle(contentRes.data.subtitle)
    })
  }, [])

  function togglePest(pest: string) {
    setForm(prev => ({ ...prev, pests: prev.pests.includes(pest) ? prev.pests.filter(p => p !== pest) : [...prev.pests, pest] }))
  }

  function next() {
    if (step === 1 && form.pests.length === 0) { setError('Select at least one pest type.'); return }
    if (step === 2 && !form.propertyType) { setError('Select a property type.'); return }
    if (step === 3) {
      if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) { setError('Name, phone, and email are required.'); return }
    }
    setError('')
    setStep(s => Math.min(s + 1, 4))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const { error: insertError } = await supabase.from('leads').insert({
      tenant_id: tenantId, name: form.name, email: form.email, phone: form.phone,
      services: form.pests, status: 'new',
      message: [
        form.propertyType && `Property: ${form.propertyType}`,
        form.urgency && `Urgency: ${form.urgency}`,
        form.address && `Address: ${form.address}`,
        form.referral && `Referral: ${form.referral}`,
        form.message,
      ].filter(Boolean).join('\n'),
    })
    setSubmitting(false)
    if (insertError) { setError('Something went wrong. Please call us directly.'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <HolidayBanner />
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="font-oswald tracking-wide text-4xl text-gray-900 mb-4">Quote Request Received!</h1>
          <p className="text-gray-600 text-lg mb-2">We'll call you within 2 hours!</p>
          <p className="text-gray-500">Need immediate help? Call <a href={`tel:${businessPhone}`} className="text-emerald-600 font-bold hover:underline">{businessPhone}</a></p>
        </div>
        <Footer />
      </div>
    )
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none'

  return (
    <div className="min-h-screen bg-white">
      <HolidayBanner />
      <Navbar />

      <section className="py-12 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-oswald tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-2">{heroTitle}</h1>
          <p className="text-gray-600 text-center mb-8">{heroSubtitle}</p>

          {/* Progress */}
          <div className="flex items-center justify-between mb-10 max-w-lg mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div aria-label={`Step ${s.num} of 4: ${s.label}`} className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition ${step >= s.num ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                {i < STEPS.length - 1 && <div className={`w-12 sm:w-20 h-0.5 mx-1 transition ${step > s.num ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

            {/* Step 1: Pest Type */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">What pests are you dealing with?</h2>
                <p className="text-gray-500 text-sm mb-6">Select all that apply.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PEST_OPTIONS.map(pest => (
                    <button key={pest} type="button" onClick={() => togglePest(pest)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition ${form.pests.includes(pest) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      {pest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Property */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about your property</h2>
                <p className="text-gray-500 text-sm mb-6">This helps us prepare the right treatment plan.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PROPERTY_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => setForm(p => ({ ...p, propertyType: t }))}
                          className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition ${form.propertyType === t ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">How urgent is this?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {URGENCY.map(u => (
                        <button key={u} type="button" onClick={() => setForm(p => ({ ...p, urgency: u }))}
                          className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition ${form.urgency === u ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Tyler TX" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact Info */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Your contact information</h2>
                <p className="text-gray-500 text-sm mb-6">We'll use this to send your free quote.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
                    <select value={form.referral} onChange={e => setForm(p => ({ ...p, referral: e.target.value }))} className={inputClass}>
                      <option value="">Select...</option>
                      {REFERRAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                    <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Anything else we should know?" className={`${inputClass} resize-none`} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Review your request</h2>
                <p className="text-gray-500 text-sm mb-6">Make sure everything looks good before submitting.</p>
                <div className="space-y-4 bg-[#f8fafc] rounded-lg p-5 border border-gray-100">
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pests</p><p className="text-gray-900">{form.pests.join(', ')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Property</p><p className="text-gray-900">{form.propertyType}{form.urgency && ` · ${form.urgency}`}</p></div>
                  {form.address && <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Address</p><p className="text-gray-900">{form.address}</p></div>}
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Contact</p><p className="text-gray-900">{form.name} · {form.phone} · {form.email}</p></div>
                  {form.message && <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Notes</p><p className="text-gray-700">{form.message}</p></div>}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button onClick={() => { setStep(s => s - 1); setError('') }} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg text-sm font-medium transition">
                  Back
                </button>
              ) : <div />}
              {step < 4 ? (
                <button onClick={next} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-2.5 rounded-lg transition">
                  Continue
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-2.5 rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Quote Request'}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar info below on mobile, could be side on lg */}
          <div className="mt-8 bg-[#0a0f1e] text-white rounded-xl p-6">
            <h3 className="font-oswald tracking-wide text-xl text-emerald-400 mb-3">{businessName}</h3>
            <a href={`tel:${businessPhone}`} className="text-2xl font-bold text-white hover:underline block mb-4">{businessPhone}</a>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>✅ Free Estimates</li><li>✅ Same-Day Service</li><li>✅ Licensed & Insured</li><li>✅ Satisfaction Guaranteed</li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
