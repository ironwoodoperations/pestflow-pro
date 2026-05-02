import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { syncServiceAreasJsonb } from '../../lib/service-areas/syncJsonbFromTable'
import type { FormData } from '../../components/admin/onboarding/types'
import { INITIAL_FORM } from '../../components/admin/onboarding/types'
import StepWelcome from '../../components/admin/onboarding/StepWelcome'
import StepBusinessInfo from '../../components/admin/onboarding/StepBusinessInfo'
import StepSocialLinks from '../../components/admin/onboarding/StepSocialLinks'
import StepBranding from '../../components/admin/onboarding/StepBranding'
import StepLocations from '../../components/admin/onboarding/StepLocations'
import StepReview from '../../components/admin/onboarding/StepReview'

const STEPS = [
  { num: 1, title: 'Welcome' },
  { num: 2, title: 'Business Info' },
  { num: 3, title: 'Social Links' },
  { num: 4, title: 'Branding' },
  { num: 5, title: 'Locations' },
  { num: 6, title: 'Launch' },
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const { id: tenantId } = useTenant()
  const navigate = useNavigate()

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => { if (data?.value?.name) setBusinessName(data.value.name) })
  }, [tenantId])

  const totalSteps = STEPS.length
  const progress = (step / totalSteps) * 100

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const addLocation = () => {
    if (form.locations.length >= 6) return
    setForm(prev => ({ ...prev, locations: [...prev.locations, { city: '', slug: '' }] }))
  }

  const removeLocation = (index: number) => {
    setForm(prev => ({ ...prev, locations: prev.locations.filter((_, i) => i !== index) }))
  }

  const updateLocation = (index: number, field: 'city' | 'slug', value: string) => {
    setForm(prev => ({ ...prev, locations: prev.locations.map((loc, i) => i === index ? { ...loc, [field]: value } : loc) }))
  }

  const handleLaunch = async () => {
    if (!tenantId || saving) return
    setSaving(true)
    const settingsRows = [
      // S168.3.2: 10 structured address/geo/hours keys deliberately omitted.
      // These are admin-only fields, filled post-provision via BusinessInfoSection.
      // CHECK constraint atomicity rules accept the zero-present state.
      { tenant_id: tenantId, key: 'business_info', value: { name: form.businessName, phone: form.phone, email: form.email, address: form.address, hours: form.hours, tagline: form.tagline, license: form.license, industry: form.industry } },
      { tenant_id: tenantId, key: 'branding', value: { logo_url: form.logoUrl, favicon_url: '', primary_color: form.primaryColor, accent_color: form.accentColor, theme: form.template } },
      { tenant_id: tenantId, key: 'social_links', value: { facebook: form.facebook, instagram: form.instagram, google: form.google, youtube: form.youtube } },
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: true } },
      { tenant_id: tenantId, key: 'legal_acceptance', value: { accepted: true, timestamp: new Date().toISOString(), plan: 'starter', terms_version: '2026-04' } },
    ]
    for (const row of settingsRows) {
      await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
    }
    const locationRows = form.locations.filter(l => l.city && l.slug).map(l => ({ tenant_id: tenantId, city: l.city, slug: l.slug, is_live: false }))
    if (locationRows.length > 0) {
      await supabase.from('service_areas').upsert(locationRows, { onConflict: 'tenant_id,slug' })
      await syncServiceAreasJsonb(supabase, tenantId)
    }
    // Bridge to Ironwood CRM — upsert prospect so it appears in pipeline
    await supabase.from('prospects').upsert({
      status: 'onboarding',
      company_name: form.businessName || '',
      phone: form.phone || null,
      email: form.email || null,
      tenant_id: tenantId,
      business_info: { name: form.businessName, phone: form.phone, email: form.email, address: form.address, hours: form.hours, tagline: form.tagline, industry: form.industry, license: form.license },
      branding: { logo_url: form.logoUrl, primary_color: form.primaryColor, accent_color: form.accentColor, template: form.template },
    }, { onConflict: 'tenant_id' })
    navigate('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-200">
        <div className="h-full bg-emerald-500 transition-all duration-500 rounded-r-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Step indicators */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-2">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step > s.num ? 'bg-emerald-500 text-white' : step === s.num ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 sm:w-10 h-0.5 mx-1 ${step > s.num ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm">Step {step} of {totalSteps} — {STEPS[step - 1].title}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-oswald text-3xl text-emerald-500 text-center mb-8 tracking-wide">PestFlow Pro</h1>

        {step === 1 && <StepWelcome businessName={businessName || 'Your New Website'} onNext={() => setStep(2)} />}
        {step === 2 && <StepBusinessInfo form={form} updateField={updateField} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepSocialLinks form={form} updateField={updateField} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepBranding form={form} updateField={updateField} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {step === 5 && <StepLocations form={form} addLocation={addLocation} removeLocation={removeLocation} updateLocation={updateLocation} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
        {step === 6 && <StepReview form={form} saving={saving} onLaunch={handleLaunch} onBack={() => setStep(5)} goToStep={setStep} updateField={updateField} />}
      </div>
    </div>
  )
}
