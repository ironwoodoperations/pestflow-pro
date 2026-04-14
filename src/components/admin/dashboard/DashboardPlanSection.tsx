import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { usePlan } from '../../../hooks/usePlan'
import { MONTHLY_PLANS } from '../../../lib/pricingConfig'
import DashboardPlanCard from './DashboardPlanCard'

interface Props {
  onNavigate: (tab: string) => void
  demoActive?: boolean
}

const PLAN_DETAILS: Record<number, { subtitle: string; features: string[] }> = {
  1: {
    subtitle: 'Website + CRM + basic SEO',
    features: [
      'Professional website',
      'Lead capture + CRM',
      'Location pages (up to 3)',
      'Basic SEO meta editor',
      'Basic reports',
    ],
  },
  2: {
    subtitle: 'Full SEO + Blog + Social scheduling',
    features: [
      'Everything in Starter',
      'Full SEO suite (Lighthouse, CWV, GSC/GA4)',
      'Blog / content management',
      'Unlimited location pages',
      'Social scheduling (manual)',
    ],
  },
  3: {
    subtitle: 'AI tools + campaigns + advanced reports',
    features: [
      'Everything in Grow',
      'AI keyword research',
      'AI social post generation',
      'Multi-day campaign batch posting',
      'AIO structured data',
    ],
  },
  4: {
    subtitle: 'All platforms + live reviews + priority support',
    features: [
      'Everything in Pro',
      'Social analytics (all platforms)',
      'Buffer multi-platform posting',
      'LeadFusion live Google reviews',
      'White-glove onboarding support',
    ],
  },
}

export default function DashboardPlanSection({ onNavigate, demoActive }: Props) {
  const { tier, loading } = usePlan()
  const [accordionOpen, setAccordionOpen] = useState(false)

  if (loading) return null
  if (!demoActive) return null  // Only show upgrade cards on the demo tenant
  if (tier >= 4) return null    // Elite — no upgrade options to show

  const currentPlan = MONTHLY_PLANS.find(p => p.tier === tier) ?? MONTHLY_PLANS[0]
  const currentDetails = PLAN_DETAILS[tier] ?? PLAN_DETAILS[1]

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {MONTHLY_PLANS.map(plan => (
          <DashboardPlanCard
            key={plan.tier}
            tier={plan.tier}
            name={plan.name}
            price={plan.price}
            subtitle={PLAN_DETAILS[plan.tier].subtitle}
            features={PLAN_DETAILS[plan.tier].features}
            currentTier={tier}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Collapsible accordion */}
      <button
        onClick={() => setAccordionOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
      >
        {accordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        What&apos;s included in {currentPlan.name}
      </button>
      {accordionOpen && (
        <div className="mt-3 pl-5 space-y-1 border-l-2 border-gray-100">
          {currentDetails.features.map((f, i) => (
            <p key={i} className="text-sm text-gray-600">✓ {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}
