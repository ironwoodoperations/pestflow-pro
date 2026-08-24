import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { invalidatePageContent } from '../../hooks/usePageContent'
import { triggerRevalidate } from '../../lib/revalidate'
import PageHelpBanner from './PageHelpBanner'
import ContentPageForm from './ContentPageForm'
import FaqTab from './FaqTab'
import { callAi } from '../../lib/ai/callAi'
import { buildContentPrompt } from './contentPrompt'
import { useAdminPreset } from '../../hooks/useAdminPreset'
import { partitionPageSlugs, isServicePageSlug } from '../../lib/adminVerticalPreset'


const toSlug = (title: string) =>
  title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface ContentForm { title: string; subtitle: string; intro: string; video_url: string; image_url: string; pageHeroImageUrl: string; image1Url: string; image2Url: string; image3Url: string }
const EMPTY_FORM: ContentForm = { title: '', subtitle: '', intro: '', video_url: '', image_url: '', pageHeroImageUrl: '', image1Url: '', image2Url: '', image3Url: '' }


export default function ContentTab() {
  const { id: tenantId } = useTenant()
  // S285 — the page-slug lists now come from the tenant's vertical. Two of the
  // four hardcoded pest slug arrays in the admin lived here and are gone.
  const { preset, vertical } = useAdminPreset()
  const [selectedSlug, setSelectedSlug] = useState('home')
  const [form, setForm] = useState<ContentForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessCity, setBusinessCity] = useState('')
  const [reverting, setReverting] = useState(false)
  const [heroHeadline, setHeroHeadline] = useState('')
  // Every page_slug in page_content, exactly as stored. NOT pre-filtered — see
  // the effect below.
  const [allSlugs, setAllSlugs] = useState<string[]>([])
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '' })
  const [creatingPage, setCreatingPage] = useState(false)
  const [applyHeroToAllPages, setApplyHeroToAllPages] = useState(false)

  // Load every page slug this tenant has. Stores the RAW list and derives the
  // custom ones below, rather than filtering here.
  //
  // Filtering inside the effect was a race. The effect's deps are [tenantId],
  // but the filter read standardSlugs, which changes when useAdminPreset
  // resolves the vertical. Those two queries race, and when page_content won,
  // standardSlugs was still NEUTRAL — servicePageSlugs: [] — so every service
  // page was classified custom and the effect never re-ran to correct it. Once
  // the vertical landed, each service page rendered TWICE in the sidebar: once
  // as a standard page, once under "Custom Pages".
  //
  // Deriving fixes it without adding standardSlugs to the deps, which would
  // re-issue the query on every vertical resolution for no new data.
  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('page_content')
      .select('page_slug')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        if (!data) return
        setAllSlugs(data.map(r => r.page_slug))
      })
  }, [tenantId])

  // Derived on every render, so both groups are always consistent with whatever
  // the vertical is RIGHT NOW. No slug can appear in both at any point in the
  // resolution — asserted in adminVerticalPreset.test.ts.
  const { standard: standardSlugs, custom: customSlugs } = partitionPageSlugs(vertical, allSlugs)

  // Load business info + customization + hero flag once
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
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle()
      .then(({ data }) => { setApplyHeroToAllPages((data?.value as { apply_hero_to_all_pages?: boolean } | null)?.apply_hero_to_all_pages ?? false) })
  }, [tenantId])

  // Load page content when slug changes
  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    async function run() {
      setLoading(true)
      const { data } = await supabase.from('page_content').select('title, subtitle, intro, video_url, image_url, hero_headline, page_hero_image_url, image_1_url, image_2_url, image_3_url').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).maybeSingle()
      if (!cancelled) {
        const d = data as Record<string, string | null> | null
        setForm({ title: d?.title || '', subtitle: d?.subtitle || '', intro: d?.intro || '', video_url: d?.video_url || '', image_url: d?.image_url || '', pageHeroImageUrl: d?.page_hero_image_url || '', image1Url: d?.image_1_url || '', image2Url: d?.image_2_url || '', image3Url: d?.image_3_url || '' })
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
    if (standardSlugs.includes(slug) || customSlugs.includes(slug)) {
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
    if (error) { toast.error(`Failed to create page: ${error.message}`); setCreatingPage(false); return }
    setAllSlugs(prev => [...prev, slug])
    setSelectedSlug(slug)
    setShowNewPage(false)
    setNewPageForm({ title: '', slug: '' })
    setCreatingPage(false)
    toast.success(`Page "/${slug}" created — add your content and save`)
  }
  // S285 — this used to be a pest-slug membership test, so it was FALSE for
  // every page of every non-pest tenant. It gates more than a label: it chooses
  // which brief buildContentPrompt() builds, so the longer service-page brief
  // was unreachable for all five of pls's service pages, which silently took
  // the generic branch. Keying on the vertical's own slugs fixes both.
  const isServicePage = isServicePageSlug(vertical, selectedSlug)

  const prompt = () => buildContentPrompt({ slug: selectedSlug, businessName, businessCity, isServicePage })

  async function generateAI() {
    setAiLoading(true)
    try {
      const data = await callAi('content_page', {
        tenant_id: tenantId,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt() }],
      })
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
    const pageRow: Record<string, unknown> = {
      tenant_id: tenantId, page_slug: selectedSlug,
      title: form.title, subtitle: form.subtitle, intro: form.intro, video_url: form.video_url,
      page_hero_image_url: form.pageHeroImageUrl || null,
      image_1_url: form.image1Url || null,
      image_2_url: form.image2Url || null,
      image_3_url: form.image3Url || null,
      image_url: form.pageHeroImageUrl || form.image_url || '', // S163 T5a: JSONB array writer removed; image_url kept for Dang shell compat (T5b)
    }
    if (selectedSlug === 'home') pageRow.hero_headline = heroHeadline
    console.log('[ContentSave] upserting page_content:', pageRow)
    const { error } = await supabase.from('page_content').upsert(pageRow, { onConflict: 'tenant_id,page_slug' })
    if (selectedSlug === 'home') {
      // Also keep customization in sync for backwards compat with existing tenants
      const { data: custSnap } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle()
      const merged = { ...(custSnap?.value || {}), hero_headline: heroHeadline }
      await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'customization', value: merged }, { onConflict: 'tenant_id,key' })
    }
    setSaving(false)
    if (error) { console.error('Save failed:', error); toast.error(`Save failed: ${error.message}`) }
    else {
      invalidatePageContent(tenantId, selectedSlug)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (accessToken) {
        const ok = await triggerRevalidate({ type: 'page', tenantId, slug: selectedSlug }, accessToken)
        if (ok) {
          toast.success('Content saved!')
        } else {
          toast.success('Saved to DB — site refresh may take up to 60 min', { description: 'Cache refresh failed. Content was saved but the public page may show stale copy until the cache expires.' })
        }
      } else {
        toast.success('Content saved!')
      }
    }
  }

  async function handleRevert() {
    if (!tenantId || !confirm('Revert this page to its original content? Your current edits will be overwritten.')) return
    setReverting(true)
    const { data: snap } = await supabase.from('page_snapshots').select('snapshot_data').eq('tenant_id', tenantId).eq('page_slug', selectedSlug).eq('snapshot_type', 'original').maybeSingle()
    if (!snap?.snapshot_data) { toast.error('No original snapshot found for this page.'); setReverting(false); return }
    const orig = snap.snapshot_data as ContentForm
    setForm({ title: orig.title || '', subtitle: orig.subtitle || '', intro: orig.intro || '', video_url: orig.video_url || '', image_url: orig.image_url || '', pageHeroImageUrl: '', image1Url: '', image2Url: '', image3Url: '' })
    const { error } = await supabase.from('page_content').upsert({ tenant_id: tenantId, page_slug: selectedSlug, ...orig }, { onConflict: 'tenant_id,page_slug' })
    setReverting(false)
    if (error) toast.error('Failed to revert.'); else toast.success('Reverted to original content!')
  }

  return (
    <div>
      <PageHelpBanner tab="content" title="📝 Content Editor" body={`Pick a page from the left, then edit the Title, Subtitle, or Intro text. ${preset.placeholders.contentPhotoHint} Hit Save — your website updates instantly.`} />
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
              {standardSlugs.map(slug => (
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
              aiLoading={aiLoading} reverting={reverting} isServicePage={isServicePage} serviceLabel={preset.entityLabels.service}
              heroHeadline={heroHeadline} onHeroHeadlineChange={setHeroHeadline}
              applyHeroToAllPages={applyHeroToAllPages}
              updateField={updateField} onSave={handleSave} onGenerateAI={generateAI} onRevert={handleRevert}
              onImageUpdate={(field, url) => updateField(field, url)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
