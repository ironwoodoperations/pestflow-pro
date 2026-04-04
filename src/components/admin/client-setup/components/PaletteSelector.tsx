interface Palette {
  id: string
  name: string
  primary: string
  accent: string
}

const SHELL_PALETTES: Record<string, Palette[]> = {
  'modern-pro': [
    { id: 'mp-1', name: 'Classic Emerald', primary: '#10b981', accent: '#0a0f1e' },
    { id: 'mp-2', name: 'Pacific Blue',    primary: '#0ea5e9', accent: '#0f172a' },
    { id: 'mp-3', name: 'Royal Violet',    primary: '#7c3aed', accent: '#0f172a' },
  ],
  'bold-local': [
    { id: 'bl-1', name: 'Amber Gold',   primary: '#d97706', accent: '#1c1c1c' },
    { id: 'bl-2', name: 'Cardinal Red', primary: '#dc2626', accent: '#1c1c1c' },
    { id: 'bl-3', name: 'Forest Green', primary: '#15803d', accent: '#1c1c1c' },
  ],
  'clean-friendly': [
    { id: 'cf-1', name: 'Sky Blue',   primary: '#0ea5e9', accent: '#0284c7' },
    { id: 'cf-2', name: 'Sage Green', primary: '#16a34a', accent: '#15803d' },
    { id: 'cf-3', name: 'Coral Warm', primary: '#f97316', accent: '#ea580c' },
  ],
  'rustic-rugged': [
    { id: 'rr-1', name: 'Rust & Brown',  primary: '#b5451b', accent: '#2c1a0e' },
    { id: 'rr-2', name: 'Pine Forest',   primary: '#166534', accent: '#2c1a0e' },
    { id: 'rr-3', name: 'Harvest Gold',  primary: '#b45309', accent: '#2c1a0e' },
  ],
}

interface PaletteSelectorProps {
  shell: string
  selectedId: string
  onChange: (primary: string, accent: string, paletteId: string) => void
}

export default function PaletteSelector({ shell, selectedId, onChange }: PaletteSelectorProps) {
  const palettes = SHELL_PALETTES[shell]
  if (!palettes) return null

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Color Palette</label>
      <div className="grid grid-cols-3 gap-3">
        {palettes.map(p => {
          const selected = selectedId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.primary, p.accent, p.id)}
              className={`rounded-lg border-2 p-3 text-left transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <p className="text-sm font-semibold text-gray-800 mb-2">{p.name}</p>
              <div className="flex gap-2 items-center">
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className="w-8 h-8 rounded-full inline-block border border-gray-200"
                    style={{ backgroundColor: p.primary }}
                  />
                  <span className="text-xs text-gray-400">Primary</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className="w-8 h-8 rounded-full inline-block border border-gray-200"
                    style={{ backgroundColor: p.accent }}
                  />
                  <span className="text-xs text-gray-400">Accent</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
