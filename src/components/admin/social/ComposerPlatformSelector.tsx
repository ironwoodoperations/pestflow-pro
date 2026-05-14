const ALL_PLATFORMS = [
  { key: 'facebook',        label: 'Facebook',        icon: '📘' },
  { key: 'instagram',       label: 'Instagram',       icon: '📷' },
  { key: 'linkedin',        label: 'LinkedIn',        icon: '💼' },
  { key: 'google_business', label: 'Google Business', icon: '🔍' },
  { key: 'youtube',         label: 'YouTube',         icon: '▶️' },
  { key: 'tiktok',          label: 'TikTok',          icon: '🎵' },
]

interface Props {
  platform: string
  connectedKeys: string[]
  industry: string
  onSelect: (p: string) => void
}

export default function ComposerPlatformSelector({ platform, connectedKeys, industry, onSelect }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span>🏠 {industry}</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Platform</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map(({ key, label, icon }) => {
            const connected = connectedKeys.length === 0 || connectedKeys.includes(key)
            const active = platform === key
            return (
              <button
                key={key}
                onClick={() => { if (connected) onSelect(key) }}
                title={connected ? label : `Connect ${label} in the Connections tab`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  !connected
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : active
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
        {connectedKeys.length > 0 && !connectedKeys.some(k => ALL_PLATFORMS.some(p => p.key === k)) && (
          <p className="text-xs text-gray-400 mt-3">
            No platforms connected. Open Connections to link your accounts.
          </p>
        )}
      </div>
    </>
  )
}
