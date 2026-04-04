import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { usePlan } from '../usePlan'

const PLAN_FEATURES: Record<number, string[]> = {
  1: ['Professional website', 'Lead management CRM', 'Basic SEO tools', 'Up to 3 service locations', 'Team member access'],
  2: ['Everything in Starter', 'Full SEO suite', 'Blog / content hub', 'Social media scheduling'],
  3: ['Everything in Grow', 'AI content generation tools', 'Advanced analytics & reports', 'Campaign batch posting'],
  4: ['Everything in Pro', 'Social analytics dashboard', 'Full autopilot social posting', 'Live review management'],
}

const BADGE: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-purple-100 text-purple-700',
  4: 'bg-amber-100 text-amber-700',
}

const PLAN_NAME: Record<number, string> = {
  1: 'Starter', 2: 'Grow', 3: 'Pro', 4: 'Elite',
}
const PLAN_PRICE: Record<number, number> = {
  1: 149, 2: 249, 3: 349, 4: 499,
}

export default function DashboardPlanCard() {
  const { tier, loading } = usePlan()
  const [expanded, setExpanded] = useState(false)

  if (loading) return null

  const name = PLAN_NAME[tier] || 'Starter'
  const price = PLAN_PRICE[tier] || 149
  const badge = BADGE[tier] || BADGE[1]
  const features = PLAN_FEATURES[tier] || PLAN_FEATURES[1]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge}`}>{name}</span>
          <span className="text-gray-900 font-bold">
            ${price}<span className="text-sm font-normal text-gray-500">/mo</span>
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

      {expanded && (
        <ul className="mt-4 space-y-1.5 border-t border-gray-100 pt-4">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
              {f}
            </li>
          ))}
          {tier < 4 && (
            <li className="pt-2">
              <a href="mailto:scott@ironwoodoperations.com?subject=Upgrade request"
                className="text-xs text-emerald-600 font-medium hover:underline">
                Upgrade plan →
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
