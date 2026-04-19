import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { useSeoAudit, getCachedAudit } from './useSeoAudit'
import { useSeoAiGenerate } from './useSeoAiGenerate'
import type {
  SeoTabId, SeoPageRow, SeoStats, SeoCoverage,
  IntegrationValues, EditorForm, ConnectForm,
} from './seoTypes'

const PEST_SLUGS = [
  'spider-control','ant-control','roach-control','termite-control',
  'mosquito-control','flea-tick-control','wasp-hornet-control','bed-bug-control',
  'scorpion-control','rodent-control','pest-control','termite-inspections',
]
const STATIC_SLUGS = ['home','about','contact','quote','pricing','faq','reviews','service-area']

export function useSeoTab() {
  const { tenantId } = useTenant()
  const [activeTab, setActiveTab]       = useState<SeoTabId>('overview')
  const [pages, setPages]               = useState<SeoPageRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [integrations, setIntegrations] = useState<IntegrationValues>({ google_api_key: '', google_analytics_id: '', google_search_console_url: '' })
  const [openEditorSlug, setOpenEditorSlug] = useState<string | null>(null)
  const [editorSaving, setEditorSaving]     = useState(false)
  const [editorForm, setEditorForm]         = useState<EditorForm>({ meta_title: '', meta_description: '', focus_keyword: '', og_title: '', og_description: '' })
  const [connectForm, setConnectForm]       = useState<ConnectForm>({ google_search_console_url: '', google_analytics_id: '' })
  const [connectSaving, setConnectSaving]   = useState<string | null>(null)

  const audit = useSeoAudit(tenantId, integrations)

  useEffect(() => {
    if (!tenantId) return
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  async function loadAll() {
    setLoading(true)
    try {
      const [metaRes, pageRes, locRes, blogRes, intRes, auditRes] = await Promise.all([
        supabase.from('seo_meta').select('page_slug,meta_title,meta_description,focus_keyword,og_title,og_description,user_edited').eq('tenant_id', tenantId),
        supabase.from('page_content').select('page_slug').eq('tenant_id', tenantId),
        supabase.from('location_data').select('slug,city,is_live').eq('tenant_id', tenantId),
        supabase.from('blog_posts').select('slug,title,published_at').eq('tenant_id', tenantId),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'last_lighthouse_audit').maybeSingle(),
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metaMap: Record<string, any> = {}
      for (const row of metaRes.data || []) metaMap[row.page_slug] = row

      const makeRow = (slug: string, label: string, url: string, type: SeoPageRow['type'], isLive: boolean): SeoPageRow => {
        const m = metaMap[slug]
        return {
          slug, label, url, type, isLive,
          hasMeta: !!(m?.meta_title?.trim()),
          metaTitle: m?.meta_title || '', metaDescription: m?.meta_description || '',
          focusKeyword: m?.focus_keyword || '', ogTitle: m?.og_title || '',
          ogDescription: m?.og_description || '', userEdited: m?.user_edited || false,
        }
      }

      const built: SeoPageRow[] = []
      const seen = new Set<string>()
      for (const row of pageRes.data || []) {
        if (seen.has(row.page_slug)) continue
        seen.add(row.page_slug)
        const label = row.page_slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        const type = PEST_SLUGS.includes(row.page_slug) ? 'pest' as const : STATIC_SLUGS.includes(row.page_slug) ? 'static' as const : 'pest' as const
        built.push(makeRow(row.page_slug, label, row.page_slug === 'home' ? '/' : `/${row.page_slug}`, type, true))
      }
      for (const slug of STATIC_SLUGS) {
        if (!seen.has(slug)) {
          seen.add(slug)
          const label = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          built.push(makeRow(slug, label, slug === 'home' ? '/' : `/${slug}`, 'static', true))
        }
      }
      for (const row of locRes.data || [])  built.push(makeRow(row.slug, row.city, `/${row.slug}`, 'location', row.is_live))
      for (const row of blogRes.data || []) built.push(makeRow(row.slug, row.title, `/blog/${row.slug}`, 'blog', !!row.published_at))
      setPages(built)

      const intVal = intRes.data?.value || {}
      setIntegrations({ google_api_key: intVal.google_api_key || '', google_analytics_id: intVal.google_analytics_id || '', google_search_console_url: intVal.google_search_console_url || '' })
      setConnectForm({ google_search_console_url: intVal.google_search_console_url || '', google_analytics_id: intVal.google_analytics_id || '' })

      // Load from localStorage first (instant), then fall back to Supabase
      const cached = getCachedAudit(tenantId)
      const auditVal = auditRes.data?.value
      const resolved = cached || auditVal
      if (resolved) audit.setLastAudit({ ...resolved, webVitals: resolved.webVitals || { lcp: null, tbt: null, cls: null } })
    } finally {
      setLoading(false)
    }
  }

  const stats: SeoStats = {
    totalPages: pages.length,
    livePages: pages.filter(p => p.isLive).length,
    seoConfigured: pages.filter(p => p.hasMeta).length,
    issuesFound: pages.filter(p => p.isLive && !p.hasMeta).length,
  }
  const coverage: SeoCoverage = {
    pest:     { total: pages.filter(p => p.type === 'pest').length,     live: pages.filter(p => p.type === 'pest'     && p.isLive).length },
    location: { total: pages.filter(p => p.type === 'location').length, live: pages.filter(p => p.type === 'location' && p.isLive).length },
    blog:     { total: pages.filter(p => p.type === 'blog').length,     live: pages.filter(p => p.type === 'blog'     && p.isLive).length },
    static:   { total: pages.filter(p => p.type === 'static').length,   live: pages.filter(p => p.type === 'static'  && p.isLive).length },
  }

  const handleOpenEditor = (slug: string) => {
    const page = pages.find(p => p.slug === slug)
    if (page) setEditorForm({ meta_title: page.metaTitle, meta_description: page.metaDescription, focus_keyword: page.focusKeyword, og_title: page.ogTitle, og_description: page.ogDescription })
    setOpenEditorSlug(slug)
  }
  const handleEditorChange = (field: keyof EditorForm, value: string) => setEditorForm(prev => ({ ...prev, [field]: value }))
  const handleSaveMeta = async (slug: string) => {
    setEditorSaving(true)
    try {
      const { error } = await supabase.from('seo_meta').upsert(
        { tenant_id: tenantId, page_slug: slug, ...editorForm, user_edited: true },
        { onConflict: 'tenant_id,page_slug' }
      )
      if (error) { toast.error(`Failed to save SEO data: ${error.message}`); return }
      toast.success('SEO data saved!')
      setPages(prev => prev.map(p => p.slug === slug
        ? { ...p, hasMeta: editorForm.meta_title.trim().length > 0, metaTitle: editorForm.meta_title, metaDescription: editorForm.meta_description }
        : p))
      setOpenEditorSlug(null)
    } finally { setEditorSaving(false) }
  }

  const handleConnectChange = (field: keyof ConnectForm, value: string) => setConnectForm(prev => ({ ...prev, [field]: value }))
  const handleConnectSave = async (field: keyof ConnectForm) => {
    setConnectSaving(field)
    try {
      const { data: current } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      const { error } = await supabase.from('settings').upsert(
        { tenant_id: tenantId, key: 'integrations', value: { ...(current?.value || {}), [field]: connectForm[field] } },
        { onConflict: 'tenant_id,key' }
      )
      if (error) { toast.error(`Failed to save: ${error.message}`); return }
      toast.success('Saved!')
      setIntegrations(prev => ({ ...prev, [field]: connectForm[field] }))
    } finally { setConnectSaving(null) }
  }
  const handleCloseEditor = () => setOpenEditorSlug(null)
  const handleRunCheckNow = () => { setActiveTab('overview'); setTimeout(() => audit.runLighthouseAudit(), 150) }

  const { aiGenerating, aiGeneratedSlug, handleAiGenerate } = useSeoAiGenerate(
    tenantId,
    pages,
    (form: EditorForm) => setEditorForm(form),
  )

  return {
    activeTab, setActiveTab, pages, loading, integrations, stats, coverage,
    openEditorSlug, editorForm, editorSaving, connectForm, connectSaving,
    aiGenerating, aiGeneratedSlug,
    handleOpenEditor, handleCloseEditor, handleEditorChange, handleSaveMeta,
    handleAiGenerate, handleConnectChange, handleConnectSave, handleRunCheckNow,
    ...audit,
    handleRefreshScore: () => { audit.clearCacheAndRefresh(); setTimeout(() => audit.runLighthouseAudit(), 50) },
  }
}
