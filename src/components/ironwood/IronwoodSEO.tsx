import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import IronwoodSEOPageCard from './IronwoodSEOPageCard'

// PFP marketing site tenant — intentionally hardcoded (Ironwood-only, not a client tenant)
const PFP_MARKETING_TENANT_ID = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'

const MARKETING_PAGES = [
  { slug: 'home',     label: 'Home' },
  { slug: 'features', label: 'Features' },
  { slug: 'pricing',  label: 'Pricing' },
  { slug: 'about',    label: 'About' },
  { slug: 'contact',  label: 'Contact' },
]

interface SeoSettings {
  default_meta_title: string
  default_meta_description: string
  business_name: string
  business_phone: string
  business_address: string
  geo_lat: string
  geo_lng: string
  google_analytics_id: string
  google_search_console_verification: string
}

interface PageMeta { page_slug: string; meta_title: string; meta_description: string }

const EMPTY: SeoSettings = {
  default_meta_title: '', default_meta_description: '',
  business_name: '', business_phone: '', business_address: '',
  geo_lat: '', geo_lng: '',
  google_analytics_id: '', google_search_console_verification: '',
}

export default function IronwoodSEO() {
  const [form, setForm] = useState<SeoSettings>(EMPTY)
  const [pageMeta, setPageMeta] = useState<PageMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [seoRes, metaRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', PFP_MARKETING_TENANT_ID).eq('key', 'seo').maybeSingle(),
        supabase.from('seo_meta').select('page_slug,meta_title,meta_description')
          .eq('tenant_id', PFP_MARKETING_TENANT_ID)
          .in('page_slug', MARKETING_PAGES.map(p => p.slug)),
      ])
      const v = seoRes.data?.value || {}
      setForm({
        default_meta_title: v.default_meta_title || '',
        default_meta_description: v.default_meta_description || '',
        business_name: v.business_name || '',
        business_phone: v.business_phone || '',
        business_address: v.business_address || '',
        geo_lat: v.geo_lat || '',
        geo_lng: v.geo_lng || '',
        google_analytics_id: v.google_analytics_id || '',
        google_search_console_verification: v.google_search_console_verification || '',
      })
      setPageMeta((metaRes.data as PageMeta[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  function set(field: keyof SeoSettings, val: string) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function saveSitewide() {
    setSaving(true)
    const { data: current } = await supabase.from('settings').select('value')
      .eq('tenant_id', PFP_MARKETING_TENANT_ID).eq('key', 'seo').maybeSingle()
    const { error } = await supabase.from('settings').upsert(
      { tenant_id: PFP_MARKETING_TENANT_ID, key: 'seo', value: { ...(current?.value || {}), ...form } },
      { onConflict: 'tenant_id,key' }
    )
    setSaving(false)
    if (error) toast.error(`Save failed: ${error.message}`)
    else toast.success('Site-wide SEO saved')
  }

  function getPageMeta(slug: string) {
    const row = pageMeta.find(r => r.page_slug === slug)
    return { title: row?.meta_title || '', desc: row?.meta_description || '' }
  }

  const inputCls = 'w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'
  const labelCls = 'block text-xs text-gray-400 mb-1'

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading SEO settings…</div>

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">🔍 SEO — PestFlow Pro</h2>
        <p className="text-sm text-gray-400">Manage meta tags and schema data for pestflowpro.ai</p>
      </div>

      {/* Section 1 — Site-Wide SEO */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Site-Wide Defaults</h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Default Meta Title (fallback for all pages)</label>
            <input value={form.default_meta_title} onChange={e => set('default_meta_title', e.target.value)}
              className={inputCls} placeholder="PestFlow Pro | White-Label SaaS for Pest Control Companies" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className={labelCls}>Default Meta Description</label>
              <span className={`text-xs ${form.default_meta_description.length > 160 ? 'text-red-400' : 'text-gray-500'}`}>
                {form.default_meta_description.length}/160
              </span>
            </div>
            <textarea value={form.default_meta_description} onChange={e => set('default_meta_description', e.target.value)}
              rows={3} className={`${inputCls} resize-none`}
              placeholder="Turn-key websites and client management for pest control pros. Launch in days, not months." />
          </div>
        </div>

        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Business Schema</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Business Name</label>
            <input value={form.business_name} onChange={e => set('business_name', e.target.value)}
              className={inputCls} placeholder="PestFlow Pro" />
          </div>
          <div>
            <label className={labelCls}>Business Phone</label>
            <input value={form.business_phone} onChange={e => set('business_phone', e.target.value)}
              className={inputCls} placeholder="+1 (800) 555-0100" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Business Address</label>
            <input value={form.business_address} onChange={e => set('business_address', e.target.value)}
              className={inputCls} placeholder="123 Main St, Tyler, TX 75701" />
          </div>
          <div>
            <label className={labelCls}>Geo Latitude</label>
            <input value={form.geo_lat} onChange={e => set('geo_lat', e.target.value)}
              className={inputCls} placeholder="32.3513" />
          </div>
          <div>
            <label className={labelCls}>Geo Longitude</label>
            <input value={form.geo_lng} onChange={e => set('geo_lng', e.target.value)}
              className={inputCls} placeholder="-95.3011" />
          </div>
        </div>

        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Tracking &amp; Verification</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Google Analytics ID</label>
            <input value={form.google_analytics_id} onChange={e => set('google_analytics_id', e.target.value)}
              className={inputCls} placeholder="G-XXXXXXXXXX" />
          </div>
          <div>
            <label className={labelCls}>Search Console Verification</label>
            <input value={form.google_search_console_verification} onChange={e => set('google_search_console_verification', e.target.value)}
              className={inputCls} placeholder="meta tag content value" />
          </div>
        </div>

        <button onClick={saveSitewide} disabled={saving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
          {saving ? 'Saving…' : 'Save Site-Wide SEO'}
        </button>
      </section>

      {/* Section 2 — Per-Page Meta */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Page-Level Meta Tags</h3>
        <div className="grid grid-cols-1 gap-3">
          {MARKETING_PAGES.map(p => {
            const { title, desc } = getPageMeta(p.slug)
            return (
              <IronwoodSEOPageCard key={p.slug} slug={p.slug} label={p.label}
                initialTitle={title} initialDesc={desc} />
            )
          })}
        </div>
      </section>
    </div>
  )
}
