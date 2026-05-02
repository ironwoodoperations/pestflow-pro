import { useState, useRef, useEffect } from 'react'
import { Sparkles, RotateCcw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { toast } from 'sonner'

interface ContentForm { title: string; subtitle: string; intro: string; video_url: string; image_url: string; pageHeroImageUrl: string; image1Url: string; image2Url: string; image3Url: string }

const PAGES_WITH_IMAGES = new Set([
  'home','about','pest-control','termite-control','termite-inspections',
  'roach-control','ant-control','spider-control','scorpion-control','mosquito-control',
  'bed-bug-control','flea-tick-control','rodent-control','wasp-hornet-control',
])

const IMAGE_COL = ['image_1_url', 'image_2_url', 'image_3_url'] as const

interface Props {
  selectedSlug: string
  form: ContentForm
  loading: boolean; saving: boolean; aiLoading: boolean; reverting: boolean
  isPestPage: boolean; apiKey: string
  heroHeadline?: string
  onHeroHeadlineChange?: (val: string) => void
  applyHeroToAllPages?: boolean
  updateField: (field: keyof ContentForm, value: string) => void
  onSave: () => void
  onGenerateAI: () => void
  onRevert: () => void
  onImageUpdate?: (field: 'pageHeroImageUrl' | 'image1Url' | 'image2Url' | 'image3Url', url: string) => void
}

function PageImageUpload({ slug, index, onUpdate }: { slug: string; index: number; onUpdate?: (url: string) => void }) {
  const { id: tenantId } = useTenant()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const colName = IMAGE_COL[index]
  const label = `Image ${index + 1}`

  useEffect(() => {
    if (!tenantId) return
    supabase.from('page_content')
      .select('image_1_url, image_2_url, image_3_url')
      .eq('tenant_id', tenantId).eq('page_slug', slug).maybeSingle()
      .then(({ data }) => {
        const newVal = (data as Record<string, unknown> | null)?.[colName] as string | null
        setCurrentUrl(newVal || null)
      })
  }, [tenantId, slug, colName, index])

  async function handleFile(file: File) {
    if (!tenantId || !file) return
    const ext = file.name.split('.').pop()
    const path = `${tenantId}/pages/${slug}/image-${index}.${ext}`
    setUploading(true)
    const { data, error } = await supabase.storage.from('tenant-assets').upload(path, file, { upsert: true })
    setUploading(false)
    if (error) { toast.error('Upload failed: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('tenant-assets').getPublicUrl(data.path)
    const { error: saveError } = await supabase.from('page_content').upsert(
      { tenant_id: tenantId, page_slug: slug, [colName]: publicUrl },
      { onConflict: 'tenant_id,page_slug' }
    )
    if (saveError) { toast.error('Save failed: ' + saveError.message); return }
    setCurrentUrl(publicUrl)
    onUpdate?.(publicUrl)
    toast.success('Image uploaded!')
  }

  async function handleRemove() {
    if (!tenantId) return
    const { error } = await supabase.from('page_content').upsert(
      { tenant_id: tenantId, page_slug: slug, [colName]: '' },
      { onConflict: 'tenant_id,page_slug' }
    )
    if (error) { toast.error('Remove failed: ' + error.message); return }
    setCurrentUrl(null)
    onUpdate?.('')
    toast.success('Image removed.')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {currentUrl && (
        <div className="mb-3 relative inline-block">
          <img src={currentUrl} alt="" className="h-32 w-48 object-cover rounded-lg border border-gray-200" />
          <button onClick={handleRemove}
            className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
            title="Remove image">×</button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      <button onClick={() => inputRef.current?.click()} disabled={uploading}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
        {uploading ? 'Uploading...' : currentUrl ? '🔄 Replace Image' : '📷 Upload Image'}
      </button>
      <p className="text-xs text-gray-400 mt-1">Recommended: 1200×600px.</p>
    </div>
  )
}

function HeroImageUpload({ slug, onUpdate, masterOverride = false }: { slug: string; onUpdate?: (url: string) => void; masterOverride?: boolean }) {
  const { id: tenantId } = useTenant()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    supabase.from('page_content')
      .select('page_hero_image_url, image_url')
      .eq('tenant_id', tenantId).eq('page_slug', slug).maybeSingle()
      .then(({ data }) => {
        const d = data as { page_hero_image_url?: string | null; image_url?: string | null } | null
        setCurrentUrl(d?.page_hero_image_url || d?.image_url || null)
      })
  }, [tenantId, slug])

  async function handleFile(file: File) {
    if (!tenantId || !file) return
    setUploading(true)
    const { data, error } = await supabase.storage.from('tenant-assets').upload(
      `${tenantId}/pages/${slug}/hero.${file.name.split('.').pop()}`, file, { upsert: true }
    )
    setUploading(false)
    if (error) { toast.error('Upload failed: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('tenant-assets').getPublicUrl(data.path)
    const { error: saveError } = await supabase.from('page_content').upsert(
      { tenant_id: tenantId, page_slug: slug, page_hero_image_url: publicUrl },
      { onConflict: 'tenant_id,page_slug' }
    )
    if (saveError) { toast.error('Save failed: ' + saveError.message); return }
    setCurrentUrl(publicUrl); onUpdate?.(publicUrl); toast.success('Hero image uploaded!')
  }

  async function handleRemove() {
    if (!tenantId) return
    const { error } = await supabase.from('page_content').upsert(
      { tenant_id: tenantId, page_slug: slug, page_hero_image_url: '' },
      { onConflict: 'tenant_id,page_slug' }
    )
    if (error) { toast.error('Remove failed: ' + error.message); return }
    setCurrentUrl(null); onUpdate?.(''); toast.success('Hero image removed.')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Page Hero Image</label>
      <p className="text-xs text-gray-400 mb-2">
        Optional. Overrides the Master Hero for this page only. Leave blank to use the Master Hero set in Settings → Hero Media.
      </p>
      {masterOverride && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
          Master Hero is currently overriding per-page images. Uncheck &ldquo;Apply hero image to all pages&rdquo; in Settings → Hero Media to enable per-page images.
        </p>
      )}
      {currentUrl && !masterOverride && (
        <div className="mb-3 relative inline-block">
          <img src={currentUrl} alt="" className="h-24 w-40 object-cover rounded-lg border border-gray-200" />
          <button onClick={handleRemove} disabled={masterOverride} className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 disabled:opacity-50" title="Remove">×</button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      <button onClick={() => inputRef.current?.click()} disabled={uploading || masterOverride}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
        {uploading ? 'Uploading...' : currentUrl ? '🔄 Replace Hero' : '🖼️ Upload Page Hero Image'}
      </button>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function ContentPageForm({ selectedSlug, form, loading, saving, aiLoading, reverting, isPestPage, apiKey, heroHeadline, onHeroHeadlineChange, applyHeroToAllPages, updateField, onSave, onGenerateAI, onRevert, onImageUpdate }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Editing: <span className="text-emerald-600">{selectedSlug}</span></h3>
      <p className="text-gray-500 text-sm mb-6">Content changes will appear on the public page immediately after save.</p>
      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-4">
          {selectedSlug === 'home' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Headline</label>
              <input type="text" value={heroHeadline || ''} onChange={e => onHeroHeadlineChange?.(e.target.value)} placeholder="e.g. Professional Pest Control You Can Trust" className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">This is the large text shown in the hero section of your homepage.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Title</label>
            <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Page title" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">Used for browser tab and SEO only — not shown on the page.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {selectedSlug === 'home' ? 'Hero Subtext (shown under main headline)' : 'Subtitle'}
            </label>
            <input type="text" value={form.subtitle} onChange={e => updateField('subtitle', e.target.value)} placeholder="Subtitle or tagline" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro / Body</label>
            <textarea value={form.intro} onChange={e => updateField('intro', e.target.value)} rows={6} placeholder="Main content or intro text" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL</label>
            <input type="text" value={form.video_url} onChange={e => updateField('video_url', e.target.value)} placeholder="https://youtube.com/..." className={inputClass} />
          </div>

          {PAGES_WITH_IMAGES.has(selectedSlug) && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <HeroImageUpload slug={selectedSlug} onUpdate={url => onImageUpdate?.('pageHeroImageUrl', url)} masterOverride={applyHeroToAllPages} />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">Additional Images</p>
              <PageImageUpload slug={selectedSlug} index={0} onUpdate={url => onImageUpdate?.('image1Url', url)} />
              <PageImageUpload slug={selectedSlug} index={1} onUpdate={url => onImageUpdate?.('image2Url', url)} />
              <PageImageUpload slug={selectedSlug} index={2} onUpdate={url => onImageUpdate?.('image3Url', url)} />
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button onClick={onSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Content'}
            </button>
            <button onClick={onGenerateAI} disabled={aiLoading || !apiKey} title={!apiKey ? 'Set VITE_ANTHROPIC_API_KEY to enable' : isPestPage ? 'Generate SEO-optimized pest service copy' : 'Generate page copy with AI'} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
              <Sparkles size={14} /> {aiLoading ? 'Generating...' : isPestPage ? 'AI Write (Pest SEO)' : 'AI Write'}
            </button>
            <button onClick={onRevert} disabled={reverting} className="flex items-center gap-1.5 border border-gray-300 text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
              <RotateCcw size={14} /> {reverting ? 'Reverting...' : 'Revert to Original'}
            </button>
          </div>
          {aiLoading && <p className="text-xs text-gray-400 mt-2">AI-generated content. Review before saving.</p>}
        </div>
      )}
    </div>
  )
}
