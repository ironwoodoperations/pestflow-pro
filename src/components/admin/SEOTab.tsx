import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { FeatureGate } from './FeatureGate'
import PageHelpBanner from './PageHelpBanner'
import SeoOverviewTab from './seo/SeoOverviewTab'
import SeoPagesTab from './seo/SeoPagesTab'
import SeoKeywordsTab from './seo/SeoKeywordsTab'
import SeoAioTab from './seo/SeoAioTab'
import SeoConnectTab from './seo/SeoConnectTab'
import type {
  SeoTabId, SeoPageRow, AuditResult, SeoStats, SeoCoverage,
  IntegrationValues, EditorForm, ConnectForm
} from './seo/seoTypes'

const PEST_SLUGS = [
  'spider-control','ant-control','roach-control','termite-control',
  'mosquito-control','flea-tick-control','wasp-hornet-control','bed-bug-control',
  'scorpion-control','rodent-control','pest-control','termite-inspections',
]
const STATIC_SLUGS = ['home','about','contact','quote','pricing','faq','reviews','service-area']

const TABS: { id: SeoTabId; label: string }[] = [
  { id: 'overview',  label: '📊 Overview'   },
  { id: 'pages',     label: '📄 Pages'      },
  { id: 'keywords',  label: '🔍 Keywords'   },
  { id: 'aio',       label: '✨ AI Optimize' },
  { id: 'connect',   label: '🔗 Connect'    },
]

