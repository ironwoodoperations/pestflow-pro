import PalettePicker from '../shared/PalettePicker'
import { getPalettesForShell } from '../../lib/shellThemes'

interface Props {
  shell: string
  primary: string
  accent: string
  onSelect: (primary: string, accent: string) => void
}

export default function PaletteSwatches({ shell, primary, accent, onSelect }: Props) {
  const filteredPalettes = getPalettesForShell(shell)
  const label = shell === 'metro-pro'
    ? 'Metro Pro Palettes (Pro/Elite)'
    : filteredPalettes.length > 0
      ? `${filteredPalettes.length} palettes for this shell`
      : 'All palettes available'

  return (
    <div className="col-span-2 space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <PalettePicker
        primary={primary}
        accent={accent}
        onSelect={onSelect}
        dark
        palettes={filteredPalettes.length > 0 ? filteredPalettes : undefined}
      />
      <p className="text-xs text-gray-600">Click to apply — hex fields below for custom override.</p>
    </div>
  )
}
