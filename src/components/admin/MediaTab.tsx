import { useRef, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Upload, Trash2, FolderInput, ImageIcon, Loader2 } from 'lucide-react'
import PageHelpBanner from './PageHelpBanner'
import { useImageLibrary } from '../../hooks/useImageLibrary'

const ALL = '__all__'
const UNFILED = '__unfiled__'

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaTab() {
  const { items, loading, error, uploadMany, softDelete, setFolder, folders } = useImageLibrary()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [activeFolder, setActiveFolder] = useState<string>(ALL)

  const visible = useMemo(() => {
    if (activeFolder === ALL) return items
    if (activeFolder === UNFILED) return items.filter(i => !i.folder)
    return items.filter(i => i.folder === activeFolder)
  }, [items, activeFolder])

  async function handleFiles(files: FileList | File[] | null) {
    if (!files) return
    const list = Array.from(files)
    if (list.length === 0) return
    const target = activeFolder === ALL || activeFolder === UNFILED ? null : activeFolder
    setUploading(true)
    try {
      const n = await uploadMany(list, target)
      if (n === 0) toast.error('No image files found.')
      else toast.success(`Uploaded ${n} image${n === 1 ? '' : 's'}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await softDelete(id)
      toast.success('Image removed.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  async function handleAssignFolder(id: string, current: string | null) {
    const next = window.prompt('Move to folder (leave blank to unfile):', current ?? '')
    if (next === null) return
    const value = next.trim() || null
    try {
      await setFolder(id, value)
      toast.success(value ? `Moved to "${value}".` : 'Unfiled.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not move image.')
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      className={`relative rounded-xl ${dragOver ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
    >
      <PageHelpBanner
        tab="media"
        title="🖼️ Media Library"
        body="Upload and organize photos here, then attach them to social posts and blog posts. Drag-and-drop images anywhere on this page to upload. Images are automatically resized for the web."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Folder</label>
          <select
            value={activeFolder}
            onChange={e => setActiveFolder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={ALL}>All photos ({items.length})</option>
            <option value={UNFILED}>Unfiled</option>
            {folders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-emerald-50/80 border-2 border-dashed border-emerald-400">
          <p className="text-emerald-700 font-medium">Drop images to upload</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-4">Could not load library: {error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <ImageIcon className="w-10 h-10 mb-3" />
          <p className="text-sm">No images yet. Click Upload or drag files here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {visible.map(img => (
            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={img.publicUrl} alt={img.original_filename} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAssignFolder(img.id, img.folder)}
                    title="Move to folder"
                    className="p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white"
                  >
                    <FolderInput className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    title="Remove"
                    className="p-2 bg-white/90 rounded-full text-red-600 hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="px-2 text-[11px] text-white/90 truncate max-w-full">{formatSize(img.size_bytes)}</span>
                {img.folder && <span className="px-2 text-[11px] text-emerald-200 truncate max-w-full">{img.folder}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
