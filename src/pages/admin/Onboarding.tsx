import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { syncServiceAreasJsonb } from '../../lib/service-areas/syncJsonbFromTable'
import { resolveBusinessInfoValue } from '../../lib/businessInfoMerge'
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
      .then(({ data }) => {
        if (data?.value?.name) setBusinessName(data.value.name)
        // S290 — PRELOAD THE RECORDED VERTICAL. handleLaunch below writes
        // business_info as a whole replacement value, so without this the client
        // finishing onboarding would blank the vertical that provisioning had
        // just recorded, and every preset would silently fall back to neutral.
        const v = data?.value?.vertical
        if (v === 'pest' || v === 'irrigation') setForm(prev => ({ ...prev, vertical: v }))
      })
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

    // S292 — the nine fields this wizard collects. Everything else in the row
    // survives untouched via mergeBusinessInfo.
    //
    // The old comment here claimed "10 structured address/geo/hours keys
    // deliberately omitted … CHECK constraint atomicity rules accept the
    // zero-present state." Omitting them from the OVERLAY is indeed correct.
    // The bug was that the write was a whole REPLACEMENT, so omission meant
    // DELETION — of fourteen keys, not ten, and including founded_year (present
    // on all nine tenants, and what settings.about's auto:years_operating
    // resolves from) and after_hours_phone (a real contact number, on six).
    const businessInfoOverlay = {
      name: form.businessName,
      phone: form.phone,
      email: form.email,
      address: form.address,
      hours: form.hours,
      tagline: form.tagline,
      license: form.license,
      industry: form.industry,
      ...(form.vertical ? { vertical: form.vertical } : {}),
    }

    // READ AT SAVE TIME. Deliberately NOT built on the useEffect preload above:
    // if the launch fires before that read resolves, a snapshot-based merge has
    // an empty base and silently becomes a whole replacement again.
    const mergedBusinessInfo = await resolveBusinessInfoValue(
      async () => {
        const { data } = await supabase.from('settings').select('value')
          .eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
        return data?.value ?? null
      },
      businessInfoOverlay,
    )

    const settingsRows = [
      { tenant_id: tenantId, key: 'business_info', value: mergedBusinessInfo },
      { tenant_id: tenantId, key: 'branding', value: { logo_url: form.logoUrl, favicon_url: '', primary_color: form.primaryColor, accent_color: form.accentColor, theme: form.template } },
      { tenant_id: tenantId, key: 'social_links', value: { facebook: form.facebook, instagram: form.instagram, google: form.google, youtube: form.youtube } },
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: true } },
      { tenant_id: tenantId, key: 'legal_acceptance', value: { accepted: true, timestamp: new Date().toISOString(), plan: 'starter', terms_version: '2026-04' } },
    ]
    for (const row of settingsRows) {
      // S292 — surface the error rather than swallowing it. This loop is what
      // writes business_info, and a CHECK violation (23514) here previously
      // failed invisibly: the launch appeared to succeed and the row was
      // untouched. Control flow is unchanged; the failure is just no longer silent.
      const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
      if (error) console.error(`[onboarding] settings upsert failed (${row.key}):`, error.message)
    }
    const locationRows = form.locations.filter(l => l.city && l.slug).map(l => ({ tenant_id: tenantId, city: l.city, slug: l.slug, is_live: false }))
    if (locationRows.length > 0) {
      await supabase.from('service_areas').upsert(locationRows, { onConflict: 'tenant_id,slug' })
      await syncServiceAreasJsonb(supabase, tenantId)
    }
    // Bridge to Ironwood CRM — upsert prospect so it appears in pipeline.
    //
    // S292 — THE SAME DEFECT, IN THE SAME FUNCTION. This wrote prospects
    // .business_info as a whole replacement too. It is not a mirror of the
    // settings row: live prospect rows carry owner_name, founded_year and
    // num_technicians that the wizard never collects, and
    // ProspectDetail.Provisioning.tsx feeds this object into provisioning — so
    // blanking it degrades a re-provision, not just a CRM display.
    //
    // Fixed here rather than reported. Leaving one of two identical writes is
    // exactly how this bug survived S290.
    const mergedProspectBusinessInfo = await resolveBusinessInfoValue(
      async () => {
        const { data } = await supabase.from('prospects').select('business_info')
          .eq('tenant_id', tenantId).maybeSingle()
        return data?.business_info ?? null
      },
      businessInfoOverlay,
    )
    //
    // NOTE — this write is RLS-gated to the OPERATOR tenant
    // (`ironwood_admin_prospects_write`: current_tenant_id() = the operator id).
    // From a real client's onboarding session it is DENIED and, until now,
    // ignored without a trace. The merge above makes it correct when it does run
    // — an operator walking the wizard — and the error log below makes the
    // denial visible instead of silent. Widening that policy is a tenant-isolation
    // decision, not a bug fix, so it is reported rather than changed here.
    const { error: prospectErr } = await supabase.from('prospects').upsert({
      status: 'onboarding',
      company_name: form.businessName || '',
      phone: form.phone || null,
      email: form.email || null,
      tenant_id: tenantId,
      business_info: mergedProspectBusinessInfo,
      branding: { logo_url: form.logoUrl, primary_color: form.primaryColor, accent_color: form.accentColor, template: form.template },
    }, { onConflict: 'tenant_id' })
    if (prospectErr) console.warn('[onboarding] prospects upsert skipped:', prospectErr.message)
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
