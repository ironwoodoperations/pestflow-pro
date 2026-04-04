import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { INITIAL_FORM, PLAN_LABELS, type ClientSetupForm } from './types'
import ClientSetupStep1 from './ClientSetupStep1'
import ClientSetupStep2 from './ClientSetupStep2'
import ClientSetupStep3 from './ClientSetupStep3'
import ClientSetupStep4 from './ClientSetupStep4'
import ClientSetupStep5 from './ClientSetupStep5'
import ClientSetupReview, { ClientSetupSuccess } from './ClientSetupReview'

const STEP_LABELS = ['Plan', 'Business', 'Branding', 'Social', 'Integrations', 'Review']

interface ProvisionResult { slug: string; url: string; email: string; password: string }
interface State { form: ClientSetupForm; step: number; sending: boolean; sent: boolean; result: ProvisionResult | null }

function isStep2Valid(f: ClientSetupForm) {
  return f.biz_name.trim() && f.slug.trim() && f.contact_name.trim() && f.phone.trim() && f.email.trim() && f.address.trim() && f.industry.trim()
}

export default function ClientSetupWizard() {
  const [state, setState] = useState<State>({ form: INITIAL_FORM, step: 1, sending: false, sent: false, result: null })
  const { form, step, sending, sent, result } = state

  const setForm = (patch: Partial<ClientSetupForm>) =>
    setState(s => ({ ...s, form: { ...s.form, ...patch } }))

  const canNext = () => {
    if (step === 1) return !!form.plan
    if (step === 2) return !!isStep2Valid(form)
    return true
  }

  async function handleExport() {
    setState(s => ({ ...s, sending: true }))
    const md = `# PestFlow Pro Client Setup
## ${form.biz_name}

**Plan:** ${PLAN_LABELS[form.plan] || form.plan}
**Slug:** ${form.slug} → ${form.slug}.pestflowpro.com
**Contact:** ${form.contact_name}
**Phone:** ${form.phone}
**Email:** ${form.email}
**Address:** ${form.address}
**Industry:** ${form.industry}
**Template:** ${form.template || 'modern-pro'}
**Domain:** ${form.domain}
**Tagline:** ${form.tagline}
**Logo URL:** ${form.logo_url}
**Primary Color:** ${form.primary_color}

## Social Links
- Facebook: ${form.facebook || '—'}
- Instagram: ${form.instagram || '—'}
- Google: ${form.google || '—'}
- YouTube: ${form.youtube || '—'}

## Services Offered
${form.services || '—'}

## Integrations
- Google Place ID: ${form.google_place_id || '—'}
- GA4 ID: ${form.ga4_id || '—'}

## Notes
${form.notes || '—'}
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.biz_name.replace(/\s+/g, '-').toLowerCase()}-pestflow-setup.md`
    a.click()
    URL.revokeObjectURL(url)

    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-onboarding-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ business_name: form.biz_name, contact_name: form.contact_name, plan: PLAN_LABELS[form.plan] || form.plan, markdown_content: md }),
      })
    } catch { /* silent fail */ }

    // Always provision — tenant row auto-created if no tenant_id supplied
    const planTierMap: Record<string, number> = { starter: 1, grow: 2, pro: 3, elite: 4 }
    const planPriceMap: Record<string, number> = { starter: 99, grow: 149, pro: 249, elite: 499 }
    const tierNum = planTierMap[form.plan] || 1
    let provisionResult: ProvisionResult | null = null
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          tenant_id: form.tenant_id.trim() || undefined,
          slug: form.slug.trim(),
          admin_email: form.email,
          admin_password: form.admin_password,
          business_info: { name: form.biz_name, phone: form.phone, email: form.email, address: form.address, tagline: form.tagline, industry: form.industry },
          branding: { logo_url: form.logo_url, primary_color: form.primary_color, template: form.template || 'modern-pro' },
          social_links: { facebook: form.facebook, instagram: form.instagram, google: form.google, youtube: form.youtube },
          integrations: { google_place_id: form.google_place_id, ga4_id: form.ga4_id },
          plan: form.plan,
          subscription: { tier: tierNum, plan_name: form.plan.charAt(0).toUpperCase() + form.plan.slice(1), monthly_price: planPriceMap[form.plan] || 99 },
        }),
      })
      const data = await resp.json()
      if (data.success) {
        provisionResult = { slug: data.slug, url: data.url, email: form.email, password: form.admin_password }
      }
    } catch { console.warn('Tenant provisioning failed — manually configure settings') }

    setState(s => ({ ...s, sending: false, sent: true, result: provisionResult }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={n} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <CheckCircle size={14} /> : n}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
        {step === 1 && <ClientSetupStep1 form={form} setForm={setForm} />}
        {step === 2 && <ClientSetupStep2 form={form} setForm={setForm} />}
        {step === 3 && <ClientSetupStep3 form={form} setForm={setForm} />}
        {step === 4 && <ClientSetupStep4 form={form} setForm={setForm} />}
        {step === 5 && <ClientSetupStep5 form={form} setForm={setForm} />}
        {step === 6 && !sent && (
          <ClientSetupReview
            form={form} sending={sending}
            onExport={handleExport}
            onBack={() => setState(s => ({ ...s, step: 5 }))}
          />
        )}
        {step === 6 && sent && (
          <ClientSetupSuccess
            result={result}
            onReset={() => setState({ form: INITIAL_FORM, step: 1, sending: false, sent: false, result: null })}
          />
        )}

        {step < 6 && (
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button onClick={() => setState(s => ({ ...s, step: s.step - 1 }))} disabled={step === 1}
              className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
              Back
            </button>
            <button onClick={() => setState(s => ({ ...s, step: s.step + 1 }))} disabled={!canNext()}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition">
              {step === 5 ? 'Review →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
