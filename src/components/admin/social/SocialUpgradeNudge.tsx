import { Lock } from 'lucide-react'

interface Props {
  planName: string
  price: string
  onNavigate?: (tab: string) => void
}

export default function SocialUpgradeNudge({ planName, price, onNavigate }: Props) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-10 text-center">
      <Lock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{planName} Plan Required</h3>
      <p className="text-sm text-gray-600 mb-1">This feature requires the {planName} plan or above.</p>
      <p className="text-sm font-semibold text-amber-700 mb-4">{price}/mo</p>
      {onNavigate ? (
        <button
          onClick={() => onNavigate('billing')}
          className="inline-block px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition"
        >
          Upgrade Plan →
        </button>
      ) : (
        <a
          href="mailto:support@pestflow.ai?subject=Upgrade Request"
          className="inline-block px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition"
        >
          Upgrade Plan →
        </a>
      )}
    </div>
  )
}
