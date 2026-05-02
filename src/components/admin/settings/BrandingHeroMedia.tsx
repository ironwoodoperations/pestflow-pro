import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import { clearHeroCacheImageUrl } from '../../../lib/heroCache'
import { clearHeroMemCache } from '../../../hooks/usePageHeroImage'
import { triggerRevalidate } from '../../../lib/revalidate'

type MediaType = 'image' | 'youtube' | 'upload'

interface HeroMedia { type: MediaType; url: string }

function extractYouTubeId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : ''
}

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function BrandingHeroMedia() {
  const { id: tenantId } = useTenant()
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [uploading, setUploading]           = useState(false)
  const [confirmRemove, setConfirm]         = useState(false)
  const [mode, setMode]                     = useState<'image' | 'video'>('image')
  const [videoSub, setVideoSub]             = useState<'youtube' | 'upload'>('youtube')
  const [media, setMedia]                   = useState<HeroMedia>({ type: 'image', url: '' })
  const [applyToAll, setApplyToAll]         = useState(false)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
    ]).then(([heroRes, brandingRes]) => {
        const v = heroRes.data?.value
        if (v?.mode === 'image') {
          setMedia({ type: 'image', url: v.master_hero_image_url || v.image_url || v.url || v.thumbnail_url || '' })
          setMode('image')
        } else if (v?.mode === 'video') {
          const isYt = !!v.youtube_id
          setMedia({ type: isYt ? 'youtube' : 'upload', url: isYt ? `https://www.youtube.com/watch?v=${v.youtube_id}` : (v.video_url || v.url || '') })
          setMode('video'); setVideoSub(isYt ? 'youtube' : 'upload')
        } else if (v?.thumbnail_url) {
          setMedia({ type: 'image', url: v.thumbnail_url })
          setMode('image')
        } else if (v?.youtube_id) {
          setMedia({ type: 'youtube', url: `https://www.youtube.com/watch?v=${v.youtube_id}` })
          setMode('video'); setVideoSub('youtube')
        }
        const bv = brandingRes.data?.value as { apply_hero_to_all_pages?: boolean } | null
        setApplyToAll(bv?.apply_hero_to_all_pages ?? false)
        setLoading(false)
      })
  }, [tenantId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean) {
    if (!tenantId || !e.target.files?.length) return
    const file = e.target.files[0]
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const timestamp = Date.now()
    const filePath = `${tenantId}/${isVideo ? 'hero-video' : 'hero'}_${timestamp}.${ext}`
    setUploading(true)
    const { error } = await supabase.storage.from('tenant-assets').upload(filePath, file, { upsert: true })
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return }
    const publicUrl = supabase.storage.from('tenant-assets').getPublicUrl(filePath).data.publicUrl
    // Store URL with cache-bust param so admin preview always shows the fresh image
    setMedia({ type: isVideo ? 'upload' : 'image', url: `${publicUrl}?v=${timestamp}` })
    setUploading(false)
    toast.success('File uploaded — save to apply.')
  }

  async function handleSave() {
    if (!tenantId) return
    const cleanUrl = media.url.split('?v=')[0]  // strip cache-bust before saving to DB
    const youtubeId = videoSub === 'youtube' ? extractYouTubeId(cleanUrl) : ''
    const value: Record<string, string> = mode === 'image'
      ? { mode: 'image', master_hero_image_url: cleanUrl, image_url: cleanUrl, url: cleanUrl, thumbnail_url: cleanUrl, video_url: '', youtube_id: '' }
      : { mode: 'video', master_hero_image_url: '', image_url: '', url: cleanUrl, video_url: cleanUrl, youtube_id: youtubeId, thumbnail_url: '' }
    setSaving(true)
    // Save hero_media and apply_hero_to_all_pages flag (stored in branding) together
    const [heroRes, brandingRes] = await Promise.all([
      supabase.from('settings')
        .upsert({ tenant_id: tenantId, key: 'hero_media', value }, { onConflict: 'tenant_id,key' })
        .select('tenant_id'),
      supabase.from('settings')
        .select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle()
        .then(async ({ data: existing }) => {
          const merged = { ...(existing?.value ?? {}), apply_hero_to_all_pages: applyToAll }
          return supabase.from('settings')
            .upsert({ tenant_id: tenantId, key: 'branding', value: merged }, { onConflict: 'tenant_id,key' })
            .select('tenant_id')
        }),
    ])
    setSaving(false)
    if (heroRes.error) {
      console.error('Hero media save failed:', heroRes.error)
      toast.error('Save failed: ' + heroRes.error.message)
      return
    }
    if (!heroRes.data || heroRes.data.length === 0) {
      toast.error('Save failed — please log out and log back in.')
      return
    }
    if (brandingRes.error) {
      toast.error('Hero flag save failed: ' + brandingRes.error.message)
      return
    }
    clearHeroCacheImageUrl()
    if (tenantId) clearHeroMemCache(tenantId)
    try { localStorage.removeItem(`pfp_tenant_boot_v2:${window.location.hostname}`); delete (window as any).__TENANT_BOOT__ } catch {}
    toast.success('Hero media saved!')
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (accessToken && tenantId) await triggerRevalidate({ type: 'settings', tenantId }, accessToken)
  }

  function handleRemove() { setMedia({ type: mode === 'image' ? 'image' : videoSub, url: '' }); setConfirm(false) }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
      <h3 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">Master Hero Image</h3>
      <p className="text-sm text-gray-500">Set the default hero image shown across your entire site. Individual pages can override this by uploading their own Page Hero Image in the Content tab.</p>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['image', 'video'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setMedia(prev => ({ ...prev, type: m === 'image' ? 'image' : videoSub })) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${mode === m ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'}`}>
            {m === 'image' ? 'Image' : 'Video'}
          </button>
        ))}
      </div>

      {mode === 'image' && (
        <div className="space-y-3">
          {media.url && media.type === 'image' ? (
            <div className="space-y-2">
              <img src={media.url} alt="Hero preview" className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div className="flex gap-2">
                <label className="cursor-pointer text-xs font-medium text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition">
                  {uploading ? 'Uploading…' : 'Replace Image'}
                  <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={e => handleUpload(e, false)} />
                </label>
                {confirmRemove ? (
                  <>
                    <button onClick={handleRemove} className="text-xs text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Confirm Remove</button>
                    <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirm(true)} className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Remove</button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition">
                {uploading ? 'Uploading…' : '+ Upload Hero Image'}
                <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={e => handleUpload(e, false)} />
              </label>
              <p className="text-xs text-gray-400 mt-1">Recommended: 1920×1080px JPG or WebP</p>
            </div>
          )}
        </div>
      )}

      {mode === 'video' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['youtube', 'upload'] as const).map(v => (
              <button key={v} onClick={() => setVideoSub(v)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition ${videoSub === v ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                {v === 'youtube' ? 'YouTube URL' : 'Upload Video'}
              </button>
            ))}
          </div>

          {videoSub === 'youtube' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">YouTube URL</label>
              <input className={inp} value={media.url} onChange={e => setMedia({ type: 'youtube', url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
              <p className="text-xs text-gray-400 mt-1">Paste the full YouTube link</p>
            </div>
          )}

          {videoSub === 'upload' && (
            <div className="space-y-2">
              {media.url && media.type === 'upload' ? (
                <div className="space-y-2">
                  <video src={media.url} className="w-full max-h-48 rounded-lg border border-gray-200" controls />
                  <div className="flex gap-2">
                    <label className="cursor-pointer text-xs font-medium text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition">
                      {uploading ? 'Uploading…' : 'Replace Video'}
                      <input type="file" className="hidden" accept="video/*" disabled={uploading} onChange={e => handleUpload(e, true)} />
                    </label>
                    {confirmRemove ? (
                      <>
                        <button onClick={handleRemove} className="text-xs text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Confirm Remove</button>
                        <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirm(true)} className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Remove</button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition">
                    {uploading ? 'Uploading…' : '+ Upload Video'}
                    <input type="file" className="hidden" accept="video/*" disabled={uploading} onChange={e => handleUpload(e, true)} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">MP4 recommended, max ~50MB</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
        <input
          type="checkbox"
          id="applyHeroToAll"
          checked={applyToAll}
          onChange={e => setApplyToAll(e.target.checked)}
          className="w-4 h-4 mt-0.5 cursor-pointer accent-emerald-500 flex-shrink-0"
        />
        <div>
          <label htmlFor="applyHeroToAll" className="text-sm font-medium text-gray-700 cursor-pointer block">
            Apply hero image to all pages
          </label>
          <p className="text-xs text-gray-400 mt-0.5">
            When checked, the Master Hero above overrides all pages — even ones with their own hero image uploaded. Leave unchecked to use per-page hero images where set.
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Master Hero'}
      </button>
    </div>
  )
}
