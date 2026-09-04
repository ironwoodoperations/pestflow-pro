import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PLATFORM_NAME } from '../../../shared/lib/platformBrand'
import { useTenant } from '../../context/TenantBootProvider'
import { syncServiceAreasJsonb } from '../../lib/service-areas/syncJsonbFromTable'
import { prepareBusinessInfoWrites, readOrThrow } from '../../../shared/lib/businessInfoMerge'
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
  // S292 — a failed launch must be VISIBLE. Throwing without this leaves
  // `saving` stuck true and the button dead with nothing shown.
  const [launchError, setLaunchError] = useState<string | null>(null)
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
    setLaunchError(null)

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

    try {
      // BOTH READS FIRST, AT SAVE TIME, AND THEY THROW ON ERROR.
      //
      // At save time, not from the useEffect preload above: a snapshot taken
      // before that read resolves has an empty base and silently becomes a whole
      // replacement again (the S285 ContentTab race, in a new place).
      //
      // Throwing, because discarding `error` recreates the same bug through the
      // failure path — on any read failure `data` is null, the merge sees "no
      // row yet", and the write is a whole replacement. See readOrThrow.
      //
      // Both BEFORE any upsert, so a read failure aborts with NOTHING written
      // rather than leaving the settings row updated and the prospect row stale.
      const merged = await prepareBusinessInfoWrites({
        overlay: businessInfoOverlay,
        readSettingsBusinessInfo: async () => {
          const row = await readOrThrow('settings.business_info', () =>
            supabase.from('settings').select('value')
              .eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle())
          return (row as { value?: unknown } | null)?.value ?? null
        },
        readProspectBusinessInfo: async () => {
          const row = await readOrThrow('prospects.business_info', () =>
            supabase.from('prospects').select('business_info')
              .eq('tenant_id', tenantId).maybeSingle())
          return (row as { business_info?: unknown } | null)?.business_info ?? null
        },
      })

      const settingsRows = [
        { tenant_id: tenantId, key: 'business_info', value: merged.settings },
        { tenant_id: tenantId, key: 'branding', value: { logo_url: form.logoUrl, favicon_url: '', primary_color: form.primaryColor, accent_color: form.accentColor, theme: form.template } },
        { tenant_id: tenantId, key: 'social_links', value: { facebook: form.facebook, instagram: form.instagram, google: form.google, youtube: form.youtube } },
        { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: true } },
        { tenant_id: tenantId, key: 'legal_acceptance', value: { accepted: true, timestamp: new Date().toISOString(), plan: 'starter', terms_version: '2026-04' } },
      ]
      for (const row of settingsRows) {
        // Surface the error rather than swallowing it. This loop is what writes
        // business_info, and a CHECK violation (23514) here previously failed
        // invisibly: the launch appeared to succeed and the row was untouched.
        const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
        if (error) throw new Error(`settings.${row.key}: ${error.message}`)
      }

      const locationRows = form.locations.filter(l => l.city && l.slug).map(l => ({ tenant_id: tenantId, city: l.city, slug: l.slug, is_live: false }))
      if (locationRows.length > 0) {
        await supabase.from('service_areas').upsert(locationRows, { onConflict: 'tenant_id,slug' })
        await syncServiceAreasJsonb(supabase, tenantId)
      }

      // Bridge to Ironwood CRM — upsert prospect so it appears in pipeline.
      //
      // THE SAME DEFECT, IN THE SAME FUNCTION. This wrote prospects.business_info
      // as a whole replacement too. It is not a mirror of the settings row: live
      // prospect rows carry owner_name, founded_year and num_technicians that the
      // wizard never collects, and ProspectDetail.Provisioning.tsx feeds this
      // object into provisioning — so blanking it degrades a re-provision, not
      // just a CRM display. Fixed rather than reported: leaving one of two
      // identical writes is exactly how this bug survived S290.
      //
      // NOTE — this write is RLS-gated to the OPERATOR tenant
      // (`ironwood_admin_prospects_write`: current_tenant_id() = the operator id).
      // From a real client's session it is DENIED. That denial is NOT fatal to
      // the launch — the tenant's own settings are already written and correct —
      // so it is logged rather than thrown. Widening the policy is a
      // tenant-isolation decision, reported rather than made here.
      const { error: prospectErr } = await supabase.from('prospects').upsert({
        status: 'onboarding',
        company_name: form.businessName || '',
        phone: form.phone || null,
        email: form.email || null,
        tenant_id: tenantId,
        business_info: merged.prospect,
        branding: { logo_url: form.logoUrl, primary_color: form.primaryColor, accent_color: form.accentColor, template: form.template },
      }, { onConflict: 'tenant_id' })
      if (prospectErr) console.warn('[onboarding] prospects upsert skipped:', prospectErr.message)

      navigate('/admin/dashboard')
    } catch (err) {
      // Stopping here is the recoverable outcome. The alternative — carrying on
      // with a merge built on a failed read — destroys fourteen keys silently.
      const message = err instanceof Error ? err.message : String(err)
      console.error('[onboarding] launch aborted, nothing further written:', message)
      setLaunchError(message)
    } finally {
      setSaving(false)
    }
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
        <h1 className="font-oswald text-3xl text-emerald-500 text-center mb-8 tracking-wide">{PLATFORM_NAME}</h1>

        {step === 1 && <StepWelcome businessName={businessName || 'Your New Website'} onNext={() => setStep(2)} />}
        {step === 2 && <StepBusinessInfo form={form} updateField={updateField} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepSocialLinks form={form} updateField={updateField} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepBranding form={form} updateField={updateField} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {step === 5 && <StepLocations form={form} addLocation={addLocation} removeLocation={removeLocation} updateLocation={updateLocation} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
        {step === 6 && (
          <>
            {/* S292 — a launch that stops must SAY so. Without this the throw
                leaves the button re-enabled and nothing on screen, which is the
                silent-failure shape this whole PR is about. */}
            {launchError && (
              <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-semibold">Launch stopped — nothing was changed.</p>
                <p className="mt-1">{launchError}</p>
                <p className="mt-1 text-red-700">Your existing business details are untouched. Try again, or contact support if this repeats.</p>
              </div>
            )}
            <StepReview form={form} saving={saving} onLaunch={handleLaunch} onBack={() => setStep(5)} goToStep={setStep} updateField={updateField} />
          </>
        )}
      </div>
    </div>
  )
}
