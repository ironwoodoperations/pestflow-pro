import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { usePlan } from '../../../hooks/usePlan'
import { PLAN_CARD_TIERS } from '../../../lib/planCardContent'
import DashboardPlanCard from './DashboardPlanCard'
import RemiAddonStrip from '../RemiAddonStrip'

interface Props {
  demoActive?: boolean
}

export default function DashboardPlanSection({ demoActive }: Props) {
  const { tier, loading } = usePlan()
  const [accordionOpen, setAccordionOpen] = useState(false)

  if (loading) return null
  if (!demoActive) return null  // Only show the plan menu on the demo tenant

  const currentPlan = PLAN_CARD_TIERS.find(p => p.tier === tier) ?? PLAN_CARD_TIERS[0]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Your Plan</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          ● Active
        </span>
        <span className="text-sm text-gray-600">
          Currently on <strong className="text-gray-800">{currentPlan.name}</strong>
        </span>
      </div>

      {/* 4 plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {PLAN_CARD_TIERS.map(plan => (
          <DashboardPlanCard
            key={plan.tier}
            plan={plan}
            currentTier={tier}
          />
        ))}
      </div>

      {/* Remi add-on strip — below the four cards, visually separate */}
      <RemiAddonStrip />

      {/* Collapsible accordion — what's included in the current plan */}
      <button
        onClick={() => setAccordionOpen(o => !o)}
        className="mt-5 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
      >
        {accordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        What&apos;s included in {currentPlan.name}
      </button>
      {accordionOpen && (
        <div className="mt-3 pl-5 space-y-1 border-l-2 border-gray-100">
          {currentPlan.headerLine && (
            <p className="text-sm font-semibold text-gray-700">{currentPlan.headerLine}</p>
          )}
          {currentPlan.features.map((f, i) => (
            <p key={i} className="text-sm text-gray-600">✓ {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}
