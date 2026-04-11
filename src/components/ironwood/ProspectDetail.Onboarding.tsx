import type { Prospect } from './types'
import PaymentLinkPanel from './PaymentLinkPanel'

const PACKAGES = [
  { id: 'template-launch', name: 'Template Launch', fee: 0 },
  { id: 'growth-setup',    name: 'Growth Setup',    fee: 1000 },
  { id: 'site-migration',  name: 'Site Migration',  fee: 2750 },
  { id: 'custom-rebuild',  name: 'Custom Rebuild',  fee: 0 },
]
const PLANS = [
  { id: 'starter', name: 'Starter', price: 149, tier: 1 },
  { id: 'grow',    name: 'Grow',    price: 249, tier: 2 },
  { id: 'pro',     name: 'Pro',     price: 349, tier: 3 },
  { id: 'elite',   name: 'Elite',   price: 499, tier: 4 },
]
const SOCIALS: [keyof Prospect, string][] = [
  ['social_facebook','Facebook'],['social_instagram','Instagram'],
  ['social_google','Google Business'],['social_youtube','YouTube'],['social_tiktok','TikTok'],
]

const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
  prospect: Partial<Prospect>
  onUpdate: (updates: Partial<Prospect>) => void
  onFocusSection?: (section: 'payment' | 'social') => void
}

export default function OnboardingSection({ form, setField, onBlur, prospect, onUpdate, onFocusSection }: Props) {
  const handlePackage = (id: string) => {
    const pkg = PACKAGES.find(p => p.id === id)
    setField('package_id', id)
    if (pkg) setField('setup_fee_amount', pkg.fee)
    onBlur()
  }
  const handlePlan = (id: string) => {
    const plan = PLANS.find(p => p.id === id)
    if (plan) {
      setField('plan_name', plan.name)
      setField('monthly_price', plan.price)
      setField('plan_tier', plan.tier)
    }
    onBlur()
  }
  const planKey = PLANS.find(p => p.name === form.plan_name)?.id || ''

  return (
    <div className="space-y-4">
      {/* Section 2 — Package & Payment */}
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1">Package & Payment</h3>
      <div className="grid grid-cols-3 gap-3" onFocus={() => onFocusSection?.('payment')}>
        <div>
          <label className="text-xs text-gray-400">Package</label>
          <select className={inp} value={form.package_id || ''} onChange={e => handlePackage(e.target.value)}>
            <option value="">— Select —</option>
            {PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Setup Fee ($)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={inp}
            value={form.setup_fee_amount ? String(form.setup_fee_amount) : ''}
            placeholder="e.g. 500"
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              setField('setup_fee_amount', raw === '' ? 0 : parseInt(raw, 10))
            }}
            onBlur={onBlur}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Plan</label>
          <select className={inp} value={planKey} onChange={e => handlePlan(e.target.value)}>
            <option value="">— Select —</option>
            {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} ${p.price}/mo</option>)}
          </select>
        </div>
      </div>

      <PaymentLinkPanel prospect={prospect as Prospect} onUpdate={onUpdate} />

      {/* Section 3 — Social Media */}
      <div onFocus={() => onFocusSection?.('social')}>
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 pt-2">Social Media</h3>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={form.has_existing_social || false}
          onChange={e => { setField('has_existing_social', e.target.checked); onBlur() }} />
        Has existing social profiles
      </label>
      <div className="grid grid-cols-2 gap-3">
        {SOCIALS.map(([key, label]) => (
          <div key={String(key)}>
            <label className="text-xs text-gray-400">{label}</label>
            <input className={inp} value={(form as any)[key] || ''}
              onChange={e => setField(String(key), e.target.value)} onBlur={onBlur} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 italic">Confirm and seed these before the reveal call.</p>
      </div>
    </div>
  )
}
