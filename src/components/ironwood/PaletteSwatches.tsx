import { getPalettesForShell } from '../../lib/shellThemes'

interface Props {
  shell: string
  primary: string
  accent: string
  onSelect: (primary: string, accent: string) => void
}

export default function PaletteSwatches({ shell, primary, accent, onSelect }: Props) {
  const palettes = getPalettesForShell(shell)
  if (!palettes.length) return null

  return (
    <div className="col-span-2 space-y-1">
      <label className="text-xs text-gray-400">Color Palettes</label>
      <div className="grid grid-cols-3 gap-2">
        {palettes.map(p => {
          const isActive = primary === p.primary && accent === p.accent
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.primary, p.accent)}
              className={`rounded overflow-hidden border-2 transition ${isActive ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-gray-700 hover:border-gray-500'}`}
            >
              <div className="flex h-8">
                <div className="flex-1" style={{ background: p.primary }} />
                <div className="w-1/3" style={{ background: p.accent }} />
              </div>
              <div className="px-1.5 py-1 bg-gray-900">
                <p className="text-xs text-gray-300 truncate">{p.name}</p>
                {isActive && <p className="text-xs text-emerald-400 font-semibold">Active</p>}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-600">Click to apply — hex fields below for custom override.</p>
    </div>
  )
}
