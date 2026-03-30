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

interface SeoForm {
  meta_title: string
  meta_description: string
  og_title: string
  og_description: string
  focus_keyword: string
}

const EMPTY: SeoForm = { meta_title: '', meta_description: '', og_title: '', og_description: '', focus_keyword: '' }

export default function SEOTab() {
  const { tenantId } = useTenant()
  const [selectedSlug, setSelectedSlug] = useState('home')
  const [form, setForm] = useState<SeoForm>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activePanel, setActivePanel] = useState<'editor' | 'keywords'>('editor')

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    supabase.from('seo_meta').select('meta_title, meta_description, og_title, og_description, focus_keyword')
      .eq('tenant_id', tenantId).eq('page_slug', selectedSlug).maybeSingle()
      .then(({ data }) => {
        setForm({
          meta_title: data?.meta_title || '',
          meta_description: data?.meta_description || '',
          og_title: data?.og_title || '',
          og_description: data?.og_description || '',
          focus_keyword: data?.focus_keyword || '',
        })
        setLoading(false)
      })
  }, [tenantId, selectedSlug])

  function update(field: keyof SeoForm, value: string) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    const { error } = await supabase.from('seo_meta').upsert({
      tenant_id: tenantId, page_slug: selectedSlug, ...form,
    }, { onConflict: 'tenant_id,page_slug' })
    setSaving(false)
    if (error) toast.error('Failed to save SEO data.'); else toast.success('SEO data saved!')
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  function charBadge(len: number, warn: number, err: number) {
    if (len > err) return 'text-red-600 font-medium'
    if (len > warn) return 'text-amber-600 font-medium'
    return 'text-gray-400'
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 mb-6">
        {(['editor', 'keywords'] as const).map(t => (
          <button key={t} onClick={() => setActivePanel(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activePanel === t ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'editor' ? 'Meta Editor' : '✨ AI Keyword Research'}
          </button>
        ))}
      </div>

      {activePanel === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Page list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pages</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {PAGE_SLUGS.map(slug => (
                  <button key={slug} onClick={() => setSelectedSlug(slug)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition ${selectedSlug === slug ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'}`}>
                    {slug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">SEO for: <span className="text-emerald-600">{selectedSlug}</span></h3>
              <p className="text-gray-500 text-sm mb-6">Optimize how this page appears in search results.</p>

              {loading ? <p className="text-gray-400">Loading...</p> : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">Meta Title</label>
                      <span className={`text-xs ${charBadge(form.meta_title.length, 60, 70)}`}>{form.meta_title.length}/70</span>
                    </div>
                    <input value={form.meta_title} onChange={e => update('meta_title', e.target.value)} placeholder="Page title for search engines" className={inputClass} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">Meta Description</label>
                      <span className={`text-xs ${charBadge(form.meta_description.length, 150, 160)}`}>{form.meta_description.length}/160</span>
                    </div>
                    <textarea value={form.meta_description} onChange={e => update('meta_description', e.target.value)} rows={3} placeholder="Brief description shown in search results" className={`${inputClass} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">OG Title <span className="text-gray-400 font-normal">(social share)</span></label>
                    <input value={form.og_title} onChange={e => update('og_title', e.target.value)} placeholder="Social share title (optional)" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">OG Description <span className="text-gray-400 font-normal">(social share)</span></label>
                    <textarea value={form.og_description} onChange={e => update('og_description', e.target.value)} rows={2} placeholder="Social share description (optional)" className={`${inputClass} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Focus Keyword</label>
                    <input value={form.focus_keyword} onChange={e => update('focus_keyword', e.target.value)} placeholder="e.g. spider control tyler tx" className={inputClass} />
                  </div>
                  <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save SEO Data'}
                  </button>
                </div>
              )}
            </div>

            {/* SERP Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Google Search Preview</h4>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-blue-700 text-lg hover:underline cursor-pointer truncate">
                  {form.meta_title || 'Page title'}
                </p>
                <p className="text-emerald-700 text-sm truncate">
                  {window.location.origin}/{selectedSlug === 'home' ? '' : selectedSlug}
                </p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {form.meta_description || 'No description set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'keywords' && <KeywordResearchPanel selectedPage={selectedSlug} focusKeyword={form.focus_keyword} />}
    </div>
  )
}

function KeywordResearchPanel({ selectedPage, focusKeyword }: { selectedPage: string; focusKeyword: string }) {
  const { tenantId } = useTenant()
  const [page, setPage] = useState(selectedPage)
  const [topic, setTopic] = useState(focusKeyword)
  const [keywords, setKeywords] = useState<{ keyword: string; intent: string; difficulty: string; priority: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  async function generate() {
    if (!topic.trim()) { toast.error('Enter a focus topic first.'); return }
    setLoading(true)
    setError('')
    setKeywords([])
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: `You are an SEO expert for a pest control company in East Texas.\nGenerate 10 keyword suggestions for the page: "${page}"\nFocus topic: "${topic}"\nBusiness: local pest control serving Tyler TX and surrounding East Texas cities.\n\nRespond ONLY with a JSON array, no markdown, no explanation:\n[\n  { "keyword": "spider control tyler tx", "intent": "transactional", "difficulty": "low", "priority": "high" },\n  ...\n]\n\nIntent options: transactional | informational | local\nDifficulty options: low | medium | high\nPriority options: high | medium | low` }],
        }),
      })
      const data = await response.json()
      const text = data.content?.map((i: { text?: string }) => i.text || '').join('') || ''
      const clean = text.replace(/```json|```/g, '').trim()
      setKeywords(JSON.parse(clean))
    } catch (err) {
      setError('Failed to generate keywords. Check your API key and try again.')
    }
    setLoading(false)
  }

  async function addToTracker(keyword: string) {
    if (!tenantId) return
    const { error } = await supabase.from('keyword_tracker').insert({ tenant_id: tenantId, keyword, page_slug: page })
    if (error) toast.error('Failed to add keyword.'); else toast.success(`"${keyword}" added to tracker!`)
  }

  const intentColor: Record<string, string> = { transactional: 'bg-emerald-100 text-emerald-700', informational: 'bg-blue-100 text-blue-700', local: 'bg-amber-100 text-amber-700' }
  const diffColor: Record<string, string> = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' }
  const prioColor: Record<string, string> = { high: 'bg-emerald-100 text-emerald-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600' }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">✨ AI Keyword Research</h3>

      {!apiKey && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm mb-4">
          Set VITE_ANTHROPIC_API_KEY in your environment to enable AI features.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Page</label>
          <select value={page} onChange={e => setPage(e.target.value)} className={`${inputClass} bg-white`}>
            {PAGE_SLUGS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Focus Topic</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. spider control" className={inputClass} />
        </div>
        <div className="flex items-end">
          <button onClick={generate} disabled={loading || !apiKey} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate Keywords'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      )}

      {keywords.length > 0 && (
        <div className="space-y-3">
          {keywords.map((kw, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
              <div>
                <p className="text-sm font-semibold text-gray-900">{kw.keyword}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${intentColor[kw.intent] || 'bg-gray-100 text-gray-600'}`}>{kw.intent}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${diffColor[kw.difficulty] || 'bg-gray-100 text-gray-600'}`}>{kw.difficulty}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioColor[kw.priority] || 'bg-gray-100 text-gray-600'}`}>{kw.priority}</span>
                </div>
              </div>
              <button onClick={() => addToTracker(kw.keyword)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium whitespace-nowrap">
                + Add to Tracker
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
