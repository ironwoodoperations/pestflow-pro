const UPGRADE_PLANS = [
  { tier: 1, name: 'Starter', price: 149 },
  { tier: 2, name: 'Growth',  price: 249 },
  { tier: 3, name: 'Pro',     price: 349 },
  { tier: 4, name: 'Elite',   price: 499 },
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
          <div key={plan.tier} className="bg-white rounded-xl border-2 border-gray-200 p-5 flex flex-col">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-4">
              ${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <a
              href={`mailto:support@pestflowpro.com?subject=Upgrade Request - ${encodeURIComponent(businessName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto w-full py-2 rounded-lg text-sm font-medium text-center transition"
              style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
            >
              Contact Us to Upgrade
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
