import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import type { AuditResult, IntegrationValues } from './seoTypes'

export function useSeoAudit(tenantId: string, integrations: IntegrationValues) {
  const [auditMode, setAuditMode] = useState<'mobile' | 'desktop'>('mobile')
  const [auditLoading, setAuditLoading] = useState(false)
  const [lastAudit, setLastAudit] = useState<AuditResult | null>(null)

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
        performance:    Math.round((cats?.performance?.score           || 0) * 100),
        accessibility:  Math.round((cats?.accessibility?.score         || 0) * 100),
        best_practices: Math.round((cats?.['best-practices']?.score    || 0) * 100),
        seo:            Math.round((cats?.seo?.score                   || 0) * 100),
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
        tbt: auditsData['total-blocking-time']?.displayValue      || null,
        cls: auditsData['cumulative-layout-shift']?.displayValue   || null,
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

  return { auditMode, setAuditMode, auditLoading, lastAudit, setLastAudit, runLighthouseAudit }
}
