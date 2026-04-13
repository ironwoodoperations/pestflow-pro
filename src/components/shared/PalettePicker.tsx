import { PALETTES, type ShellPalette } from '../../lib/shellThemes'

interface Props {
  primary: string
  accent: string
  onSelect: (primary: string, accent: string) => void
  dark?: boolean
  palettes?: ShellPalette[]
}

export default function PalettePicker({ primary, accent, onSelect, dark = false, palettes }: Props) {
  const displayPalettes = palettes ?? PALETTES
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {displayPalettes.map(p => {
        const isActive = primary === p.primary && accent === p.accent
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.primary, p.accent)}
            className={`rounded-xl border-2 overflow-hidden transition ${
              isActive
                ? dark
                  ? 'border-emerald-400 ring-1 ring-emerald-400'
                  : 'border-emerald-500 shadow-md'
                : dark
                  ? 'border-gray-700 hover:border-gray-500'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex h-10">
              <div className="flex-1" style={{ background: p.primary }} />
              <div className="w-1/3" style={{ background: p.accent }} />
            </div>
            <div className={`px-2 py-1.5 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
              <p className={`text-xs font-medium truncate ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                {p.name}
              </p>
              {isActive && (
                <p className={`text-xs font-semibold ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  Active
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
