const UPGRADE_PLANS = [
  {
    tier: 1, name: 'Starter', price: 149,
    features: ['5 pages', '1 AI caption/day', 'Basic SEO'],
  },
  {
    tier: 2, name: 'Growth', price: 249,
    features: ['Full social scheduling', 'Advanced SEO', 'Blog + locations'],
  },
  {
    tier: 3, name: 'Pro', price: 349,
    features: ['Campaign manager', 'Priority support', 'Analytics dashboard'],
  },
  {
    tier: 4, name: 'Elite', price: 499,
    features: ['White-glove onboarding', 'Dedicated rep', 'All features'],
  },
]

interface Props {
  currentTier: number
  businessName: string
}

export default function UpgradeCards({ currentTier, businessName }: Props) {
  const upgrades = UPGRADE_PLANS.filter(p => p.tier > currentTier)
  if (upgrades.length === 0) return null
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upgrade Your Plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upgrades.map(plan => (
          <div key={plan.tier} className="bg-white rounded-xl border-2 border-emerald-100 p-5 flex flex-col">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-3">
              ${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <ul className="space-y-1 mb-4 flex-1">
              {plan.features.map(f => (
                <li key={f} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span> {f}
                </li>
              ))}
            </ul>
            <a
              href={`mailto:support@pestflowpro.com?subject=Upgrade to ${plan.name} - ${encodeURIComponent(businessName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto w-full py-2.5 rounded-lg text-sm font-semibold text-center transition bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Upgrade to {plan.name} →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
