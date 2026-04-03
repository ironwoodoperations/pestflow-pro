import type { ReactNode } from 'react'
import { usePlan } from './usePlan'
import { Lock } from 'lucide-react'

interface FeatureGateProps {
  minTier: number
  featureName: string
  children: ReactNode
}

export function FeatureGate({ minTier, featureName, children }: FeatureGateProps) {
  const { canAccess } = usePlan()

  if (!canAccess(minTier)) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">{featureName}</h3>
        <p className="text-sm text-gray-500">Upgrade your plan to access this feature.</p>
      </div>
    )
  }

  return <>{children}</>
}
