import { useState } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { type ClientSetupForm } from './types'
import { IMPLEMENTATION_PACKAGES } from '../../../lib/pricingConfig'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — $149/mo',
  grow:    'Grow — $249/mo',
  pro:     'Pro — $349/mo',
  elite:   'Elite — $499/mo',
}

const PACKAGE_LABELS: Record<string, string> = Object.fromEntries(
  IMPLEMENTATION_PACKAGES.map(p => [p.id, `${p.label} — ${p.badge}`])
)

const PLAN_TIER_MAP:  Record<string, number> = { starter: 1, grow: 2, pro: 3, elite: 4 }
const PLAN_PRICE_MAP: Record<string, number> = { starter: 149, grow: 249, pro: 349, elite: 499 }

interface Props { form: ClientSetupForm }

interface S {
  loading: boolean
  checkoutUrl: string
  error: string
}

export default function ClientSetupPayment({ form }: Props) {
  const [s, setS] = useState<S>({ loading: false, checkoutUrl: '', error: '' })
  const patch = (p: Partial<S>) => setS(prev => ({ ...prev, ...p }))

  async function handleGenerateLink() {
    patch({ loading: true, error: '', checkoutUrl: '' })

    try {
      // Atomicity: include all 4 address fields or none (CHECK rule 1)
      const addrFilled = [form.street_address, form.address_locality, form.address_region, form.postal_code]
        .filter(v => v && String(v).trim()).length
      const addressKeys = addrFilled === 4
        ? { street_address: form.street_address, address_locality: form.address_locality, address_region: form.address_region, postal_code: form.postal_code }
        : {}
      // Atomicity: lat ↔ lng (CHECK rule 5)
      const geoKeys = (typeof form.latitude === 'number' && typeof form.longitude === 'number')
        ? { latitude: form.latitude, longitude: form.longitude }
        : {}
      // hours_structured requires timezone (CHECK rule 7)
      const hoursKeys = (form.hours_structured?.length && form.timezone)
        ? { hours_structured: form.hours_structured, timezone: form.timezone }
        : form.timezone
          ? { timezone: form.timezone }
          : {}

      // Step 1: Save all wizard data to onboarding_sessions bridge table
      const wizardData = {
        business_info: {
          name:            form.biz_name,
          phone:           form.phone,
          email:           form.email,
          address:         form.address,
          hours:           form.hours,
          tagline:         form.tagline,
          industry:        'Pest Control',
          license:         '',
          certifications:  '',
          founded_year:    '',
          num_technicians: '',
          ...addressKeys,
          ...(form.address_country ? { address_country: form.address_country } : {}),
          ...geoKeys,
          ...(form.geocode_source ? { geocode_source: form.geocode_source } : {}),
          ...hoursKeys,
        },
        branding: {
          logo_url:      form.logo_url,
          primary_color: form.primary_color,
          accent_color:  form.accent_color,
          template:      form.template || 'modern-pro',
          cta_text:      'Get a Free Quote',
          favicon_url:   '',
        },
        customization: {
          hero_headline:        form.tagline,
          show_license:         true,
          show_years:           true,
          show_technicians:     true,
          show_certifications:  true,
        },
        social_links: {
          facebook:  form.facebook,
          instagram: form.instagram,
          google:    form.google,
          youtube:   form.youtube,
        },
        subscription: {
          tier:          PLAN_TIER_MAP[form.plan]  || 1,
          plan_name:     form.plan ? form.plan.charAt(0).toUpperCase() + form.plan.slice(1) : 'Starter',
          monthly_price: PLAN_PRICE_MAP[form.plan] || 149,
        },
        slug:             form.slug,
        admin_password:   form.admin_password,
        setup_fee_amount: Math.round(form.setup_fee_amount * 100), // to cents
      }

      const { data: session, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .insert({ slug: form.slug, wizard_data: wizardData })
        .select('id')
        .single()

      if (sessionError || !session) {
        throw new Error('Failed to save onboarding session: ' + (sessionError?.message || 'unknown'))
      }

      // Step 2: Create Stripe checkout session, passing onboarding_session_id
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) throw new Error('Not authenticated')
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          client_email:          form.email,
          client_name:           form.biz_name,
          package_type:          form.package_type,
          plan:                  form.plan,
          setup_amount_override: form.setup_fee_amount > 0 ? Math.round(form.setup_fee_amount * 100) : undefined,
          slug:                  form.slug,
          onboarding_session_id: session.id,
        }),
      })

      const data = await resp.json()
      if (data.error) { patch({ loading: false, error: data.error }); return }

      await navigator.clipboard.writeText(data.url).catch(() => {})
      patch({ loading: false, checkoutUrl: data.url })
    } catch (err: unknown) {
      patch({ loading: false, error: (err as Error).message || 'Failed to generate payment link' })
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment & Setup Fee</h2>

      <div className="space-y-3 mb-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-500 block">Setup Type</span>
          <span className="text-sm font-semibold text-gray-900">
            {PACKAGE_LABELS[form.package_type] || '—'}
          </span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-500 block">Setup Fee</span>
          <span className="text-sm font-semibold text-gray-900">
            {form.setup_fee_amount > 0 ? `$${form.setup_fee_amount.toLocaleString()}` : 'Waived'}
          </span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-500 block">Monthly Plan</span>
          <span className="text-sm font-semibold text-gray-900">{PLAN_LABELS[form.plan] || '—'}</span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
          {[
            ['Client Email', form.email || '—'],
            ['Business',     form.biz_name || '—'],
            ['Site',         `${form.slug || '—'}.pestflowpro.ai`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {s.error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{s.error}</p>
        </div>
      )}

      {!s.checkoutUrl ? (
        <button
          onClick={handleGenerateLink}
          disabled={s.loading || !form.email || !form.slug || !form.plan || !form.package_type}
          className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition text-sm"
        >
          {s.loading ? 'Generating…' : 'Generate Payment Link'}
        </button>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <Check size={16} /> Payment link copied to clipboard!
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-2">
            <span className="flex-1 text-xs font-mono text-gray-700 truncate">{s.checkoutUrl}</span>
            <button
              onClick={async () => { await navigator.clipboard.writeText(s.checkoutUrl).catch(() => {}) }}
              className="text-emerald-600 hover:text-emerald-800 flex-shrink-0"
              title="Copy"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="text-xs text-emerald-700">Send this link to your client. Their site will be provisioned after payment.</p>
        </div>
      )}
    </div>
  )
}
