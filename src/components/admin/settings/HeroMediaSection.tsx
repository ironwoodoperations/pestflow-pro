import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function HeroMediaSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ youtube_id: '', thumbnail_url: '', hero_image_url: '' })

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setForm(prev => ({ ...prev, youtube_id: data.value.youtube_id || '', thumbnail_url: data.value.thumbnail_url || '', hero_image_url: data.value.hero_image_url || '' }))
        setLoading(false)
      })
  }, [tenantId])

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'hero_media', value: form }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) toast.error('Failed to save.'); else toast.success('Hero media saved!')
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Hero Media</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">YouTube Video ID</label>
            <input value={form.youtube_id} onChange={e => setForm(p => ({ ...p, youtube_id: e.target.value }))} placeholder="dQw4w9WgXcQ" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">The ID from youtu.be/XXXXXX or ?v=XXXXXX</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Video Thumbnail URL</label>
            <input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">URL of the thumbnail shown before video plays</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Image URL</label>
            <input value={form.hero_image_url} onChange={e => setForm(p => ({ ...p, hero_image_url: e.target.value }))} placeholder="https://example.com/hero.jpg" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">Fallback image if no video set</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Hero Media'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Preview</h4>
        {form.youtube_id ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe src={`https://www.youtube.com/embed/${form.youtube_id}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video preview" />
          </div>
        ) : form.thumbnail_url ? (
          <img src={form.thumbnail_url} alt="Thumbnail preview" className="w-full aspect-video object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-400 text-sm">No media configured</p>
          </div>
        )}
      </div>
    </div>
  )
}
