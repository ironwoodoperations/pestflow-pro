import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

const PAGE_SLUGS = [
  'home', 'spider-control', 'mosquito-control', 'ant-control', 'wasp-hornet-control',
  'roach-control', 'flea-tick-control', 'rodent-control', 'scorpion-control', 'bed-bug-control',
  'pest-control', 'termite-control', 'termite-inspections', 'about', 'faq', 'contact',
  'quote', 'reviews', 'service-area', 'blog',
]

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function SeoKeywordsTab() {
  const { tenantId } = useTenant()
  const [page, setPage] = useState('home')
  const [topic, setTopic] = useState('')
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
    } catch {
      setError('Failed to generate keywords. Check your API key and try again.')
    }
    setLoading(false)
  }

  async function addToTracker(keyword: string) {
    if (!tenantId) return
    const { error } = await supabase.from('keyword_tracker').insert({ tenant_id: tenantId, keyword, page_slug: page })
    if (error) toast.error(`Failed to add keyword: ${error.message}`); else toast.success(`"${keyword}" added to tracker!`)
  }

  const intentColor: Record<string, string> = { transactional: 'bg-emerald-100 text-emerald-700', informational: 'bg-blue-100 text-blue-700', local: 'bg-amber-100 text-amber-700' }
  const diffColor: Record<string, string> = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' }
  const prioColor: Record<string, string> = { high: 'bg-emerald-100 text-emerald-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600' }

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
