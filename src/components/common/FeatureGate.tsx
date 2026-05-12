import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { usePlan } from '../../context/PlanContext'

interface Props {
  minTier: number
  featureName?: string
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({ minTier, featureName, children, fallback }: Props) {
  const { canAccess } = usePlan()

  if (!canAccess(minTier)) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        {featureName
          ? <h3 className="text-lg font-semibold text-gray-700 mb-1">{featureName}</h3>
          : <p className="text-gray-600 font-medium mb-1">This feature requires a higher plan</p>
        }
        <p className="text-sm text-gray-500 mb-4">Available on Growth and above. Contact us to unlock.</p>
        <a
          href="mailto:support@pestflowpro.ai?subject=Upgrade Request - PestFlow Pro"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Upgrade to Growth →
        </a>
      </div>
    )
  }

  return <>{children}</>
}

export default FeatureGate
