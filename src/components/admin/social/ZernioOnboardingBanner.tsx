interface Props {
  onOpenConnections: () => void
}

const PLATFORMS = [
  { icon: '📘', label: 'Facebook' },
  { icon: '📷', label: 'Instagram' },
  { icon: '▶️', label: 'YouTube' },
  { icon: '🔍', label: 'Google Business' },
  { icon: '💼', label: 'LinkedIn' },
]

export default function ZernioOnboardingBanner({ onOpenConnections }: Props) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Connect Your Social Media Accounts</h3>
      <p className="text-sm text-gray-600 mb-4">
        Your social media accounts connect directly from this dashboard — no passwords shared, no extra steps.
        Each platform takes about 30 seconds.
      </p>

      <div className="space-y-2 mb-5">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">How it works</p>
        {[
          'Click "Connect [Platform]" in the Connections panel',
          "You'll be taken to that platform to approve the connection",
          'Come back here — your account appears automatically',
          'Start scheduling posts immediately',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-gray-600">{step}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {PLATFORMS.map(({ icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            {icon} {label}
          </span>
        ))}
      </div>

      <button
        onClick={onOpenConnections}
        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
      >
        Connect Accounts →
      </button>
    </div>
  )
}
