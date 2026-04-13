import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { RevealReportData } from '../types/revealReport'

interface Params {
  prospectId: string | null
  tenantId:   string | null
  siteUrl:    string
}

export function useRevealReportData({ prospectId, tenantId, siteUrl }: Params) {
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [data,    setData]    = useState<RevealReportData | null>(null)

  useEffect(() => {
    if (!tenantId || !prospectId || !siteUrl) return
    setLoading(true)
    setError(null)
    setData(null)

    async function load() {
      try {
        const [settingsRes, locRes, prospectRes, faqRes, testRes] = await Promise.all([
          supabase.from('settings')
            .select('key, value, google_search_console_verification')
            .eq('tenant_id', tenantId!)
            .in('key', ['business_info', 'branding', 'seo', 'schema_config', 'integrations']),
          supabase.from('location_data')
            .select('slug, city')
            .eq('tenant_id', tenantId!)
            .eq('is_live', true),
          supabase.from('prospects')
            .select('slug, redirect_map, company_name, tier')
            .eq('id', prospectId!)
            .maybeSingle(),
          supabase.from('faqs')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId!),
          supabase.from('testimonials')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId!),
        ])

        // Build settings map
        const s: Record<string, Record<string, unknown>> = {}
        let gscVerificationValue = ''
        for (const row of settingsRes.data || []) {
          s[row.key] = row.value || {}
          if (row.key === 'integrations' && (row as Record<string, unknown>).google_search_console_verification) {
            gscVerificationValue = String((row as Record<string, unknown>).google_search_console_verification)
          }
        }

        const biz    = s.business_info  || {}
        const brand  = s.branding       || {}
        const seo    = s.seo            || {}
        const schema = s.schema_config  || {}
        const integ  = s.integrations   || {}

        const prospect      = prospectRes.data
        const redirectMap   = prospect?.redirect_map
        const redirectCount = Array.isArray(redirectMap) ? redirectMap.length : 0

        const cityPages        = (locRes.data || []).map(l => l.slug || l.city || '').filter(Boolean)
        const hasFaqSchema     = (faqRes.count ?? 0) > 0
        const hasAggRating     = !!(schema.aggregate_rating as { value?: number })?.value
        const aggRating        = schema.aggregate_rating as { value: number; count: number } | undefined

        // 13-point SEO score
        let seoScore = 0
        if (biz.name)                                                                seoScore++
        if (biz.phone)                                                               seoScore++
        if (biz.address)                                                             seoScore++
        if (Array.isArray(seo.service_areas) && (seo.service_areas as string[]).length > 0) seoScore++
        if (seo.meta_description)                                                    seoScore++
        if ((integ as Record<string, unknown>).google_place_id)                      seoScore++
        if ((integ as Record<string, unknown>).google_analytics_id ||
            (integ as Record<string, unknown>).ga4_id)                               seoScore++
        if (biz.license)                                                             seoScore++
        if (seo.owner_name)                                                          seoScore++
        if (seo.founded_year)                                                        seoScore++
        if (hasFaqSchema)                                                            seoScore++
        if ((testRes.count ?? 0) > 0)                                                seoScore++
        if (gscVerificationValue)                                                    seoScore++

        const reportData: RevealReportData = {
          businessName:  String(biz.name || prospect?.company_name || 'Your Business'),
          slug:          prospect?.slug || '',
          primaryColor:  String(brand.primary_color  || '#10b981'),
          accentColor:   String(brand.accent_color   || '#f5c518'),
          tier:          prospect?.tier || 'starter',
          generatedAt:   new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

          seoScore,
          schemaTypes: [
            'LocalBusiness',
            'PestControlService',
            hasFaqSchema ? 'FAQPage'         : null,
            hasAggRating ? 'AggregateRating' : null,
            'BreadcrumbList',
          ].filter(Boolean) as string[],
          cityPages,
          serviceAreas: Array.isArray(seo.service_areas) ? seo.service_areas as string[] : [],
          sitemapUrl:   `${siteUrl}/sitemap.xml`,
          hasFaqSchema,
          hasAggregateRating: hasAggRating,
          aggregateRating:    hasAggRating ? { score: aggRating!.value, count: aggRating!.count } : undefined,

          redirectCount,
          hasCanonical:                true,
          hasOpenGraph:                true,
          hasSsl:                      siteUrl.startsWith('https://'),
          legalPagesInstalled:         true,
          googleSearchConsoleVerified: !!gscVerificationValue,

          ownerName:   seo.owner_name   ? String(seo.owner_name)   : undefined,
          foundedYear: seo.founded_year ? parseInt(String(seo.founded_year)) : undefined,
          phone:       biz.phone ? String(biz.phone) : undefined,
        }

        setData(reportData)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load report data'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [prospectId, tenantId, siteUrl])

  return { loading, error, data }
}
