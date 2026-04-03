import type { PexelsPhoto } from './useComposer'

interface Props {
  imageUrl: string
  pexelsQuery: string
  onImageUrlChange: (v: string) => void
  onPexelsQueryChange: (v: string) => void
  pexelsApiKey: string
  pexelsResults: PexelsPhoto[]
  pexelsLoading: boolean
  selectedPexelsUrl: string
  onSearchPexels: () => void
  onSelectPhoto: (url: string) => void
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function ComposerImagePicker({
  imageUrl, pexelsQuery, onImageUrlChange, onPexelsQueryChange,
  pexelsApiKey, pexelsResults, pexelsLoading, selectedPexelsUrl,
  onSearchPexels, onSelectPhoto,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Photo</h3>

      {!pexelsApiKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800">
            Add your free Pexels API key in Settings to search stock photos.
            Or paste any image URL directly below.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <input value={pexelsQuery} onChange={e => onPexelsQueryChange(e.target.value)}
              placeholder="Search photos..." className={`flex-1 ${inputClass}`}
              onKeyDown={e => { if (e.key === 'Enter') onSearchPexels() }} />
            <button onClick={onSearchPexels} disabled={pexelsLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
              {pexelsLoading ? 'Searching...' : 'Search Photos'}
            </button>
          </div>
          {pexelsResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {pexelsResults.map(photo => (
                <button key={photo.id} onClick={() => onSelectPhoto(photo.src.large)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPexelsUrl === photo.src.large
                      ? 'border-emerald-500 ring-2 ring-emerald-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}>
                  <img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Or paste image URL</label>
        <input value={imageUrl} onChange={e => onImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg" className={inputClass} />
      </div>
      {imageUrl && (
        <div className="mt-3">
          <img src={imageUrl} alt="Preview" className="w-32 h-24 object-cover rounded-lg border border-gray-200" />
        </div>
      )}
    </div>
  )
}
