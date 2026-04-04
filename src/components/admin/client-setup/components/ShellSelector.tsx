interface ShellSelectorProps {
  value: string
  onChange: (shell: string) => void
}

const SHELLS = [
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
]

export default function ShellSelector({ value, onChange }: ShellSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Site Template</label>
      <div className="grid grid-cols-2 gap-3">
        {SHELLS.map(s => {
          const selected = value === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              className={`text-left rounded-xl border-2 p-4 transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <p className={`text-sm font-bold mb-1 ${selected ? 'text-emerald-700' : 'text-gray-900'}`}>
                {s.name}
              </p>
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
