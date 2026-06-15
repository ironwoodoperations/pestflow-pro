import { Check } from 'lucide-react'
import { PlanCardTier, planChangeMailto, PLAN_CHANGE_PHONE } from '../../../lib/planCardContent'

interface Props {
  plan: PlanCardTier
  currentTier: number
}

export default function DashboardPlanCard({ plan, currentTier }: Props) {
  const isCurrent = plan.tier === currentTier
  const borderCls = isCurrent
    ? 'border-2 border-emerald-500'
    : plan.mostPopular
      ? 'border-2 border-purple-300'
      : 'border border-gray-200'

  return (
    <div className={`relative bg-white rounded-xl ${borderCls} overflow-hidden flex flex-col`}>
      {plan.mostPopular && !isCurrent && (
        <span className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-bl-lg z-10">
          Most popular
        </span>
      )}

      <div className={`p-4 ${isCurrent ? 'bg-emerald-50' : 'bg-white'}`}>
        <div className="flex items-start justify-between mb-1">
          <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
          {isCurrent && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
              <Check size={11} />Current Plan
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">
          ${plan.price}<span className="text-sm font-normal text-gray-400">/mo</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{plan.tagline}</p>
      </div>

      <div className="p-4 flex-1 space-y-1.5">
        {plan.headerLine && (
          <p className="text-xs font-semibold text-gray-700 mb-1">{plan.headerLine}</p>
        )}
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-600">{f}</span>
          </div>
        ))}
      </div>

      <div className="p-4 pt-0">
        {isCurrent ? (
          // Current tier keeps a non-clickable state — no switch button.
          <div className="h-8" />
        ) : (
          <div>
            <a
              href={planChangeMailto(plan.name)}
              className="block w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition text-center"
            >
              Contact us to switch
            </a>
            <p className="text-center text-xs text-gray-500 mt-1.5">or call {PLAN_CHANGE_PHONE}</p>
          </div>
        )}
      </div>
    </div>
  )
}
