import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
import ContentPageForm from './ContentPageForm'
import FaqTab from './FaqTab'
import { PAGE_DEFAULTS } from '../../lib/pageDefaults'

const PAGE_SLUGS = [
  'home', 'about',
  'pest-control', 'termite-control', 'termite-inspections',
  'spider-control', 'roach-control', 'ant-control', 'mosquito-control',
  'scorpion-control', 'bed-bug-control', 'flea-tick-control', 'rodent-control',
  'wasp-hornet-control',
  'contact', 'faq', 'quote',
]

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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

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

  // Load page content when slug changes — fall back to PAGE_DEFAULTS if no DB row
  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    async function run() {
      setLoading(true)
      const { data } = await supabase.from('page_content').select('title, subtitle, intro, video_url, image_url').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).maybeSingle()
      if (!cancelled) {
        const defaults = PAGE_DEFAULTS[selectedSlug]
        setForm({
          title: data?.title || defaults?.title || '',
          subtitle: data?.subtitle || defaults?.subtitle || '',
          intro: data?.intro || defaults?.intro || '',
          video_url: data?.video_url || '',
          image_url: data?.image_url || defaults?.image_url || '',
        })
        setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [tenantId, selectedSlug])

  const updateField = (field: keyof ContentForm, value: string) => setForm(prev => ({ ...prev, [field]: value }))
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
    const { error } = await supabase.from('page_content').upsert({ tenant_id: tenantId, page_slug: selectedSlug, ...form }, { onConflict: 'tenant_id,page_slug' })
    if (selectedSlug === 'home') {
      const { data: custSnap } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle()
      const merged = { ...(custSnap?.value || {}), hero_headline: heroHeadline }
      await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'customization', value: merged }, { onConflict: 'tenant_id,key' })
    }
    setSaving(false)
    if (error) toast.error('Failed to save content.'); else toast.success('Content saved!')
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
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pages</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {PAGE_SLUGS.map(slug => (
                <button key={slug} onClick={() => setSelectedSlug(slug)} className={`w-full text-left px-4 py-2.5 text-sm transition ${selectedSlug === slug ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'}`}>
                  {slug}
                </button>
              ))}
            </div>
          </div>
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
