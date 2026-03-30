import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

const PAGE_SLUGS = [
  'home', 'spider-control', 'mosquito-control', 'ant-control', 'wasp-hornet-control',
  'roach-control', 'flea-tick-control', 'rodent-control', 'scorpion-control', 'bed-bug-control',
  'pest-control', 'termite-control', 'termite-inspections', 'about', 'faq', 'contact',
  'quote', 'reviews', 'service-area', 'blog',
]

interface ContentForm {
  title: string
  subtitle: string
  intro: string
  video_url: string
}

const EMPTY_FORM: ContentForm = { title: '', subtitle: '', intro: '', video_url: '' }

export default function ContentTab() {
  const { tenantId } = useTenant()
  const [selectedSlug, setSelectedSlug] = useState('home')
  const [form, setForm] = useState<ContentForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    supabase
      .from('page_content')
      .select('title, subtitle, intro, video_url')
      .eq('tenant_id', tenantId)
      .eq('page_slug', selectedSlug)
      .maybeSingle()
      .then(({ data }) => {
        setForm({
          title: data?.title || '',
          subtitle: data?.subtitle || '',
          intro: data?.intro || '',
          video_url: data?.video_url || '',
        })
        setLoading(false)
      })
  }, [tenantId, selectedSlug])

  function updateField(field: keyof ContentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase
      .from('page_content')
      .upsert({
        tenant_id: tenantId,
        page_slug: selectedSlug,
        title: form.title,
        subtitle: form.subtitle,
        intro: form.intro,
        video_url: form.video_url,
      }, { onConflict: 'tenant_id,page_slug' })

    setSaving(false)
    if (error) {
      toast.error('Failed to save content.')
    } else {
      toast.success('Content saved!')
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600'

  return (
    <div className="text-gray-300">
      <h2 className="text-xl font-semibold text-white mb-4">Content Management</h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page list sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--admin-card-bg)] rounded-xl border border-[var(--admin-sidebar-border)] overflow-hidden">
            <div className="p-3 border-b border-[var(--admin-sidebar-border)]">
              <p className="text-xs font-semibold text-gray-400 uppercase">Pages</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {PAGE_SLUGS.map((slug) => (
                <button
                  key={slug}
                  onClick={() => setSelectedSlug(slug)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition ${
                    selectedSlug === slug
                      ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {slug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-3">
          <div className="bg-[var(--admin-card-bg)] rounded-xl p-6 border border-[var(--admin-sidebar-border)]">
            <h3 className="text-lg font-semibold text-white mb-1">Editing: <span className="text-emerald-400">{selectedSlug}</span></h3>
            <p className="text-gray-500 text-sm mb-6">Content changes will appear on the public page immediately after save.</p>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Page Title</label>
                  <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Page title" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Subtitle</label>
                  <input type="text" value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} placeholder="Subtitle or tagline" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Intro / Body</label>
                  <textarea value={form.intro} onChange={(e) => updateField('intro', e.target.value)} rows={6} placeholder="Main content or intro text" className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Video URL</label>
                  <input type="text" value={form.video_url} onChange={(e) => updateField('video_url', e.target.value)} placeholder="https://youtube.com/..." className={inputClass} />
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Content'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
