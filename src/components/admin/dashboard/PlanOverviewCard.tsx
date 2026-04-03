import { usePlan } from '../../../context/PlanContext'

const TIER_INFO: Record<number, { name: string; price: number; tagline: string }> = {
  1: { name: 'Starter', price: 149, tagline: 'Website + CRM + basic SEO' },
  2: { name: 'Grow',    price: 249, tagline: 'Full SEO + Blog + Social scheduling' },
  3: { name: 'Pro',     price: 349, tagline: 'AI tools + campaigns + advanced reports' },
  4: { name: 'Elite',   price: 499, tagline: 'All platforms + live reviews + priority support' },
}

export default function PlanOverviewCard() {
  const { tier, loading } = usePlan()
  if (loading) return null

  const current = TIER_INFO[tier] || TIER_INFO[1]
  const upgradeTiers = (Object.entries(TIER_INFO) as [string, typeof TIER_INFO[1]][]).filter(([t]) => Number(t) > tier)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Plan</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">{current.name}</span>
            <span className="text-gray-900 font-bold text-lg">${current.price}<span className="text-sm font-normal text-gray-500">/mo</span></span>
          </div>
          <p className="text-sm text-gray-500">{current.tagline}</p>
        </div>
      </div>

      {tier >= 4 ? (
        <p className="text-sm text-emerald-600 font-medium">You&apos;re on our top plan 🎉</p>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upgrade Options</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upgradeTiers.map(([t, info]) => (
              <div key={t} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{info.name}</span>
                  <span className="text-sm font-bold text-gray-900">${info.price}<span className="text-xs font-normal text-gray-500">/mo</span></span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{info.tagline}</p>
                <a href={`mailto:scott@ironwoodoperations.com?subject=Upgrade to ${info.name} plan`}
                  className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
