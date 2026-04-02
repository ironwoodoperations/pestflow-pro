import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
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
  const [activePanel, setActivePanel] = useState<'editor' | 'keywords' | 'sync' | 'pagespeed'>('editor')
  const [helpOpen, setHelpOpen] = useState(false)

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
      {/* Help Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <button onClick={() => setHelpOpen(!helpOpen)} className="flex items-center justify-between w-full text-left">
          <span className="text-sm font-semibold text-blue-900">🔍 SEO — How to use this</span>
          {helpOpen ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
        </button>
        {helpOpen && (
          <div className="mt-3 text-sm text-blue-800 space-y-2">
            <p>SEO means "Search Engine Optimization" — it's how Google decides which websites to show when people search.</p>
            <ul className="list-none space-y-1">
              <li><strong>META TITLE</strong> — The headline that shows up in Google search results. Keep it under 60 characters. Include your city and service. Example: "Spider Control Tyler TX | Ironclad Pest Solutions"</li>
              <li><strong>META DESCRIPTION</strong> — The 2-sentence summary under your title in Google. Keep it under 160 characters. Tell people what you do and where.</li>
              <li><strong>FOCUS KEYWORD</strong> — The main phrase you want to rank for on this page.</li>
            </ul>
            <p className="text-blue-700 italic">💡 The most important pages to fill in first: Home, Termite Control, Mosquito Control. These get the most search traffic.</p>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 mb-6">
        {([['editor', 'Meta Editor'], ['keywords', '✨ AI Keyword Research'], ['sync', 'Bulk Keyword Sync'], ['pagespeed', 'Page Speed']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActivePanel(key as 'editor' | 'keywords' | 'sync' | 'pagespeed')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activePanel === key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
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

      {activePanel === 'sync' && <BulkKeywordSyncPanel />}

      {activePanel === 'pagespeed' && <PageSpeedPanel />}
    </div>
  )
}

interface TrackedKeyword {
  keyword: string
  page_slug: string
}

interface GroupedPage {
  page_slug: string
  keywords: string[]
}

function BulkKeywordSyncPanel() {
  const { tenantId } = useTenant()
  const [state, setState] = useState<{
    groups: GroupedPage[]
    loading: boolean
    syncingSlug: string
    syncAllProgress: number
    syncAllTotal: number
  }>({ groups: [], loading: true, syncingSlug: '', syncAllProgress: 0, syncAllTotal: 0 })

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('keyword_tracker')
      .select('keyword, page_slug')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        const map = new Map<string, string[]>()
        for (const row of (data || []) as TrackedKeyword[]) {
          const existing = map.get(row.page_slug) || []
          existing.push(row.keyword)
          map.set(row.page_slug, existing)
        }
        const groups: GroupedPage[] = Array.from(map.entries()).map(([page_slug, keywords]) => ({ page_slug, keywords }))
        groups.sort((a, b) => a.page_slug.localeCompare(b.page_slug))
        setState(prev => ({ ...prev, groups, loading: false }))
      })
  }, [tenantId])

  async function syncPage(page_slug: string, keywords: string[]) {
    if (!tenantId) return
    setState(prev => ({ ...prev, syncingSlug: page_slug }))

    const { data: existing } = await supabase
      .from('seo_meta')
      .select('meta_title, meta_description')
      .eq('tenant_id', tenantId)
      .eq('page_slug', page_slug)
      .maybeSingle()

    const currentTitle = existing?.meta_title || ''
    const currentDesc = existing?.meta_description || ''
    const topKeyword = keywords[0]

    const newTitle = currentTitle && !currentTitle.toLowerCase().includes(topKeyword.toLowerCase())
      ? `${currentTitle} | ${topKeyword}`
      : currentTitle || topKeyword

    const existingDescWords = currentDesc.toLowerCase()
    const missingKeywords = keywords.filter(kw => !existingDescWords.includes(kw.toLowerCase()))
    const newDesc = missingKeywords.length > 0 && currentDesc
      ? `${currentDesc} Keywords: ${missingKeywords.join(', ')}.`
      : currentDesc || `${keywords.join(', ')} — professional pest control in East Texas.`

    const { error } = await supabase.from('seo_meta').upsert({
      tenant_id: tenantId,
      page_slug,
      meta_title: newTitle.slice(0, 70),
      meta_description: newDesc.slice(0, 300),
    }, { onConflict: 'tenant_id,page_slug' })

    setState(prev => ({ ...prev, syncingSlug: '' }))
    if (error) toast.error(`Failed to sync ${page_slug}`)
    else toast.success(`Keywords synced to ${page_slug}`)
  }

  async function syncAll() {
    const total = state.groups.length
    setState(prev => ({ ...prev, syncAllTotal: total, syncAllProgress: 0 }))
    for (let i = 0; i < state.groups.length; i++) {
      const g = state.groups[i]
      await syncPage(g.page_slug, g.keywords)
      setState(prev => ({ ...prev, syncAllProgress: i + 1 }))
    }
    setState(prev => ({ ...prev, syncAllTotal: 0, syncAllProgress: 0 }))
    toast.success('All pages synced!')
  }

  if (state.loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-400 text-sm">Loading tracked keywords...</p>
      </div>
    )
  }

  if (state.groups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center py-12">
        <p className="text-gray-500 mb-2">No tracked keywords found.</p>
        <p className="text-gray-400 text-sm">Use the AI Keyword Research tab to generate keywords and add them to the tracker first.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Bulk Keyword Sync</h3>
          <p className="text-gray-500 text-sm mt-1">Push tracked keywords into SEO meta fields for each page.</p>
        </div>
        <button
          onClick={syncAll}
          disabled={state.syncAllTotal > 0}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {state.syncAllTotal > 0
            ? `Syncing ${state.syncAllProgress}/${state.syncAllTotal}...`
            : 'Sync All Pages'}
        </button>
      </div>

      {state.syncAllTotal > 0 && (
        <div className="mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(state.syncAllProgress / state.syncAllTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Page</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Keywords</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {state.groups.map(g => (
              <tr key={g.page_slug} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{g.page_slug}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {g.keywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => syncPage(g.page_slug, g.keywords)}
                    disabled={state.syncingSlug === g.page_slug}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium disabled:opacity-50"
                  >
                    {state.syncingSlug === g.page_slug ? 'Syncing...' : 'Sync to Page'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function ScoreRing({ score, label }: { score: number | null; label: string }) {
  const color = score === null ? '#9ca3af'
    : score >= 90 ? '#10b981'
    : score >= 50 ? '#f59e0b'
    : '#ef4444'
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = score !== null ? (score / 100) * circ : 0

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>
          {score ?? '\u2013'}
        </text>
      </svg>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  )
}

interface AuditResult {
  scores: { performance: number; accessibility: number; best_practices: number; seo: number }
  opportunities: { title: string; savings: string }[]
  url: string
  run_at: string
}

function PageSpeedPanel() {
  const { tenantId } = useTenant()
  const [auditLoading, setAuditLoading] = useState(false)
  const [lastAudit, setLastAudit] = useState<AuditResult | null>(null)
  const [googleApiKey, setGoogleApiKey] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').single(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'last_lighthouse_audit').maybeSingle(),
    ]).then(([intRes, auditRes]) => {
      setGoogleApiKey(intRes.data?.value?.google_api_key || '')
      if (auditRes.data?.value) setLastAudit(auditRes.data.value as AuditResult)
      setLoading(false)
    })
  }, [tenantId])

  const siteUrl = 'https://pestflow-pro.vercel.app'

  const runLighthouseAudit = async () => {
    setAuditLoading(true)
    try {
      const res = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
        `?url=${encodeURIComponent(siteUrl)}&strategy=mobile&key=${googleApiKey}`
      )
      const ps = await res.json()
      const cats = ps.lighthouseResult?.categories
      const audits = ps.lighthouseResult?.audits

      const scores = {
        performance:    Math.round((cats?.performance?.score    || 0) * 100),
        accessibility:  Math.round((cats?.accessibility?.score  || 0) * 100),
        best_practices: Math.round((cats?.['best-practices']?.score || 0) * 100),
        seo:            Math.round((cats?.seo?.score            || 0) * 100),
      }

      const opportunities = Object.values(audits || {})
        .filter((a: any) => a.details?.type === 'opportunity' && a.score < 0.9)
        .slice(0, 3)
        .map((a: any) => ({
          title: a.title,
          savings: a.details?.overallSavingsMs
            ? `save ${Math.round(a.details.overallSavingsMs)}ms`
            : a.displayValue || ''
        }))

      const auditResult: AuditResult = { scores, opportunities, url: siteUrl, run_at: new Date().toISOString() }
      setLastAudit(auditResult)

      await supabase
        .from('settings')
        .upsert(
          { tenant_id: tenantId, key: 'last_lighthouse_audit', value: auditResult },
          { onConflict: 'tenant_id,key' }
        )

      toast.success('Lighthouse audit complete!')
    } catch {
      toast.error('Audit failed \u2014 check your Google API key')
    } finally {
      setAuditLoading(false)
    }
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  if (!googleApiKey) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-lg font-semibold text-gray-700 mb-2">Page Speed Audit</p>
        <p className="text-sm text-gray-500 mb-4">Add a Google API key in Settings &rarr; Integrations to enable Lighthouse scores.</p>
        <p className="text-sm text-emerald-600 font-medium cursor-pointer hover:underline" onClick={() => {
          const settingsBtn = document.querySelector('button[aria-current="page"]')?.parentElement?.querySelector('button:nth-child(10)') as HTMLButtonElement | null
          settingsBtn?.click()
        }}>Go to Settings &rarr;</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Page Speed Audit</h3>
          <p className="text-sm text-gray-500 mt-1">Run a Lighthouse audit against your live site.</p>
          {lastAudit && (
            <p className="text-xs text-gray-400 mt-1">
              Last run: {new Date(lastAudit.run_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(lastAudit.run_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={runLighthouseAudit}
          disabled={auditLoading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {auditLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Running audit...
            </>
          ) : (
            'Run Audit'
          )}
        </button>
      </div>

      {auditLoading && (
        <div className="text-center py-8">
          <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Running audit... this takes 10\u201315 seconds</p>
        </div>
      )}

      {lastAudit && !auditLoading && (
        <>
          <div className="flex justify-center gap-8 mb-6">
            <ScoreRing score={lastAudit.scores.performance} label="Performance" />
            <ScoreRing score={lastAudit.scores.accessibility} label="Accessibility" />
            <ScoreRing score={lastAudit.scores.best_practices} label="Best Practices" />
            <ScoreRing score={lastAudit.scores.seo} label="SEO" />
          </div>

          {lastAudit.opportunities.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Opportunities</h4>
              <div className="space-y-2">
                {lastAudit.opportunities.map((opp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{opp.title}</span>
                    {opp.savings && <span className="text-xs text-amber-600 font-medium">{opp.savings}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!lastAudit && !auditLoading && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No audit results yet. Click "Run Audit" to get started.</p>
        </div>
      )}
    </div>
  )
}
