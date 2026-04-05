import { useState, useEffect } from 'react'
import { ImageIcon } from 'lucide-react'

interface PexelsPhoto { id: number; src: { medium: string; large: string }; alt: string }

const PEST_QUERIES: Record<string, string> = {
  'spider-control':      'spider pest control',
  'mosquito-control':    'mosquito pest control',
  'ant-control':         'ant infestation exterminator',
  'wasp-hornet-control': 'wasp hornet nest removal',
  'roach-control':       'cockroach extermination',
  'flea-tick-control':   'flea tick pest control',
  'rodent-control':      'rodent mouse pest control',
  'scorpion-control':    'scorpion pest control',
  'bed-bug-control':     'bed bug pest treatment',
  'pest-control':        'pest control technician spraying',
  'termite-control':     'termite damage wood treatment',
  'termite-inspections': 'termite inspection home',
}

interface Props {
  pageSlug: string
  pexelsApiKey: string
  selectedUrl: string
  onSelect: (url: string) => void
}

export default function PestImagePicker({ pageSlug, pexelsApiKey, selectedUrl, onSelect }: Props) {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const query = PEST_QUERIES[pageSlug]
    let cancelled = false
    async function run() {
      if (!query || !pexelsApiKey) { setPhotos([]); return }
      setLoading(true)
      setPhotos([])
      fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`,
        { headers: { Authorization: pexelsApiKey } }
      )
        .then(r => r.json())
        .then(data => { if (!cancelled) setPhotos(data.photos || []) })
        .catch(() => { if (!cancelled) setPhotos([]) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    run()
    return () => { cancelled = true }
  }, [pageSlug, pexelsApiKey])

  if (!pexelsApiKey) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
        Add your Pexels API key in Settings → Integrations to enable image search.
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
        <ImageIcon size={14} /> Page Image
        {loading && <span className="text-xs text-gray-400 font-normal ml-1">Searching…</span>}
      </label>

      {!loading && photos.length === 0 && (
        <p className="text-xs text-gray-400">No results — check your Pexels API key.</p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map(photo => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onSelect(selectedUrl === photo.src.large ? '' : photo.src.large)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                selectedUrl === photo.src.large
                  ? 'border-emerald-500 ring-2 ring-emerald-300'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {selectedUrl && (
        <p className="text-xs text-emerald-600 truncate">Selected: {selectedUrl.split('/').pop()?.split('?')[0]}</p>
      )}
    </div>
  )
}