export default function SEOTab() {
  const { tenantId } = useTenant()

  const [activeTab, setActiveTab] = useState<SeoTabId>('overview')
  const [pages, setPages] = useState<SeoPageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [integrations, setIntegrations] = useState<IntegrationValues>({
    google_api_key: '', google_analytics_id: '', google_search_console_url: '',
  })

  const [auditMode, setAuditMode] = useState<'mobile' | 'desktop'>('mobile')
  const [auditLoading, setAuditLoading] = useState(false)
  const [lastAudit, setLastAudit] = useState<AuditResult | null>(null)

  const [openEditorSlug, setOpenEditorSlug] = useState<string | null>(null)
  const [editorSaving, setEditorSaving] = useState(false)
  const [editorForm, setEditorForm] = useState<EditorForm>({
    meta_title: '', meta_description: '', focus_keyword: '', og_title: '', og_description: '',
  })

  const [connectForm, setConnectForm] = useState<ConnectForm>({
    google_search_console_url: '', google_analytics_id: '',
  })
  const [connectSaving, setConnectSaving] = useState<string | null>(null)

  // ── Load all data
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

      const makeRow = (slug: string, label: string, url: string,
        type: SeoPageRow['type'], isLive: boolean): SeoPageRow => {
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

      // Deduplicate page_content slugs
      const seenSlugs = new Set<string>()
      for (const row of pageRes.data || []) {
        const slug = row.page_slug
        if (seenSlugs.has(slug)) continue
        seenSlugs.add(slug)
        const label = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        const type = PEST_SLUGS.includes(slug) ? 'pest' as const
          : STATIC_SLUGS.includes(slug) ? 'static' as const : 'pest' as const
        built.push(makeRow(slug, label, slug === 'home' ? '/' : `/${slug}`, type, true))
      }

      // Add static pages that may not have page_content rows
      for (const slug of STATIC_SLUGS) {
        if (!seenSlugs.has(slug)) {
          seenSlugs.add(slug)
          const label = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          built.push(makeRow(slug, label, slug === 'home' ? '/' : `/${slug}`, 'static', true))
        }
      }

      for (const row of locRes.data || []) {
        built.push(makeRow(row.slug, row.city, `/${row.slug}`, 'location', row.is_live))
      }

      for (const row of blogRes.data || []) {
        built.push(makeRow(row.slug, row.title, `/blog/${row.slug}`, 'blog', !!row.published_at))
      }

      setPages(built)

      const intVal = intRes.data?.value || {}
      setIntegrations({
        google_api_key: intVal.google_api_key || '',
        google_analytics_id: intVal.google_analytics_id || '',
        google_search_console_url: intVal.google_search_console_url || '',
      })
      setConnectForm({
        google_search_console_url: intVal.google_search_console_url || '',
        google_analytics_id: intVal.google_analytics_id || '',
      })

      const auditVal = auditRes.data?.value
      if (auditVal) {
        setLastAudit({
          ...auditVal,
          webVitals: auditVal.webVitals || { lcp: null, tbt: null, cls: null },
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Computed stats
  const stats: SeoStats = {
    totalPages: pages.length,
    livePages: pages.filter(p => p.isLive).length,
    seoConfigured: pages.filter(p => p.hasMeta).length,
    issuesFound: pages.filter(p => p.isLive && !p.hasMeta).length,
  }
  const coverage: SeoCoverage = {
    pest:     { total: pages.filter(p => p.type === 'pest').length,     live: pages.filter(p => p.type === 'pest' && p.isLive).length },
    location: { total: pages.filter(p => p.type === 'location').length, live: pages.filter(p => p.type === 'location' && p.isLive).length },
    blog:     { total: pages.filter(p => p.type === 'blog').length,     live: pages.filter(p => p.type === 'blog' && p.isLive).length },
    static:   { total: pages.filter(p => p.type === 'static').length,   live: pages.filter(p => p.type === 'static' && p.isLive).length },
  }

  // ── Editor handlers
  const handleOpenEditor = (slug: string) => {
    const page = pages.find(p => p.slug === slug)
    if (page) setEditorForm({
      meta_title: page.metaTitle, meta_description: page.metaDescription,
      focus_keyword: page.focusKeyword, og_title: page.ogTitle, og_description: page.ogDescription,
    })
    setOpenEditorSlug(slug)
  }

  const handleEditorChange = (field: keyof EditorForm, value: string) =>
    setEditorForm(prev => ({ ...prev, [field]: value }))

  const handleSaveMeta = async (slug: string) => {
    setEditorSaving(true)
    try {
      const { error } = await supabase.from('seo_meta').upsert(
        { tenant_id: tenantId, page_slug: slug, ...editorForm, user_edited: true },
        { onConflict: 'tenant_id,page_slug' }
      )
      if (error) { toast.error('Failed to save SEO data.'); return }
      toast.success('SEO data saved!')
      setPages(prev => prev.map(p => p.slug === slug
        ? { ...p, hasMeta: editorForm.meta_title.trim().length > 0,
            metaTitle: editorForm.meta_title, metaDescription: editorForm.meta_description }
        : p))
      setOpenEditorSlug(null)
    } finally {
      setEditorSaving(false)
    }
  }

  // ── Lighthouse audit
  const runLighthouseAudit = useCallback(async () => {
    if (!integrations.google_api_key) return
    setAuditLoading(true)
    try {
      const siteUrl = 'https://pestflow-pro.vercel.app'
      const res = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
        `?url=${encodeURIComponent(siteUrl)}&strategy=${auditMode}&key=${integrations.google_api_key}`
      )
      const ps = await res.json()
      const cats = ps.lighthouseResult?.categories
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const auditsData: Record<string, any> = ps.lighthouseResult?.audits || {}
      const scores = {
        performance:    Math.round((cats?.performance?.score    || 0) * 100),
        accessibility:  Math.round((cats?.accessibility?.score  || 0) * 100),
        best_practices: Math.round((cats?.['best-practices']?.score || 0) * 100),
        seo:            Math.round((cats?.seo?.score            || 0) * 100),
      }
      const opportunities = Object.values(auditsData)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a: any) => a.details?.type === 'opportunity' && a.score < 0.9)
        .slice(0, 3)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => ({
          title: a.title as string,
          savings: a.details?.overallSavingsMs
            ? `save ${Math.round(a.details.overallSavingsMs)}ms`
            : (a.displayValue as string) || '',
        }))
      const webVitals = {
        lcp: auditsData['largest-contentful-paint']?.displayValue || null,
        tbt: auditsData['total-blocking-time']?.displayValue || null,
        cls: auditsData['cumulative-layout-shift']?.displayValue || null,
      }
      const result: AuditResult = {
        scores, opportunities, webVitals,
        url: siteUrl, run_at: new Date().toISOString(), strategy: auditMode,
      }
      setLastAudit(result)
      await supabase.from('settings').upsert(
        { tenant_id: tenantId, key: 'last_lighthouse_audit', value: result },
        { onConflict: 'tenant_id,key' }
      )
      toast.success('Lighthouse audit complete!')
    } catch {
      toast.error('Audit failed — check your Google API key')
    } finally {
      setAuditLoading(false)
    }
  }, [integrations.google_api_key, auditMode, tenantId])

  // ── Connect handlers
  const handleConnectChange = (field: keyof ConnectForm, value: string) =>
    setConnectForm(prev => ({ ...prev, [field]: value }))

  const handleConnectSave = async (field: keyof ConnectForm) => {
    setConnectSaving(field)
    try {
      const { data: current } = await supabase
        .from('settings').select('value')
        .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      const { error } = await supabase.from('settings').upsert(
        { tenant_id: tenantId, key: 'integrations',
          value: { ...(current?.value || {}), [field]: connectForm[field] } },
        { onConflict: 'tenant_id,key' }
      )
      if (error) { toast.error('Failed to save.'); return }
      toast.success('Saved!')
      setIntegrations(prev => ({ ...prev, [field]: connectForm[field] }))
    } finally {
      setConnectSaving(null)
    }
  }

  const handleRunCheckNow = () => {
    setActiveTab('overview')
    setTimeout(() => runLighthouseAudit(), 150)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading SEO data…</div>
  }

  return (
    <div>
      <PageHelpBanner tab="seo" title="🔍 SEO Dashboard"
        body="Optimize your search engine rankings. Use the Overview tab to see your site health, Pages to edit meta tags, Keywords for research, and Connect to link data sources." />

      <FeatureGate minTier={2} featureName="Full SEO Suite">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-6 gap-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.label}
              {tab.id === 'pages' && stats.issuesFound > 0 && (
                <span className="ml-1.5 w-2 h-2 bg-red-500 rounded-full inline-block" />
              )}
              {tab.id === 'connect' && integrations.google_api_key && (
                <span className="ml-1.5 w-2 h-2 bg-emerald-500 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <SeoOverviewTab stats={stats} coverage={coverage} integrations={integrations}
            lastAudit={lastAudit} auditLoading={auditLoading} auditMode={auditMode}
            onSetAuditMode={setAuditMode} onRunAudit={runLighthouseAudit}
            onGoToConnect={() => setActiveTab('connect')} />
        )}
        {activeTab === 'pages' && (
          <SeoPagesTab stats={stats} pages={pages} openEditorSlug={openEditorSlug}
            editorForm={editorForm} editorSaving={editorSaving}
            onOpenEditor={handleOpenEditor} onCloseEditor={() => setOpenEditorSlug(null)}
            onEditorChange={handleEditorChange} onSaveMeta={handleSaveMeta} />
        )}
        {activeTab === 'keywords' && (
          <FeatureGate minTier={3} featureName="AI Keyword Research">
            <SeoKeywordsTab />
          </FeatureGate>
        )}
        {activeTab === 'aio' && (
          <FeatureGate minTier={3} featureName="AIO Structured Data">
            <SeoAioTab />
          </FeatureGate>
        )}
        {activeTab === 'connect' && (
          <SeoConnectTab integrations={integrations} connectForm={connectForm}
            connectSaving={connectSaving} onChange={handleConnectChange}
            onSave={handleConnectSave} onRunCheckNow={handleRunCheckNow} />
        )}
      </FeatureGate>
    </div>
  )
}
