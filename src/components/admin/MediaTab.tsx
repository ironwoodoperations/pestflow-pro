import { useRef, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Upload, Trash2, FolderInput, ImageIcon, Loader2, Sparkles, Lock } from 'lucide-react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import PageHelpBanner from './PageHelpBanner'
import { useImageLibrary, type ImageLibraryItem } from '../../hooks/useImageLibrary'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { useTierGate } from '../common/useTierGate'
import UpgradePrompt from '../common/UpgradePrompt'

// s247 — AI Vision tagging requires Pro (tier 3); ai-proxy/internal 403s below it.
const TAG_MIN_TIER = 3

// S242 — surface tag_status as a small corner badge on each image.
function tagBadge(item: ImageLibraryItem, busy: boolean): { label: string; cls: string; title?: string } | null {
  if (busy || item.tag_status === 'processing') return { label: 'Tagging…', cls: 'bg-blue-100 text-blue-700' }
  switch (item.tag_status) {
    case 'tagged':  return { label: item.tags.length ? `${item.tags.length} tags` : 'Tagged', cls: 'bg-emerald-100 text-emerald-700', title: item.tags.join(', ') }
    case 'failed':  return { label: 'Tag failed', cls: 'bg-red-100 text-red-700', title: item.tag_last_error ?? undefined }
    case 'pending': return { label: 'Queued', cls: 'bg-amber-100 text-amber-700' }
    default:        return { label: 'Untagged', cls: 'bg-gray-200 text-gray-600' }
  }
}

async function unwrapFnError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body?.error) return typeof body.error === 'string' ? body.error : (body.error.message ?? 'Tagging failed.')
    } catch { /* fall through */ }
  }
  return error instanceof Error ? error.message : 'Tagging failed.'
}

const ALL = '__all__'
const UNFILED = '__unfiled__'

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaTab() {
  const { items, loading, error, uploadMany, softDelete, setFolder, folders, refresh } = useImageLibrary()
  const { id: tenantId } = useTenant()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [activeFolder, setActiveFolder] = useState<string>(ALL)
  const [tagging, setTagging] = useState<Set<string>>(new Set())
  const tagGate = useTierGate(TAG_MIN_TIER)

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

  // S242 Item B — tag via tag-image-vision (targeted mode), DIRECT functions.invoke
  // (not ai-proxy). Loops per-image so multi-image batches show real progress;
  // refreshes rows afterward so new tags/status appear without a manual reload.
  async function tagImages(ids: string[]) {
    if (!tenantId || ids.length === 0) return
    // s247 — pre-emptive gate: under Pro, open the upgrade prompt and fire NO
    // request (backend 403 stays as defense-in-depth for entitled-but-lapsed).
    if (!tagGate.allowed) { tagGate.openPrompt(); return }
    setTagging(prev => new Set([...prev, ...ids]))
    const multi = ids.length > 1
    const toastId = multi ? toast.loading(`Tagging 0/${ids.length}…`) : undefined
    let ok = 0, failed = 0
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('tag-image-vision', {
          body: { mode: 'targeted', image_ids: [id], tenant_id: tenantId },
        })
        if (fnErr) throw new Error(await unwrapFnError(fnErr))
        if ((data?.tagged ?? 0) > 0) ok++
        else { failed++; if (!multi) toast.error('Tagging failed — hover the image badge for details.') }
      } catch (e) {
        failed++
        if (!multi) toast.error(e instanceof Error ? e.message : 'Tagging failed.')
      } finally {
        setTagging(prev => { const n = new Set(prev); n.delete(id); return n })
        if (toastId) toast.loading(`Tagging ${i + 1}/${ids.length}…`, { id: toastId })
      }
    }
    await refresh()
    if (multi) {
      if (failed === 0) toast.success(`Tagged ${ok} image${ok === 1 ? '' : 's'}.`, { id: toastId })
      else toast.error(`Tagged ${ok}, ${failed} failed — see the failed badges.`, { id: toastId })
    } else if (ok > 0) {
      toast.success('Image tagged.')
    }
  }

  const untaggedInView = visible.filter(i => i.tag_status !== 'tagged' && i.tag_status !== 'processing' && !tagging.has(i.id))

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
        <div className="flex items-center gap-2">
          {untaggedInView.length > 0 && (
            <button
              onClick={() => tagImages(untaggedInView.map(i => i.id))}
              disabled={tagging.size > 0}
              title={tagGate.allowed ? 'Tag all untagged images in this view with AI Vision' : 'AI Vision tagging is a Pro feature'}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                tagGate.allowed ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'
              }`}
            >
              {tagging.size > 0 ? <Loader2 className="w-4 h-4 animate-spin" />
                : tagGate.allowed ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Tag untagged ({untaggedInView.length})
            </button>
          )}
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
              {(() => {
                const b = tagBadge(img, tagging.has(img.id))
                return b ? (
                  <span className={`absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[10px] font-medium ${b.cls}`} title={b.title}>
                    {b.label}
                  </span>
                ) : null
              })()}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => tagImages([img.id])}
                    disabled={tagging.has(img.id)}
                    title={tagGate.allowed ? 'Tag with AI Vision' : 'AI Vision tagging is a Pro feature'}
                    className={`p-2 bg-white/90 rounded-full hover:bg-white disabled:opacity-50 ${tagGate.allowed ? 'text-emerald-600' : 'text-amber-600'}`}
                  >
                    {tagging.has(img.id) ? <Loader2 className="w-4 h-4 animate-spin" />
                      : tagGate.allowed ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
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

      <UpgradePrompt
        open={tagGate.open}
        requiredTier={TAG_MIN_TIER}
        featureName="AI Vision tagging"
        onClose={tagGate.closePrompt}
      />
    </div>
  )
}
