import { useState } from 'react'
import { Copy, Check, Lock, AlertCircle } from 'lucide-react'
import { type ClientSetupForm } from './types'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — $99/mo',
  grow: 'Grow — $149/mo',
  pro: 'Pro — $249/mo',
  elite: 'Elite — $499/mo',
}

const PACKAGE_OPTIONS = [
  { value: 'standard', label: 'Standard Build — $2,000' },
  { value: 'custom',   label: 'Custom Migration — $3,500' },
  { value: 'premium',  label: 'Premium Migration — $5,000' },
]

interface Props { form: ClientSetupForm }

interface S {
  packageType: string
  customAmountDollars: string
  passkey: string
  passkeyError: string
  showPasskeyModal: boolean
  customUnlocked: boolean
  loading: boolean
  checkoutUrl: string
  copied: boolean
  error: string
}

export default function ClientSetupPayment({ form }: Props) {
  const [s, setS] = useState<S>({
    packageType: 'standard', customAmountDollars: '',
    passkey: '', passkeyError: '', showPasskeyModal: false, customUnlocked: false,
    loading: false, checkoutUrl: '', copied: false, error: '',
  })
  const patch = (p: Partial<S>) => setS(prev => ({ ...prev, ...p }))

  const selectedPkg = PACKAGE_OPTIONS.find(p => p.value === s.packageType)!
  const planLabel = PLAN_LABELS[form.plan] || form.plan

  function tryUnlockCustom() {
    const expected = import.meta.env.VITE_STRIPE_CUSTOM_PRICE_PASSKEY as string
    if (!expected) { patch({ passkeyError: 'Passkey not configured.' }); return }
    if (s.passkey === expected) {
      patch({ customUnlocked: true, showPasskeyModal: false, passkey: '', passkeyError: '' })
    } else {
      patch({ passkeyError: 'Incorrect passkey.', passkey: '' })
    }
  }

  async function handleGenerateLink() {
    patch({ loading: true, error: '', checkoutUrl: '', copied: false })

    const setupAmountOverride = s.customUnlocked && s.customAmountDollars
      ? Math.round(parseFloat(s.customAmountDollars) * 100)
      : undefined

    const planTierMap: Record<string, number> = { starter: 1, grow: 2, pro: 3, elite: 4 }
    const planPriceMap: Record<string, number> = { starter: 99, grow: 149, pro: 249, elite: 499 }

    const provision_data = {
      tenant_id: form.tenant_id || '',
      slug: form.slug,
      email: form.email,
      admin_password: form.admin_password,
      plan: form.plan,
      business_info: { name: form.biz_name, phone: form.phone, email: form.email, address: form.address, tagline: form.tagline, industry: form.industry },
      branding: { logo_url: form.logo_url, primary_color: form.primary_color, template: form.template || 'modern-pro' },
      social_links: { facebook: form.facebook, instagram: form.instagram, google: form.google, youtube: form.youtube },
      integrations: { google_place_id: form.google_place_id, ga4_id: form.ga4_id },
      subscription: { tier: planTierMap[form.plan] || 1, plan_name: form.plan.charAt(0).toUpperCase() + form.plan.slice(1), monthly_price: planPriceMap[form.plan] || 99 },
    }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: form.tenant_id || '',
          client_email: form.email,
          client_name: form.contact_name || form.biz_name,
          package_type: s.packageType,       // resolved to price ID server-side
          plan: form.plan,                    // resolved to price ID server-side
          setup_amount_override: setupAmountOverride,
          slug: form.slug,
          provision_data,
        }),
      })

      const data = await resp.json()
      if (data.error) { patch({ loading: false, error: data.error }); return }

      await navigator.clipboard.writeText(data.url).catch(() => {})
      patch({ loading: false, checkoutUrl: data.url, copied: true })
    } catch (err: any) {
      patch({ loading: false, error: err.message || 'Failed to generate payment link' })
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment & Setup Fee</h2>

      <div className="space-y-4 mb-6">
        {/* Package type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
          <select
            value={s.packageType}
            onChange={e => patch({ packageType: e.target.value, customUnlocked: false, customAmountDollars: '' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {PACKAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {/* Setup fee row */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <span className="text-sm text-gray-500">Setup Fee</span>
            <div className="text-sm font-semibold text-gray-900">
              {s.customUnlocked && s.customAmountDollars
                ? `$${parseFloat(s.customAmountDollars).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : selectedPkg.label.split(' — ')[1]}
            </div>
          </div>
          <button
            onClick={() => patch({ showPasskeyModal: true, passkeyError: '' })}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md px-2.5 py-1.5 transition"
          >
            <Lock size={12} /> Custom
          </button>
        </div>

        {/* Custom amount input */}
        {s.customUnlocked && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Setup Amount ($)</label>
            <input
              type="number" min="0" step="0.01" value={s.customAmountDollars}
              onChange={e => patch({ customAmountDollars: e.target.value })}
              placeholder="e.g. 2500"
              className="w-full border border-emerald-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Monthly plan */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm text-gray-500">Monthly Plan</span>
          <div className="text-sm font-semibold text-gray-900">{planLabel}</div>
        </div>

        {/* Client summary */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
          {[
            ['Client Email', form.email || '—'],
            ['Client Name', form.contact_name || form.biz_name || '—'],
            ['Site Slug', `${form.slug || '—'}.pestflowpro.com`],
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
          disabled={s.loading || !form.email || !form.slug || !form.plan}
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
            <button onClick={async () => { await navigator.clipboard.writeText(s.checkoutUrl).catch(() => {}); patch({ copied: true }) }}
              className="text-emerald-600 hover:text-emerald-800 flex-shrink-0" title="Copy">
              <Copy size={14} />
            </button>
          </div>
          <p className="text-xs text-emerald-700">
            Send this link to your client. Their site will be automatically provisioned after payment completes.
          </p>
        </div>
      )}

      {/* Passkey modal */}
      {s.showPasskeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Custom Price Override</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the admin passkey to override the setup fee.</p>
            <input
              type="password" value={s.passkey} autoFocus
              onChange={e => patch({ passkey: e.target.value, passkeyError: '' })}
              onKeyDown={e => e.key === 'Enter' && tryUnlockCustom()}
              placeholder="Passkey"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-emerald-500"
            />
            {s.passkeyError && <p className="text-xs text-red-600 mb-3">{s.passkeyError}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => patch({ showPasskeyModal: false, passkey: '', passkeyError: '' })}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={tryUnlockCustom}
                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
