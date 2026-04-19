import { PALETTES } from '../../../../lib/shellThemes'

interface PaletteSelectorProps {
  theme: string
  selectedId: string
  onChange: (primary: string, accent: string, paletteId: string) => void
}

export default function PaletteSelector({ selectedId, onChange }: PaletteSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Color Palette</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PALETTES.map(p => {
          const selected = selectedId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.primary, p.accent, p.id)}
              className={`rounded-xl border-2 overflow-hidden transition ${
                selected ? 'border-emerald-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex h-10">
                <div className="flex-1" style={{ background: p.primary }} />
                <div className="w-1/3" style={{ background: p.accent }} />
              </div>
              <div className="px-2 py-1.5 bg-white">
                <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                {selected && <p className="text-xs text-emerald-600 font-semibold">Active</p>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
