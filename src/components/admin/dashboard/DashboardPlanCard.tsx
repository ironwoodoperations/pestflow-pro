import { useState } from 'react'
import { Check } from 'lucide-react'

interface Props {
  tier: number
  name: string
  price: number
  subtitle: string
  features: string[]
  currentTier: number
  onNavigate: (tab: string) => void
}

const CURRENT_BORDER: Record<number, string> = {
  1: 'border-gray-400',
  2: 'border-blue-400',
  3: 'border-purple-400',
  4: 'border-amber-400',
}
const CURRENT_HEADER: Record<number, string> = {
  1: 'bg-gray-50',
  2: 'bg-blue-50',
  3: 'bg-purple-50',
  4: 'bg-amber-50',
}

export default function DashboardPlanCard({ tier, name, price, subtitle, features, currentTier, onNavigate }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isCurrent = tier === currentTier
  const isUpgrade = tier > currentTier
  const borderCls = isCurrent ? `border-2 ${CURRENT_BORDER[tier]}` : 'border border-gray-200'
  const headerCls = isCurrent ? CURRENT_HEADER[tier] : 'bg-white'

  return (
    <div className={`relative bg-white rounded-xl ${borderCls} overflow-hidden flex flex-col`}>
      <div className={`p-4 ${headerCls}`}>
        <div className="flex items-start justify-between mb-1">
          <p className="font-bold text-gray-900 text-sm">{name}</p>
          {isCurrent && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
              <Check size={11} />Current Plan
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">
          ${price}<span className="text-sm font-normal text-gray-400">/mo</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="p-4 flex-1 space-y-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-600">{f}</span>
          </div>
        ))}
      </div>

      <div className="p-4 pt-0">
        {isCurrent ? (
          <div className="h-8" />
        ) : isUpgrade ? (
          <button
            onClick={() => onNavigate('billing')}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition"
          >
            Upgrade to {name}
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowTooltip(t => !t)}
              onBlur={() => setTimeout(() => setShowTooltip(false), 150)}
              className="w-full py-2 border border-gray-300 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Downgrade
            </button>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-10">
                To change your plan, contact support@pestflow.ai
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
