interface ThemeSelectorProps {
  value: string
  onChange: (theme: string) => void
  tier?: number  // 1=Starter 2=Grow 3=Pro 4=Elite
}

const THEMES = [
  {
    key: 'modern-pro',
    name: 'Modern Pro',
    desc: 'Clean and professional. Dark navy with bold accents.',
    swatches: ['#10b981', '#0ea5e9', '#7c3aed'],
  },
  {
    key: 'bold-local',
    name: 'Bold Local',
    desc: 'Strong and confident. Built for local market leaders.',
    swatches: ['#d97706', '#dc2626', '#15803d'],
  },
  {
    key: 'clean-friendly',
    name: 'Clean & Friendly',
    desc: 'Approachable and bright. Great for residential focus.',
    swatches: ['#0ea5e9', '#16a34a', '#f97316'],
  },
  {
    key: 'rustic-rugged',
    name: 'Rustic & Rugged',
    desc: 'Warm and established. Perfect for trusted local brands.',
    swatches: ['#b5451b', '#166534', '#b45309'],
  },
  {
    key: 'metro-pro',
    name: 'Metro Pro',
    desc: 'Enterprise dark navbar. Sharp, metropolitan, professional. Pro & Elite only.',
    swatches: ['#1565C0', '#0D2137', '#2D3748'],
    proOnly: true,
  },
]

export default function ThemeSelector({ value, onChange, tier = 1 }: ThemeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Site Template</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEMES.filter(s => !s.proOnly || tier >= 3).map(s => {
          const selected = value === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              className={`text-left rounded-xl border-2 p-4 transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-sm font-bold ${selected ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {s.name}
                </p>
                {s.proOnly && <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-full">Pro</span>}
              </div>
              <p className="text-xs text-gray-400 leading-snug mb-2">{s.desc}</p>
              <div className="flex gap-1.5">
                {s.swatches.map(color => (
                  <span
                    key={color}
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
