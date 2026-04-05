import { useState } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import { type ClientSetupForm } from './types'
import { IMPLEMENTATION_PACKAGES } from '../../../lib/pricingConfig'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — $99/mo',
  grow:    'Grow — $149/mo',
  pro:     'Pro — $249/mo',
  elite:   'Elite — $499/mo',
}

const PACKAGE_LABELS: Record<string, string> = Object.fromEntries(
  IMPLEMENTATION_PACKAGES.map(p => [p.id, `${p.label} — ${p.badge}`])
)

interface Props { form: ClientSetupForm }

interface S {
  customAmountDollars: string
  loading: boolean
  checkoutUrl: string
  error: string
}

export default function ClientSetupPayment({ form }: Props) {
  const [s, setS] = useState<S>({
    customAmountDollars: '', loading: false, checkoutUrl: '', error: '',
  })
  const patch = (p: Partial<S>) => setS(prev => ({ ...prev, ...p }))

  const planPriceMap: Record<string, number> = { starter: 99, grow: 149, pro: 249, elite: 499 }
  const planTierMap: Record<string, number>  = { starter: 1, grow: 2, pro: 3, elite: 4 }

  async function handleGenerateLink() {
    patch({ loading: true, error: '', checkoutUrl: '' })

    const setupAmountOverride = s.customAmountDollars
      ? Math.round(parseFloat(s.customAmountDollars) * 100)
      : undefined

    const provision_data = {
      email: form.email, slug: form.slug,
      business_info: { name: form.biz_name, phone: form.phone, email: form.email, address: form.address, hours: form.hours, tagline: form.tagline },
      branding: { logo_url: form.logo_url, template: form.template || 'modern-pro', primary_color: form.primary_color, accent_color: form.accent_color },
      social_links: { facebook: form.facebook, google: form.google, instagram: form.instagram, youtube: form.youtube },
      subscription: { tier: planTierMap[form.plan] || 1, plan_name: form.plan ? form.plan.charAt(0).toUpperCase() + form.plan.slice(1) : '', monthly_price: planPriceMap[form.plan] || 99 },
      domain: form.domain, registrar: form.domain_registrar, current_website_url: form.current_website_url, package: form.package_type,
    }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ client_email: form.email, client_name: form.biz_name, package_type: form.package_type, plan: form.plan, setup_amount_override: setupAmountOverride, slug: form.slug, provision_data }),
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
          <span className="text-xs text-gray-500 block">Package</span>
          <span className="text-sm font-semibold text-gray-900">
            {s.customAmountDollars
              ? `Custom — $${parseFloat(s.customAmountDollars).toLocaleString()}`
              : PACKAGE_LABELS[form.package_type] || '—'}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Setup Amount <span className="text-gray-400 font-normal">(optional — overrides package default)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input type="number" min="0" step="0.01" value={s.customAmountDollars}
              onChange={e => patch({ customAmountDollars: e.target.value })}
              placeholder="Leave blank to use package default"
              className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-500 block">Monthly Plan</span>
          <span className="text-sm font-semibold text-gray-900">{PLAN_LABELS[form.plan] || '—'}</span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
          {[['Client Email', form.email || '—'], ['Business', form.biz_name || '—'], ['Site', `${form.slug || '—'}.pestflowpro.com`]].map(([label, value]) => (
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
        <button onClick={handleGenerateLink}
          disabled={s.loading || !form.email || !form.slug || !form.plan || !form.package_type}
          className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition text-sm">
          {s.loading ? 'Generating…' : 'Generate Payment Link'}
        </button>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <Check size={16} /> Payment link copied to clipboard!
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-2">
            <span className="flex-1 text-xs font-mono text-gray-700 truncate">{s.checkoutUrl}</span>
            <button onClick={async () => { await navigator.clipboard.writeText(s.checkoutUrl).catch(() => {}) }}
              className="text-emerald-600 hover:text-emerald-800 flex-shrink-0" title="Copy">
              <Copy size={14} />
            </button>
          </div>
          <p className="text-xs text-emerald-700">Send this link to your client. Their site will be provisioned after payment.</p>
        </div>
      )}
    </div>
  )
}
