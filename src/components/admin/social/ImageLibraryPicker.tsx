import { useEffect, useMemo, useState } from 'react'
import { X, Search, ImageIcon } from 'lucide-react'
import { useImageLibrary, type ImageLibraryItem } from '../../../hooks/useImageLibrary'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (publicUrl: string, item: ImageLibraryItem) => void
  initialFolder?: string | null
}

const ALL = '__all__'
const UNFILED = '__unfiled__'

export default function ImageLibraryPicker({ open, onClose, onSelect, initialFolder = null }: Props) {
  const { items, loading, folders } = useImageLibrary()
  const [folderFilter, setFolderFilter] = useState<string>(initialFolder ?? ALL)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(i => {
      const folderOk =
        folderFilter === ALL ? true :
        folderFilter === UNFILED ? !i.folder :
        i.folder === folderFilter
      const queryOk = q ? i.original_filename.toLowerCase().includes(q) : true
      return folderOk && queryOk
    })
  }, [items, folderFilter, query])

  if (!open) return null

  const hasItems = items.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Choose from Library</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100">
          <select
            value={folderFilter}
            onChange={e => setFolderFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={ALL}>All folders</option>
            <option value={UNFILED}>Unfiled</option>
            {folders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by filename"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : !hasItems ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <ImageIcon className="w-10 h-10 mb-3" />
              <p className="text-sm">No images yet. Upload photos in the Media tab.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <p className="text-sm">No matches.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.publicUrl, item); onClose() }}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  title={item.original_filename}
                >
                  <img src={item.publicUrl} alt={item.original_filename} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
