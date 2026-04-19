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

const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
  prospect: Partial<Prospect>
  onUpdate: (updates: Partial<Prospect>) => void
  onFocusSection?: (section: 'payment') => void
}

export default function OnboardingSection({ form, setField, onBlur, prospect, onUpdate, onFocusSection }: Props) {
  const handlePackage = (id: string) => {
    setField('package_id', id)
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
  const planKey = PLANS.find(p => p.name === form.plan_name)?.id || 'grow'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3" onFocus={() => onFocusSection?.('payment')}>
        <div>
          <label className="text-xs text-gray-400">Setup Type</label>
          <select className={inp} value={form.package_id || ''} onChange={e => handlePackage(e.target.value)}>
            <option value="">— Select —</option>
            {PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
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
    </div>
  )
}
