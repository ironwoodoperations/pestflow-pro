import PalettePicker from '../shared/PalettePicker'
import { getPalettesForTheme } from '../../lib/shellThemes'

interface Props {
  theme: string
  primary: string
  accent: string
  onSelect: (primary: string, accent: string) => void
}

export default function PaletteSwatches({ theme, primary, accent, onSelect }: Props) {
  const filteredPalettes = getPalettesForTheme(theme)
  const label = theme === 'metro-pro'
    ? 'Metro Pro Palettes (Pro/Elite)'
    : filteredPalettes.length > 0
      ? `${filteredPalettes.length} palettes for this theme`
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
