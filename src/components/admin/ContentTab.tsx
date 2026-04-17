import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { invalidatePageContent } from '../../hooks/usePageContent'
import PageHelpBanner from './PageHelpBanner'
import ContentPageForm from './ContentPageForm'
import FaqTab from './FaqTab'

const STANDARD_SLUGS = [
  'home', 'about',
  'pest-control', 'termite-control', 'termite-inspections',
  'spider-control', 'roach-control', 'ant-control', 'mosquito-control',
  'scorpion-control', 'bed-bug-control', 'flea-tick-control', 'rodent-control',
  'wasp-hornet-control',
  'faq',
]

const toSlug = (title: string) =>
  title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface ContentForm { title: string; subtitle: string; intro: string; video_url: string; image_url: string }
const EMPTY_FORM: ContentForm = { title: '', subtitle: '', intro: '', video_url: '', image_url: '' }

const PEST_SLUGS = ['spider-control', 'mosquito-control', 'ant-control', 'wasp-hornet-control', 'roach-control', 'flea-tick-control', 'rodent-control', 'scorpion-control', 'bed-bug-control', 'pest-control', 'termite-control', 'termite-inspections']

export default function ContentTab() {
  const { tenantId } = useTenant()
  const [selectedSlug, setSelectedSlug] = useState('home')
  const [form, setForm] = useState<ContentForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessCity, setBusinessCity] = useState('')
  const [reverting, setReverting] = useState(false)
  const [heroHeadline, setHeroHeadline] = useState('')
  const [customSlugs, setCustomSlugs] = useState<string[]>([])
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '' })
  const [creatingPage, setCreatingPage] = useState(false)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  // Load custom (non-standard) page slugs from DB
  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('page_content')
      .select('page_slug')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        if (!data) return
        const extras = data.map(r => r.page_slug).filter(s => !STANDARD_SLUGS.includes(s))
        setCustomSlugs(extras)
      })
  }, [tenantId])

  // Load business info + customization once
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
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle()
      .then(({ data }) => { if (data?.value?.hero_headline) setHeroHeadline(data.value.hero_headline) })
  }, [tenantId])

  // Load page content when slug changes
  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    async function run() {
      setLoading(true)
      const { data } = await supabase.from('page_content').select('title, subtitle, intro, video_url, image_url, hero_headline').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).maybeSingle()
      if (!cancelled) {
        setForm({ title: data?.title || '', subtitle: data?.subtitle || '', intro: data?.intro || '', video_url: data?.video_url || '', image_url: data?.image_url || '' })
        // For home page, initialize hero headline from page_content (preferred) or fall back to title
        if (selectedSlug === 'home') {
          const fromPage = (data as any)?.hero_headline?.trim() || data?.title?.trim() || ''
          if (fromPage) setHeroHeadline(fromPage)
        }
        setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [tenantId, selectedSlug])

  const updateField = (field: keyof ContentForm, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  async function createPage() {
    if (!tenantId) return
    const slug = newPageForm.slug || toSlug(newPageForm.title)
    if (!slug) { toast.error('Enter a page title'); return }
    if (STANDARD_SLUGS.includes(slug) || customSlugs.includes(slug)) {
      toast.error('A page with that slug already exists'); return
    }
    setCreatingPage(true)
    const { error } = await supabase.from('page_content').insert({
      tenant_id: tenantId,
      page_slug: slug,
      title: newPageForm.title,
      subtitle: '',
      intro: '',
    })
    if (error) { toast.error('Failed to create page'); setCreatingPage(false); return }
    setCustomSlugs(prev => [...prev, slug])
    setSelectedSlug(slug)
    setShowNewPage(false)
    setNewPageForm({ title: '', slug: '' })
    setCreatingPage(false)
    toast.success(`Page "/${slug}" created — add your content and save`)
  }
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
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: buildPrompt() }] }),
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
    const { data: existingSnap } = await supabase.from('page_snapshots').select('id').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).eq('snapshot_type', 'original').maybeSingle()
    if (!existingSnap) {
      const { data: current } = await supabase.from('page_content').select('title, subtitle, intro, video_url, image_url').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).maybeSingle()
      if (current) await supabase.from('page_snapshots').insert({ tenant_id: tenantId, page_slug: selectedSlug, snapshot_type: 'original', snapshot_data: current })
    }
    const pageRow: Record<string, unknown> = { tenant_id: tenantId, page_slug: selectedSlug, ...form }
    if (selectedSlug === 'home') pageRow.hero_headline = heroHeadline
    const { error } = await supabase.from('page_content').upsert(pageRow, { onConflict: 'tenant_id,page_slug' })
    if (selectedSlug === 'home') {
      // Also keep customization in sync for backwards compat with existing tenants
      const { data: custSnap } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle()
      const merged = { ...(custSnap?.value || {}), hero_headline: heroHeadline }
      await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'customization', value: merged }, { onConflict: 'tenant_id,key' })
    }
    setSaving(false)
    if (error) toast.error('Failed to save content.')
    else { invalidatePageContent(tenantId, selectedSlug); toast.success('Content saved!') }
  }

  async function handleRevert() {
    if (!tenantId || !confirm('Revert this page to its original content? Your current edits will be overwritten.')) return
    setReverting(true)
    const { data: snap } = await supabase.from('page_snapshots').select('snapshot_data').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).eq('snapshot_type', 'original').maybeSingle()
    if (!snap?.snapshot_data) { toast.error('No original snapshot found for this page.'); setReverting(false); return }
    const orig = snap.snapshot_data as ContentForm
    setForm({ title: orig.title || '', subtitle: orig.subtitle || '', intro: orig.intro || '', video_url: orig.video_url || '', image_url: orig.image_url || '' })
    const { error } = await supabase.from('page_content').upsert({ tenant_id: tenantId, page_slug: selectedSlug, ...orig }, { onConflict: 'tenant_id,page_slug' })
    setReverting(false)
    if (error) toast.error('Failed to revert.'); else toast.success('Reverted to original content!')
  }

  return (
    <div>
      <PageHelpBanner tab="content" title="📝 Content Editor" body="Pick a page from the left, then edit the Title, Subtitle, or Intro text. For pest pages, choose a photo from the auto-loaded image search. Hit Save — your website updates instantly." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pages</p>
              <button
                onClick={() => setShowNewPage(true)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                title="Add a new custom page"
              >
                <Plus size={13} /> New
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {STANDARD_SLUGS.map(slug => (
                <button key={slug} onClick={() => setSelectedSlug(slug)} className={`w-full text-left px-4 py-2.5 text-sm transition ${selectedSlug === slug ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'}`}>
                  {slug}
                </button>
              ))}
              {customSlugs.length > 0 && (
                <>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Custom Pages</p>
                  </div>
                  {customSlugs.map(slug => (
                    <button key={slug} onClick={() => setSelectedSlug(slug)} className={`w-full text-left px-4 py-2.5 text-sm transition ${selectedSlug === slug ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'}`}>
                      {slug}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {showNewPage && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">New Custom Page</h2>
                  <button onClick={() => setShowNewPage(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Commercial Services"
                      value={newPageForm.title}
                      onChange={e => setNewPageForm(f => ({ ...f, title: e.target.value, slug: toSlug(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-400">/</span>
                      <input
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="commercial-services"
                        value={newPageForm.slug}
                        onChange={e => setNewPageForm(f => ({ ...f, slug: toSlug(e.target.value) }))}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Auto-generated from title. Edit to customize.</p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setShowNewPage(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button
                    onClick={createPage}
                    disabled={creatingPage || !newPageForm.title.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                  >
                    {creatingPage ? 'Creating…' : 'Create Page'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          {selectedSlug === 'faq' ? (
            <FaqTab />
          ) : (
            <ContentPageForm
              selectedSlug={selectedSlug} form={form} loading={loading} saving={saving}
              aiLoading={aiLoading} reverting={reverting} isPestPage={isPestPage}
              apiKey={apiKey} heroHeadline={heroHeadline} onHeroHeadlineChange={setHeroHeadline}
              updateField={updateField} onSave={handleSave} onGenerateAI={generateAI} onRevert={handleRevert}
            />
          )}
        </div>
      </div>
    </div>
  )
}
