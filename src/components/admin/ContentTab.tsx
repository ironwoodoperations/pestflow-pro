import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Sparkles, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [aiLoading, setAiLoading] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessCity, setBusinessCity] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [reverting, setReverting] = useState(false)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => {
        if (data?.value?.name) setBusinessName(data.value.name)
        if (data?.value?.address) {
          const match = data.value.address.match(/,\s*([^,]+),?\s*[A-Z]{2}/)
          if (match) setBusinessCity(match[1].trim())
        }
      })
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    supabase.from('page_content').select('title, subtitle, intro, video_url').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).maybeSingle()
      .then(({ data }) => {
        setForm({ title: data?.title || '', subtitle: data?.subtitle || '', intro: data?.intro || '', video_url: data?.video_url || '' })
        setLoading(false)
      })
  }, [tenantId, selectedSlug])

  function updateField(field: keyof ContentForm, value: string) { setForm((prev) => ({ ...prev, [field]: value })) }

  const PEST_SLUGS = ['spider-control', 'mosquito-control', 'ant-control', 'wasp-hornet-control', 'roach-control', 'flea-tick-control', 'rodent-control', 'scorpion-control', 'bed-bug-control', 'pest-control', 'termite-control', 'termite-inspections']
  const isPestPage = PEST_SLUGS.includes(selectedSlug)

  function buildPrompt(): string {
    const biz = businessName || 'a professional pest control company'
    const city = businessCity || 'Tyler'
    if (isPestPage) {
      const pest = selectedSlug.replace(/-/g, ' ').replace(/\bcontrol\b/, '').trim()
      return `You are a marketing copywriter for ${biz}, a pest control company based in ${city}, TX serving East Texas.\n\nWrite SEO-optimized copy for the "${pest} control" service page.\n\nRequirements:\n- Title: Include the pest name + location (60 chars max)\n- Subtitle: Urgency-driven, mention local area (100 chars max)\n- Intro: 2-3 paragraphs (300-400 words) covering:\n  • Signs of ${pest} infestation in East Texas homes\n  • ${biz}'s treatment approach (EPA-approved, family-safe)\n  • Why local expertise matters for ${pest} in this climate\n  • Call-to-action: free inspection, satisfaction guarantee\n  • Mention specific cities: ${city}, Longview, Jacksonville\n\nRespond ONLY with a JSON object, no markdown:\n{"title": "...", "subtitle": "...", "intro": "..."}`
    }
    return `You are a copywriter for ${biz}, a pest control company in ${city}, TX (East Texas).\nWrite marketing copy for the "${selectedSlug}" page.\n\nRespond ONLY with a JSON object, no markdown, no explanation:\n{\n  "title": "Page title (60 chars max)",\n  "subtitle": "Compelling subtitle (100 chars max)",\n  "intro": "2-3 paragraph intro (300-400 words). Mention East Texas, local expertise, EPA-approved treatments, satisfaction guarantee. Reference ${city} and surrounding cities. Be specific, not generic."\n}\n\nPage: ${selectedSlug}\nBusiness: ${biz} — professional pest control serving East Texas.`
  }

  async function generateAI() {
    setAiLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 1000,
          messages: [{ role: 'user', content: buildPrompt() }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map((i: { text?: string }) => i.text || '').join('') || ''
      const clean = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      const generated = JSON.parse(clean)
      setForm(prev => ({ ...prev, title: generated.title || prev.title, subtitle: generated.subtitle || prev.subtitle, intro: generated.intro || prev.intro }))
      toast.success('AI content generated — review and save when ready')
    } catch { toast.error('AI generation failed — check your API key') }
    setAiLoading(false)
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    // Save original snapshot before first edit (if none exists)
    const { data: existingSnap } = await supabase.from('page_snapshots')
      .select('id').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).eq('snapshot_type', 'original').maybeSingle()
    if (!existingSnap) {
      const { data: current } = await supabase.from('page_content')
        .select('title, subtitle, intro, video_url').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).maybeSingle()
      if (current) {
        await supabase.from('page_snapshots').insert({
          tenant_id: tenantId, page_slug: selectedSlug, snapshot_type: 'original',
          snapshot_data: { title: current.title, subtitle: current.subtitle, intro: current.intro, video_url: current.video_url },
        })
      }
    }
    const { error } = await supabase.from('page_content').upsert({
      tenant_id: tenantId, page_slug: selectedSlug, title: form.title, subtitle: form.subtitle, intro: form.intro, video_url: form.video_url,
    }, { onConflict: 'tenant_id,page_slug' })
    setSaving(false)
    if (error) toast.error('Failed to save content.'); else toast.success('Content saved!')
  }

  async function handleRevert() {
    if (!tenantId) return
    if (!confirm('Revert this page to its original content? Your current edits will be overwritten.')) return
    setReverting(true)
    const { data: snap } = await supabase.from('page_snapshots')
      .select('snapshot_data').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).eq('snapshot_type', 'original').maybeSingle()
    if (!snap?.snapshot_data) { toast.error('No original snapshot found for this page.'); setReverting(false); return }
    const orig = snap.snapshot_data as ContentForm
    setForm({ title: orig.title || '', subtitle: orig.subtitle || '', intro: orig.intro || '', video_url: orig.video_url || '' })
    const { error } = await supabase.from('page_content').upsert({
      tenant_id: tenantId, page_slug: selectedSlug, title: orig.title || '', subtitle: orig.subtitle || '', intro: orig.intro || '', video_url: orig.video_url || '',
    }, { onConflict: 'tenant_id,page_slug' })
    setReverting(false)
    if (error) toast.error('Failed to revert.'); else toast.success('Reverted to original content!')
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  return (
    <div>
      {/* Help Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <button onClick={() => setHelpOpen(!helpOpen)} className="flex items-center justify-between w-full text-left">
          <span className="text-sm font-semibold text-blue-900">📝 Content Editor — How to use this</span>
          {helpOpen ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
        </button>
        {helpOpen && (
          <div className="mt-3 text-sm text-blue-800 space-y-2">
            <p>This is where you change the words on your website pages.</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>PICK A PAGE</strong> from the list on the left (like Home or Spider Control)</li>
              <li><strong>EDIT</strong> the Title, Subtitle, or Intro text on the right</li>
              <li><strong>HIT SAVE</strong> — your website updates instantly</li>
              <li><strong>MADE A MISTAKE?</strong> Hit Revert to Original to go back to what we set up</li>
            </ol>
            <p className="text-blue-700 italic">💡 The Title is the big headline. The Subtitle is the tagline under it. The Intro is the paragraph that explains the page.</p>
          </div>
        )}
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Page list sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pages</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {PAGE_SLUGS.map((slug) => (
              <button
                key={slug}
                onClick={() => setSelectedSlug(slug)}
                className={`w-full text-left px-4 py-2.5 text-sm transition ${
                  selectedSlug === slug
                    ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Editing: <span className="text-emerald-600">{selectedSlug}</span></h3>
          <p className="text-gray-500 text-sm mb-6">Content changes will appear on the public page immediately after save.</p>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Title</label>
                <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Page title" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} placeholder="Subtitle or tagline" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro / Body</label>
                <textarea value={form.intro} onChange={(e) => updateField('intro', e.target.value)} rows={6} placeholder="Main content or intro text" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL</label>
                <input type="text" value={form.video_url} onChange={(e) => updateField('video_url', e.target.value)} placeholder="https://youtube.com/..." className={inputClass} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Content'}
                </button>
                <button onClick={generateAI} disabled={aiLoading || !apiKey} title={!apiKey ? 'Set VITE_ANTHROPIC_API_KEY to enable' : isPestPage ? 'Generate SEO-optimized pest service copy' : 'Generate page copy with AI'} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
                  <Sparkles size={14} /> {aiLoading ? 'Generating...' : isPestPage ? 'AI Write (Pest SEO)' : 'AI Write'}
                </button>
                <button onClick={handleRevert} disabled={reverting} className="flex items-center gap-1.5 border border-gray-300 text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
                  <RotateCcw size={14} /> {reverting ? 'Reverting...' : 'Revert to Original'}
                </button>
              </div>
              {aiLoading && <p className="text-xs text-gray-400 mt-2">AI-generated content. Review before saving.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
