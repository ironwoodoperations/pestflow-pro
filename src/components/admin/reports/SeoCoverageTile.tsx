import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'

interface SeoStats {
  total: number
  withTitle: number
  withDesc: number
  withKeyword: number
}

export default function SeoCoverageTile() {
  const { id: tenantId } = useTenant()
  const [seo, setSeo] = useState<SeoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('seo_meta')
      .select('meta_title, meta_description, focus_keyword')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        const rows = data || []
        setSeo({
          total: rows.length,
          withTitle: rows.filter(r => r.meta_title?.trim()).length,
          withDesc: rows.filter(r => r.meta_description?.trim()).length,
          withKeyword: rows.filter(r => r.focus_keyword?.trim()).length,
        })
        setLoading(false)
      })
  }, [tenantId])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">SEO Coverage</h3>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !seo || seo.total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No SEO metadata yet.</p>
      ) : (
        <div className="space-y-4">
          {[
            { label: 'Meta Title', filled: seo.withTitle, total: seo.total },
            { label: 'Meta Description', filled: seo.withDesc, total: seo.total },
            { label: 'Focus Keyword', filled: seo.withKeyword, total: seo.total },
          ].map(item => {
            const pct = Math.round((item.filled / item.total) * 100)
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{item.label}</span>
                  <span className="text-gray-500">{item.filled}/{item.total} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
