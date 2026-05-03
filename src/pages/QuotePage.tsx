import { lazy, Suspense, useState, useEffect } from 'react'
import { formatPhone } from '../lib/formatPhone'
import { CheckCircle, Bug, Home, User, ClipboardCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import QuoteFormSteps, { type QuoteFormState } from '../components/QuoteFormSteps'
import { validateContactFields } from '../components/quoteFormUtils'
import { useTemplate } from '../context/TemplateContext'

const MetroProQuotePage = lazy(() => import('../shells/metro-pro/MetroProQuotePage'))

const STEPS = [
  { num: 1, label: 'Pest Type', icon: Bug },
  { num: 2, label: 'Property', icon: Home },
  { num: 3, label: 'Contact', icon: User },
  { num: 4, label: 'Review', icon: ClipboardCheck },
]

const INITIAL: QuoteFormState = {
  pests: [], propertyType: '', urgency: '', address: '',
  name: '', phone: '', email: '', referral: '', message: '', smsConsent: false,
  fieldErrors: {},
}

export default function QuotePage() {
  const { id: tenantId } = useTenant()
  const { template } = useTemplate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<QuoteFormState>(INITIAL)
  const [businessName, setBusinessName] = useState('PestFlow Pro')
  const [businessPhone, setBusinessPhone] = useState('')
  const [ownerSmsNumber, setOwnerSmsNumber] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [heroTitle, setHeroTitle] = useState('Get a Free Quote')
  const [heroSubtitle, setHeroSubtitle] = useState("Complete these 4 quick steps and we'll get back to you fast.")

  useEffect(() => {
    ;(async () => {
      const [bizRes, contentRes, intRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tenantId).eq('page_slug', 'quote').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        if (bizRes.data.value.name) setBusinessName(bizRes.data.value.name)
        if (bizRes.data.value.phone) setBusinessPhone(bizRes.data.value.phone)
      }
      if (contentRes.data?.title) setHeroTitle(contentRes.data.title)
      if (contentRes.data?.subtitle) setHeroSubtitle(contentRes.data.subtitle)
      if (intRes.data?.value?.owner_sms_number) setOwnerSmsNumber(intRes.data.value.owner_sms_number)
    })()
  }, [tenantId])

  function togglePest(pest: string) {
    setForm(prev => ({ ...prev, pests: prev.pests.includes(pest) ? prev.pests.filter(p => p !== pest) : [...prev.pests, pest] }))
  }

  function next() {
    if (step === 1 && form.pests.length === 0) { setError('Select at least one pest type.'); return }
    if (step === 2 && !form.propertyType) { setError('Select a property type.'); return }
    if (step === 3) {
      const errors = validateContactFields({ name: form.name, email: form.email, phone: form.phone })
      if (Object.keys(errors).length > 0) { setForm(prev => ({ ...prev, fieldErrors: errors })); return }
      if (!form.smsConsent) { setError('Please check the SMS consent box to continue.'); return }
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

    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    }
    if (form.smsConsent && form.phone) {
      fetch(fnUrl, { method: 'POST', headers, body: JSON.stringify({ tenant_id: tenantId, to: form.phone, message: `Hi ${form.name}, thanks for reaching out to ${businessName}! We received your quote request and will be in touch shortly.`, type: 'customer' }) }).catch(() => {})
    }
    if (ownerSmsNumber) {
      fetch(fnUrl, { method: 'POST', headers, body: JSON.stringify({ tenant_id: tenantId, to: ownerSmsNumber, message: `📋 New quote from ${form.name} — ${form.phone} — Service: ${form.pests.join(', ')}. Check your PestFlow Pro admin panel for details.`, type: 'owner' }) }).catch(() => {})
    }

    setSubmitted(true)
  }

  if (template === 'metro-pro') {
    return <Suspense fallback={null}><MetroProQuotePage businessName={businessName} businessPhone={businessPhone} /></Suspense>
  }

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="font-oswald tracking-wide text-4xl mb-4" style={{ color: 'var(--color-heading)' }}>Quote Request Received!</h1>
          <p className="text-gray-600 text-lg mb-2">We'll call you within 2 hours!</p>
          {businessPhone && <p className="text-gray-500">Need immediate help? Call <a href={`tel:${businessPhone}`} className="text-emerald-600 font-bold hover:underline">{businessPhone}</a></p>}
        </div>
      </div>
    )
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <section className="py-12" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-oswald tracking-wide text-4xl md:text-5xl text-center mb-2" style={{ color: 'var(--color-heading)' }}>{heroTitle}</h1>
          <p className="text-gray-600 text-center mb-8">{heroSubtitle}</p>
          <div className="flex items-center justify-between mb-10 max-w-lg mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div aria-label={`Step ${s.num} of 4: ${s.label}`} className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition ${step >= s.num ? 'text-white' : 'bg-gray-200 text-gray-500'}`} style={step >= s.num ? { backgroundColor: 'var(--color-primary)' } : undefined}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                {i < STEPS.length - 1 && <div className="w-12 sm:w-20 h-0.5 mx-1 transition" style={step > s.num ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: '#e5e7eb' }} />}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
            <QuoteFormSteps step={step} form={form} setForm={setForm} togglePest={togglePest} inputClass={inputClass} businessName={businessName} />
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button onClick={() => { setStep(s => s - 1); setError('') }} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg text-sm font-medium transition">Back</button>
              ) : <div />}
              {step < 4 ? (
                <button onClick={next} className="font-bold px-8 py-2.5 rounded-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Continue</button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="font-bold px-8 py-2.5 rounded-lg transition disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                  {submitting ? 'Submitting...' : 'Submit Quote Request'}
                </button>
              )}
            </div>
          </div>
          <div className="mt-8 rounded-xl p-6" style={{ background: 'var(--color-bg-hero)' }}>
            <h3 className="font-oswald tracking-wide text-xl mb-3" style={{ color: 'var(--color-primary)' }}>{businessName}</h3>
            {businessPhone && <a href={`tel:${businessPhone.replace(/\D/g, '')}`} className="text-2xl font-bold hover:underline block mb-4" style={{ color: 'var(--color-nav-text)' }}>{formatPhone(businessPhone)}</a>}
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>
              <li>✅ Free Estimates</li><li>✅ Same-Day Service</li><li>✅ Licensed & Insured</li><li>✅ Satisfaction Guaranteed</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
