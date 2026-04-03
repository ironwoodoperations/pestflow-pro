import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { usePlan } from '../../context/PlanContext'

interface Props {
  tier: number
  children: ReactNode
  fallback?: ReactNode
}

export default function FeatureGate({ tier, children, fallback }: Props) {
  const { canAccess } = usePlan()

  if (!canAccess(tier)) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-1">This feature requires a higher plan</p>
        <p className="text-sm text-gray-500 mb-4">Upgrade to unlock full access.</p>
        <a
          href="mailto:scott@ironwoodoperations.com?subject=PestFlow Pro Upgrade Request"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Contact us to upgrade
        </a>
      </div>
    )
  }

  return <>{children}</>
}
