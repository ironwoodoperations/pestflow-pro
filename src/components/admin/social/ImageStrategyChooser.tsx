import { useState } from 'react'
import { useImageLibrary } from '../../../hooks/useImageLibrary'
import ImageLibraryPicker from './ImageLibraryPicker'

// S242 — campaign image-strategy selector. Values mirror the backend contract
// (social_campaigns.image_strategy CHECK + process-campaign-job): none | folder
// | ai_vision | fixed. Folder requires a folder; fixed requires an image id.
export type ImageStrategy = 'none' | 'folder' | 'ai_vision' | 'fixed'

export interface ImageStrategyValue {
  image_strategy: ImageStrategy
  image_strategy_folder: string | null
  image_strategy_image_id: string | null
}

export const EMPTY_STRATEGY: ImageStrategyValue = {
  image_strategy: 'none',
  image_strategy_folder: null,
  image_strategy_image_id: null,
}

const OPTIONS: { key: ImageStrategy; label: string; hint: string }[] = [
  { key: 'none',      label: 'No images',          hint: 'Generate captions only.' },
  { key: 'folder',    label: 'From a folder',      hint: 'Pull a random image from a folder for each post.' },
  { key: 'ai_vision', label: 'Let AI match images', hint: 'AI picks the best-matching tagged library image for each post.' },
  { key: 'fixed',     label: 'One image for all',  hint: 'Attach the same image to every post.' },
]

interface Props {
  value: ImageStrategyValue
  onChange: (v: ImageStrategyValue) => void
}

export default function ImageStrategyChooser({ value, onChange }: Props) {
  const { folders, items, loading } = useImageLibrary()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [fixedThumb, setFixedThumb] = useState<string | null>(null)
  const hasImages = items.length > 0

  // Switching strategy clears the other strategy's config so the payload always
  // satisfies the social_campaigns image_strategy_config_matches CHECK.
  function select(key: ImageStrategy) {
    onChange({
      image_strategy: key,
      image_strategy_folder: key === 'folder' ? value.image_strategy_folder : null,
      image_strategy_image_id: key === 'fixed' ? value.image_strategy_image_id : null,
    })
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-700 block mb-1.5">Image attachment</label>
      <div className="space-y-2">
        {OPTIONS.map(opt => {
          const disabled = opt.key !== 'none' && !hasImages
          const checked = value.image_strategy === opt.key
          return (
            <div key={opt.key} className={`border rounded-lg p-3 ${checked ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200'} ${disabled ? 'opacity-50' : ''}`}>
              <label className={`flex items-start gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="radio" name="image_strategy" className="mt-0.5 accent-emerald-600"
                  checked={checked} disabled={disabled}
                  onChange={() => select(opt.key)}
                />
                <span>
                  <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                  <span className="block text-xs text-gray-500">
                    {opt.hint}{disabled ? ' — upload images in the Media tab first.' : ''}
                  </span>
                </span>
              </label>

              {checked && opt.key === 'folder' && (
                <div className="mt-2 pl-6">
                  <select
                    value={value.image_strategy_folder ?? ''}
                    onChange={e => onChange({ ...value, image_strategy_folder: e.target.value || null })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select a folder…</option>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {folders.length === 0 && !loading && (
                    <p className="text-xs text-amber-600 mt-1">No folders yet — organize images into folders in the Media tab.</p>
                  )}
                </div>
              )}

              {checked && opt.key === 'ai_vision' && (
                <p className="mt-2 pl-6 text-xs text-gray-500">
                  Only images that have been tagged with AI Vision are eligible. Tag images from the Media tab.
                </p>
              )}

              {checked && opt.key === 'fixed' && (
                <div className="mt-2 pl-6 flex items-center gap-3">
                  {fixedThumb && <img src={fixedThumb} alt="" className="w-12 h-12 rounded object-cover border border-gray-200" />}
                  <button
                    type="button" onClick={() => setPickerOpen(true)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {value.image_strategy_image_id ? 'Change image' : 'Choose image'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ImageLibraryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(publicUrl, item) => {
          onChange({ ...value, image_strategy: 'fixed', image_strategy_folder: null, image_strategy_image_id: item.id })
          setFixedThumb(publicUrl)
        }}
      />
    </div>
  )
}
