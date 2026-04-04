import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { usePlan } from '../usePlan'

const TIERS = [
  {
    tier: 1, name: 'Starter', price: 99,
    badge: 'bg-gray-100 text-gray-700',
    features: 'Website, CRM, Basic SEO, up to 3 locations, Team access',
  },
  {
    tier: 2, name: 'Grow', price: 149,
    badge: 'bg-blue-100 text-blue-700',
    features: 'All Starter + Full SEO suite, Blog, Social scheduling',
  },
  {
    tier: 3, name: 'Pro', price: 249,
    badge: 'bg-purple-100 text-purple-700',
    features: 'All Grow + AI tools, Advanced reports, Campaigns',
  },
  {
    tier: 4, name: 'Elite', price: 499,
    badge: 'bg-amber-100 text-amber-700',
    features: 'All Pro + Social analytics, Ayrshare autopilot, Live reviews',
  },
]

export default function DashboardPlanCard() {
  const { tier, loading } = usePlan()
  const [expanded, setExpanded] = useState(false)

  if (loading) return null

  const current = TIERS.find(t => t.tier === tier) || TIERS[0]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${current.badge}`}>
            {current.name}
          </span>
          <span className="text-gray-900 font-bold">
            ${current.price}<span className="text-sm font-normal text-gray-500">/mo</span>
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          What&apos;s included
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded: full tier comparison */}
      {expanded && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
          {TIERS.map(t => {
            const isCurrent = t.tier === tier
            const isUpgrade = t.tier > tier
            return (
              <div
                key={t.tier}
                className={`flex items-center justify-between rounded-lg px-4 py-3 gap-4 ${
                  isCurrent ? 'bg-gray-50 border border-gray-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${t.badge}`}>
                    {t.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                    ${t.price}<span className="text-xs font-normal text-gray-400">/mo</span>
                  </span>
                  <span className="text-xs text-gray-500 truncate hidden sm:block">{t.features}</span>
                </div>
                <div className="flex-shrink-0">
                  {isCurrent ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Current Plan
                    </span>
                  ) : (
                    <a
                      href={`mailto:scott@ironwoodoperationsgroup.com?subject=${isUpgrade ? 'Upgrade' : 'Downgrade'} Request — ${t.name}`}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        isUpgrade
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'border border-gray-300 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {isUpgrade ? 'Upgrade →' : 'Downgrade'}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
