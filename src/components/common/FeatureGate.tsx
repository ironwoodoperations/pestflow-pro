import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { usePlan } from '../../context/PlanContext'
import { tierInfo } from '../../lib/tierInfo'
import { PLATFORM_NAME } from '../../../shared/lib/platformBrand'

interface Props {
  minTier: number
  featureName?: string
  children: ReactNode
  fallback?: ReactNode
}

// The lock panel names the plan THIS gate actually requires, resolved from
// tierInfo(minTier) — never a literal. Before, the copy was hardcoded to
// "Growth" regardless of minTier, so a customer already ON Growth who hit a
// tier-3 feature was told to upgrade to the plan they were already paying for.
// Phrasing mirrors UpgradePrompt (S247) so the two upgrade surfaces read as one
// product. tierInfo.ts is the single source of truth for tier name + price.
export function FeatureGate({ minTier, featureName, children, fallback }: Props) {
  const { canAccess } = usePlan()

  if (!canAccess(minTier)) {
    // A caller-supplied fallback replaces this panel entirely — those call sites
    // write their own copy and are unaffected by anything below.
    if (fallback) return <>{fallback}</>
    const target = tierInfo(minTier)
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
        <Lock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        {featureName
          ? <h3 className="text-lg font-semibold text-gray-700 mb-1">{featureName}</h3>
          : <p className="text-gray-600 font-medium mb-1">This feature requires a higher plan</p>
        }
        <p className="text-sm text-gray-500 mb-4">
          Available on the {target.name} plan
          <span className="whitespace-nowrap"> (${target.price}/mo)</span> and above. Contact us to unlock.
        </p>
        <a
          href={`mailto:support@homeflowpro.ai?subject=Upgrade Request - ${PLATFORM_NAME}`}
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Upgrade to {target.name} →
        </a>
      </div>
    )
  }

  return <>{children}</>
}

export default FeatureGate
