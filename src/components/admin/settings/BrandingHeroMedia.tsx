import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

type MediaType = 'image' | 'youtube' | 'upload'

interface HeroMedia { type: MediaType; url: string }

function extractYouTubeId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : ''
}

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function BrandingHeroMedia() {
  const { tenantId } = useTenant()
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [confirmRemove, setConfirm] = useState(false)
  const [mode, setMode]             = useState<'image' | 'video'>('image')
  const [videoSub, setVideoSub]     = useState<'youtube' | 'upload'>('youtube')
  const [media, setMedia]           = useState<HeroMedia>({ type: 'image', url: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle()
      .then(({ data }) => {
        const v = data?.value
        if (v?.mode === 'image') {
          setMedia({ type: 'image', url: v.image_url || v.url || v.thumbnail_url || '' })
          setMode('image')
        } else if (v?.mode === 'video') {
          const isYt = !!v.youtube_id
          setMedia({ type: isYt ? 'youtube' : 'upload', url: isYt ? `https://www.youtube.com/watch?v=${v.youtube_id}` : (v.video_url || v.url || '') })
          setMode('video'); setVideoSub(isYt ? 'youtube' : 'upload')
        } else if (v?.type) {
          // Previous save format: { type, url, thumbnail_url, youtube_id }
          setMedia({ type: v.type, url: v.url || v.thumbnail_url || '' })
          if (v.type === 'image') setMode('image')
          else { setMode('video'); setVideoSub(v.type as 'youtube' | 'upload') }
        } else if (v?.thumbnail_url) {
          // Legacy seed format: { thumbnail_url, youtube_id }
          setMedia({ type: 'image', url: v.thumbnail_url })
          setMode('image')
        } else if (v?.youtube_id) {
          setMedia({ type: 'youtube', url: `https://www.youtube.com/watch?v=${v.youtube_id}` })
          setMode('video'); setVideoSub('youtube')
        }
        setLoading(false)
      })
  }, [tenantId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean) {
    if (!tenantId || !e.target.files?.length) return
    const file = e.target.files[0]
    const ext  = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const path = `${tenantId}/${isVideo ? 'hero-video' : 'hero'}.${ext}`
    setUploading(true)
    const { error } = await supabase.storage.from('tenant-assets').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('tenant-assets').getPublicUrl(path)
    setMedia({ type: isVideo ? 'upload' : 'image', url: data.publicUrl })
    setUploading(false)
    toast.success('File uploaded — save to apply.')
  }

  async function handleSave() {
    if (!tenantId) return
    // Save mode+image_url (canonical) + thumbnail_url+youtube_id (shell compat)
    const ytId = videoSub === 'youtube' ? extractYouTubeId(media.url) : ''
    const value: Record<string, string> = mode === 'image'
      ? { mode: 'image', image_url: media.url, video_url: '', type: 'image', url: media.url, thumbnail_url: media.url, youtube_id: '' }
      : videoSub === 'youtube'
        ? { mode: 'video', image_url: '', video_url: media.url, type: 'youtube', url: media.url, youtube_id: ytId, thumbnail_url: '' }
        : { mode: 'video', image_url: '', video_url: media.url, type: 'upload', url: media.url, thumbnail_url: '', youtube_id: '' }
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'hero_media', value }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save.'); else toast.success('Hero media saved!')
  }

  function handleRemove() {
    setMedia({ type: mode === 'image' ? 'image' : videoSub, url: '' })
    setConfirm(false)
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
      <h3 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">Hero Media</h3>

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

      <button onClick={handleSave} disabled={saving}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Hero Media'}
      </button>
    </div>
  )
}
