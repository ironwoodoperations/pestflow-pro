import PalettePicker from '../shared/PalettePicker'

interface Props {
  shell: string
  primary: string
  accent: string
  onSelect: (primary: string, accent: string) => void
}

export default function PaletteSwatches({ primary, accent, onSelect }: Props) {
  return (
    <div className="col-span-2 space-y-1">
      <label className="text-xs text-gray-400">Color Palettes — all 12 available</label>
      <PalettePicker primary={primary} accent={accent} onSelect={onSelect} dark />
      <p className="text-xs text-gray-600">Click to apply — hex fields below for custom override.</p>
    </div>
  )
}
