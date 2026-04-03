import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

interface SocialStats {
  total: number; published: number; scheduled: number; drafts: number
  byPlatform: { platform: string; total: number; published: number; scheduled: number; drafts: number }[]
}

interface SeoStats {
  total: number
  withTitle: number; withDesc: number; withKeyword: number
}

export default function SocialSeoReport() {
  const { tenantId } = useTenant()
  const [social, setSocial] = useState<SocialStats | null>(null)
  const [seo, setSeo] = useState<SeoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('social_posts').select('platform, status').eq('tenant_id', tenantId),
      supabase.from('seo_meta').select('meta_title, meta_description, focus_keyword').eq('tenant_id', tenantId),
    ]).then(([postsRes, seoRes]) => {
      // Social
      const posts = postsRes.data || []
      const published = posts.filter(p => p.status === 'published').length
      const scheduled = posts.filter(p => p.status === 'scheduled').length
      const drafts = posts.filter(p => p.status === 'draft' || p.status === 'approved').length
      const platforms = ['facebook', 'instagram', 'both']
      const byPlatform = platforms.map(plat => {
        const pp = posts.filter(p => p.platform === plat)
        return {
          platform: plat, total: pp.length,
          published: pp.filter(p => p.status === 'published').length,
          scheduled: pp.filter(p => p.status === 'scheduled').length,
          drafts: pp.filter(p => p.status === 'draft' || p.status === 'approved').length,
        }
      }).filter(p => p.total > 0)
      setSocial({ total: posts.length, published, scheduled, drafts, byPlatform })

      // SEO
      const rows = seoRes.data || []
      setSeo({
        total: rows.length,
        withTitle: rows.filter(r => r.meta_title?.trim()).length,
        withDesc: rows.filter(r => r.meta_description?.trim()).length,
        withKeyword: rows.filter(r => r.focus_keyword?.trim()).length,
      })

      setLoading(false)
    })
  }, [tenantId])

  if (loading) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Social Post Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Social Posts</h3>
        {social && social.total > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Total', value: social.total, color: 'text-gray-800' },
                { label: 'Published', value: social.published, color: 'text-emerald-600' },
                { label: 'Scheduled', value: social.scheduled, color: 'text-purple-600' },
                { label: 'Drafts', value: social.drafts, color: 'text-amber-600' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="text-left py-2">Platform</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">Published</th>
                  <th className="text-right py-2">Scheduled</th>
                  <th className="text-right py-2">Drafts</th>
                </tr>
              </thead>
              <tbody>
                {social.byPlatform.map(p => (
                  <tr key={p.platform} className="border-b border-gray-50">
                    <td className="py-2 capitalize font-medium text-gray-700">{p.platform === 'both' ? 'FB + IG' : p.platform}</td>
                    <td className="py-2 text-right text-gray-600">{p.total}</td>
                    <td className="py-2 text-right text-emerald-600">{p.published}</td>
                    <td className="py-2 text-right text-purple-600">{p.scheduled}</td>
                    <td className="py-2 text-right text-amber-600">{p.drafts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No social posts yet.</p>
        )}
      </div>

      {/* SEO Coverage Snapshot */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">SEO Coverage</h3>
        {seo && seo.total > 0 ? (
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
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No SEO metadata yet.</p>
        )}
      </div>
    </div>
  )
}
