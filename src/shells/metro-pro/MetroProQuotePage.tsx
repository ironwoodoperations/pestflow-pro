import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { formatPhone } from '../../lib/formatPhone'

const PEST_OPTIONS = [
  'Ants', 'Bed Bugs', 'Cockroaches', 'Fleas & Ticks', 'Mosquitoes',
  'Rodents', 'Spiders', 'Termites', 'Wasps & Hornets', 'Other',
]

const SERVICE_OPTIONS = [
  'General Pest Control', 'Termite Inspection', 'Termite Treatment',
  'Rodent Control', 'Mosquito Treatment', 'Bed Bug Treatment',
  'One-Time Treatment', 'Recurring Service Plan',
]

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  service: string
  address: string
  pestConcern: string
}

const INITIAL: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  service: '', address: '', pestConcern: '',
}

interface Props {
  tenantId?: string
  businessName?: string
  businessPhone?: string
}

export default function MetroProQuotePage({ tenantId: propTenantId, businessName: propBizName, businessPhone: propBizPhone }: Props) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [tenantId, setTenantId] = useState(propTenantId || '')
  const [, setBusinessName] = useState(propBizName || '')
  const [businessPhone, setBusinessPhone] = useState(propBizPhone || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (propTenantId && propBizName) return
    resolveTenantId().then(async (tid) => {
      if (!tid) return
      setTenantId(tid)
      const bizRes = await supabase.from('settings').select('value').eq('tenant_id', tid).eq('key', 'business_info').maybeSingle()
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (bizRes.data?.value?.phone) setBusinessPhone(bizRes.data.value.phone)
    })
  }, [propTenantId, propBizName])

  function set(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function validateStep1(): string | null {
    if (!form.firstName.trim()) return 'First name is required.'
    if (!form.lastName.trim()) return 'Last name is required.'
    if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    return null
  }

  function validateStep2(): string | null {
    if (!form.service) return 'Please select a service type.'
    if (!form.address.trim()) return 'Address is required.'
    return null
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    setStep(s => Math.min(s + 1, 3))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const { error: insertError } = await supabase.from('leads').insert({
      tenant_id: tenantId,
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      phone: form.phone,
      services: [form.service].filter(Boolean),
      status: 'new',
      message: [
        form.address && `Address: ${form.address}`,
        form.pestConcern && `Pest concern: ${form.pestConcern}`,
      ].filter(Boolean).join('\n'),
    })
    setSubmitting(false)
    if (insertError) { setError('Something went wrong. Please call us directly.'); return }
    setSubmitted(true)
  }

  const STEPS = [
    { num: 1, label: 'Contact Info' },
    { num: 2, label: 'Service Info' },
    { num: 3, label: 'Confirmation' },
  ]

  const inp = 'w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm focus:ring-2 focus:border-transparent outline-none transition'
  const inpFocusStyle = { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-heading)' }}>Thank You!</h1>
          <p className="text-gray-600 text-lg mb-2">We'll be in touch within 24 hours.</p>
          {businessPhone && (
            <p className="text-gray-500 text-sm">
              Need immediate help? Call <a href={`tel:${businessPhone.replace(/\D/g, '')}`} className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>{formatPhone(businessPhone)}</a>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--color-heading)' }}>
              Schedule a Free Inspection
            </h1>
            <p className="text-gray-500">Complete the form below and we'll get back to you fast.</p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition"
                      style={step >= s.num
                        ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                        : { backgroundColor: '#e5e7eb', color: '#9ca3af' }}
                    >
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 hidden sm:block">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-3 transition" style={{ backgroundColor: step > s.num ? 'var(--color-primary)' : '#e5e7eb' }} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500">Step {step} of 3 — {STEPS[step - 1].label}</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">{error}</div>}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-heading)' }}>Contact Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">First Name *</label>
                    <input className={inp} style={inpFocusStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Last Name *</label>
                    <input className={inp} style={inpFocusStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Email Address *</label>
                  <input type="email" className={inp} style={inpFocusStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Phone Number *</label>
                  <input type="tel" className={inp} style={inpFocusStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 555-5555" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-heading)' }}>Service Information</h2>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Service Type *</label>
                  <select className={inp} style={inpFocusStyle} value={form.service} onChange={e => set('service', e.target.value)}>
                    <option value="">— Select a service —</option>
                    {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Service Address *</label>
                  <input className={inp} style={inpFocusStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City, State 12345" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Pest Concern (optional)</label>
                  <select className={inp} style={inpFocusStyle} value={form.pestConcern} onChange={e => set('pestConcern', e.target.value)}>
                    <option value="">— Select pest type —</option>
                    {PEST_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--color-heading)' }}>Review &amp; Submit</h2>
                <div className="space-y-3 text-sm bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{form.firstName} {form.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{form.phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{form.service || 'N/A'}</span></div>
                  {form.address && <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium">{form.address}</span></div>}
                  {form.pestConcern && <div className="flex justify-between"><span className="text-gray-500">Pest</span><span className="font-medium">{form.pestConcern}</span></div>}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  By submitting this form, you agree to be contacted about your pest control inquiry. We respect your privacy and will never share your information.
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {step > 1
                ? <button onClick={() => { setStep(s => s - 1); setError('') }} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-2.5 rounded-lg text-sm font-medium transition">Back</button>
                : <div />
              }
              {step < 3
                ? <button onClick={nextStep} className="font-semibold px-8 py-2.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>Continue</button>
                : <button onClick={handleSubmit} disabled={submitting} className="font-semibold px-8 py-2.5 rounded-lg text-white transition disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>
              }
            </div>
          </div>

          {/* Contact info box */}
          {businessPhone && (
            <div className="mt-6 rounded-xl p-5 text-center" style={{ backgroundColor: 'var(--color-bg-hero)' }}>
              <p className="text-white/70 text-sm mb-1">Prefer to talk to someone?</p>
              <a href={`tel:${businessPhone.replace(/\D/g, '')}`} className="text-xl font-bold text-white hover:underline">
                {formatPhone(businessPhone)}
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
