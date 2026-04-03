interface Props {
  platform: 'facebook' | 'instagram' | 'both'
  industry: string
  onSelect: (p: 'facebook' | 'instagram' | 'both') => void
}

export default function ComposerPlatformSelector({ platform, industry, onSelect }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span>🏠 {industry}</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Platform</h3>
        <div className="flex gap-2">
          {(['facebook', 'instagram', 'both'] as const).map(p => (
            <button key={p} onClick={() => onSelect(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                platform === p ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {p === 'both' ? 'Both' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
