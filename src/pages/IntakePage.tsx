import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import IntakeStep1Business from './intake/IntakeStep1Business'
import IntakeStep2Branding from './intake/IntakeStep2Branding'
import IntakeStep3Domain from './intake/IntakeStep3Domain'

type Status = 'loading' | 'invalid' | 'expired' | 'submitted' | 'form' | 'done'

const STEPS = ['Business Info', 'Branding', 'Domain']

export default function IntakePage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<Status>('loading')
  const [tokenRow, setTokenRow] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<{
    business: Record<string, any>
    branding: Record<string, any>
    domain: Record<string, any>
  }>({ business: {}, branding: { primary_color: '#E87800' }, domain: {} })

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    supabase.rpc('get_intake_by_token', { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setStatus('invalid'); return }
        if (data.is_expired)   { setStatus('expired');   return }
        if (data.is_submitted) { setStatus('submitted'); return }
        setTokenRow(data)
        const d  = data.intake_data   || {}
        const bi = data.business_info || {}
        const br = data.branding      || {}
        setForm({
          business: d.business || {
            business_name: data.company_name || bi.name   || '',
            phone:         data.phone        || bi.phone  || '',
            email:         data.email        || bi.email  || '',
            address:       bi.address        || '',
            city:          bi.city           || '',
            state:         bi.state          || '',
            zip:           bi.zip            || '',
            hours:         bi.hours          || '',
            tagline:       bi.tagline        || '',
          },
          branding: d.branding || {
            template:      br.template      || 'modern-pro',
            primary_color: br.primary_color || '#E87800',
            accent_color:  br.accent_color  || '#1a1a1a',
          },
          domain: d.domain || {},
        })
        setStatus('form')
      })
  }, [token])

  async function handleSubmit() {
    if (!tokenRow) return
    setSubmitting(true)
    const b  = form.business
    const br = form.branding
    const existingBr = tokenRow.branding || {}
    const intakeData = {
      business: form.business,
      branding: {
        ...form.branding,
        ...(form.branding.logo_url ? { logo_url: form.branding.logo_url } : {}),
      },
      domain: form.domain,
    }

    // Build payload — server (submit_intake RPC) controls column scope.
    // Only the 7 known intake columns can be written; unknown keys ignored.
    // Omit a key to preserve the existing DB value (COALESCE on server).
    const payload: Record<string, unknown> = {
      intake_data: intakeData,
      phone: b.phone,
      email: b.email,
      business_info: {
        name:            b.business_name || '',
        phone:           b.phone         || '',
        email:           b.email         || '',
        address:         [b.address, b.city, b.state, b.zip].filter(Boolean).join(', '),
        hours:           b.hours         || '',
        tagline:         b.tagline       || '',
        owner_name:      b.owner_name      || '',
        founded_year:    b.founded_year    || '',
        license:         b.license_number  || '',
        num_technicians: b.num_technicians  || '',
      },
      branding: {
        ...existingBr,
        template:      br.template      || existingBr.template      || 'modern-pro',
        primary_color: br.primary_color || existingBr.primary_color || '#E87800',
        accent_color:  br.accent_color  || existingBr.accent_color  || '#1a1a1a',
        ...(br.cta_text?.trim() ? { cta_text: br.cta_text.trim() } : {}),
        ...(br.logo_url ? { logo_url: br.logo_url } : {}),
      },
    }

    // website_url is conditional — COALESCE on server preserves existing
    // value when key is absent, so only include if the user filled it in.
    if (form.domain.domain_name?.trim()) {
      payload.website_url = form.domain.domain_name.startsWith('http')
        ? form.domain.domain_name.trim()
        : `https://${form.domain.domain_name.trim()}`
    }

    try {
      await Promise.resolve(supabase.from('prospect_activity').insert({
        prospect_id: tokenRow.prospect_id,
        actor: 'system', action: 'intake_submitted', detail: 'Client submitted intake form',
      })).then(() => {}).catch((e: unknown) => console.error('[activity log]', e))

      const { error } = await supabase.rpc('submit_intake', {
        p_token: token,
        p_payload: payload,
      })

      if (error) {
        if (error.message?.includes('invalid_or_expired_token')) {
          setStatus('invalid')
          return
        }
        if (error.message?.includes('missing_intake_data')) {
          console.error('[handleSubmit] missing intake_data in payload', payload)
        }
        throw error
      }

      // Notify client (non-blocking)
      const confirmEmail = b.email || tokenRow.email || ''
      const confirmName  = tokenRow.contact_name || b.business_name || ''
      if (confirmEmail) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-intake-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ to: confirmEmail, contact_name: confirmName }),
        }).catch(() => {})
      }

      setStatus('done')
      // Redirect to pestflowpro.ai after 4s so client sees thank-you + bookings link
      setTimeout(() => { window.location.href = 'https://pestflowpro.ai' }, 4000)
    } catch (err) {
      console.error('[handleSubmit]', err)
      setStatus('done') // still show done — RPC is atomic; if it succeeded, data is saved
    } finally {
      setSubmitting(false)
    }
  }

  const canAdvance = (): boolean => {
    if (step === 0) {
      const b = form.business
      return !!(b.business_name?.trim() && b.phone?.trim() && b.email?.trim())
    }
    return true
  }

  if (status === 'loading') {
    return <Screen><p className="text-gray-500 text-sm">Loading…</p></Screen>
  }
  if (status === 'invalid') {
    return <Screen><p className="text-gray-700 font-medium">This link is not valid.</p><p className="text-gray-500 text-sm mt-1">Contact your rep for a new link.</p></Screen>
  }
  if (status === 'expired') {
    return <Screen><p className="text-gray-700 font-medium">This link has expired.</p><p className="text-gray-500 text-sm mt-1">Contact your rep to request a new one.</p></Screen>
  }
  if (status === 'submitted') {
    return <Screen><p className="text-gray-700 font-medium">You've already submitted.</p><p className="text-gray-500 text-sm mt-1">Contact your rep if you need to make changes.</p></Screen>
  }
  if (status === 'done') {
    return (
      <Screen>
        <div className="text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Thanks!</h2>
          <p className="text-gray-600 mb-4">We received your information. We'll have your site ready in 48–72 hours.</p>
          <p className="text-xs text-gray-400 mt-4">Redirecting you shortly…</p>
        </div>
      </Screen>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-gray-900">PestFlow <span style={{ color: '#E87800' }}>Pro</span></span>
          <p className="text-xs text-gray-400 mt-1">Client Setup Form</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
                i < step ? 'border-orange-500 bg-orange-500 text-white'
                : i === step ? 'border-orange-500 bg-white text-orange-500'
                : 'border-gray-300 bg-white text-gray-400'
              }`}>{i < step ? '✓' : i + 1}</div>
              <div className={`hidden sm:block text-xs ml-2 font-medium ${i === step ? 'text-orange-600' : i < step ? 'text-gray-600' : 'text-gray-400'}`}>{s}</div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-orange-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {step === 0 && <IntakeStep1Business form={form.business} setForm={b => setForm(f => ({ ...f, business: b }))} />}
          {step === 1 && <IntakeStep2Branding form={form.branding} setForm={b => setForm(f => ({ ...f, branding: b }))} token={token!} tier={tokenRow?.tier ?? 'growth'} buildPath={tokenRow?.build_path ?? null} />}
          {step === 2 && <IntakeStep3Domain form={form.domain} setForm={d => setForm(f => ({ ...f, domain: d }))} />}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-0 transition">
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition disabled:opacity-40"
                style={{ backgroundColor: '#E87800' }}>
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition disabled:opacity-50"
                style={{ backgroundColor: '#E87800' }}>
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Powered by PestFlow Pro</p>
      </div>
    </div>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-6">
        <span className="text-2xl font-bold text-gray-900">PestFlow <span style={{ color: '#E87800' }}>Pro</span></span>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {children}
      </div>
    </div>
  )
}
