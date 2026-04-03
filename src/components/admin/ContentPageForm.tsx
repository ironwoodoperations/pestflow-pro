import { Sparkles, RotateCcw } from 'lucide-react'

interface ContentForm { title: string; subtitle: string; intro: string; video_url: string }

interface Props {
  selectedSlug: string
  form: ContentForm
  loading: boolean; saving: boolean; aiLoading: boolean; reverting: boolean
  isPestPage: boolean; apiKey: string
  updateField: (field: keyof ContentForm, value: string) => void
  onSave: () => void
  onGenerateAI: () => void
  onRevert: () => void
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function ContentPageForm({ selectedSlug, form, loading, saving, aiLoading, reverting, isPestPage, apiKey, updateField, onSave, onGenerateAI, onRevert }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Editing: <span className="text-emerald-600">{selectedSlug}</span></h3>
      <p className="text-gray-500 text-sm mb-6">Content changes will appear on the public page immediately after save.</p>
      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Title</label>
            <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Page title" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
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
          <div className="flex items-center gap-3">
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
