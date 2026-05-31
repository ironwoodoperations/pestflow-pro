import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import InfoTooltip from '../common/InfoTooltip'

interface SocialStats {
  total: number
  published: number
  scheduled: number
  drafts: number
  byPlatform: { platform: string; total: number; published: number; scheduled: number; drafts: number }[]
}

export default function SocialPostsTile() {
  const { id: tenantId } = useTenant()
  const [social, setSocial] = useState<SocialStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('social_posts')
      .select('platform, status')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        const posts = data || []
        const published = posts.filter(p => p.status === 'published').length
        const scheduled = posts.filter(p => p.status === 'scheduled').length
        const drafts = posts.filter(p => p.status === 'draft' || p.status === 'approved').length
        const platforms = ['facebook', 'instagram', 'both']
        const byPlatform = platforms
          .map(plat => {
            const pp = posts.filter(p => p.platform === plat)
            return {
              platform: plat,
              total: pp.length,
              published: pp.filter(p => p.status === 'published').length,
              scheduled: pp.filter(p => p.status === 'scheduled').length,
              drafts: pp.filter(p => p.status === 'draft' || p.status === 'approved').length,
            }
          })
          .filter(p => p.total > 0)
        setSocial({ total: posts.length, published, scheduled, drafts, byPlatform })
        setLoading(false)
      })
  }, [tenantId])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Social Posts</h3>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !social || social.total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No social posts yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Total', value: social.total, color: 'text-gray-800', metricKey: 'social.total' },
              { label: 'Published', value: social.published, color: 'text-emerald-600', metricKey: 'social.published' },
              { label: 'Scheduled', value: social.scheduled, color: 'text-purple-600', metricKey: 'social.scheduled' },
              { label: 'Drafts', value: social.drafts, color: 'text-amber-600', metricKey: 'social.drafts' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}<InfoTooltip metricKey={s.metricKey} /></p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
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
                    <td className="py-2 capitalize font-medium text-gray-700">
                      {p.platform === 'both' ? 'FB + IG' : p.platform}
                    </td>
                    <td className="py-2 text-right text-gray-600">{p.total}</td>
                    <td className="py-2 text-right text-emerald-600">{p.published}</td>
                    <td className="py-2 text-right text-purple-600">{p.scheduled}</td>
                    <td className="py-2 text-right text-amber-600">{p.drafts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
