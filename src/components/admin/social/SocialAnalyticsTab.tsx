import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { usePlan } from '../../../context/PlanContext'
import PageHelpBanner from '../PageHelpBanner'
import SocialVolumeChart from '../reports/SocialVolumeChart'

interface SocialPost {
  id: string
  platform: string
  status: string
  created_at: string
  published_at: string | null
  caption: string
}

function platformBadgeClass(platform: string) {
  if (platform === 'facebook') return 'bg-blue-100 text-blue-700'
  if (platform === 'instagram') return 'bg-pink-100 text-pink-700'
  return 'bg-gray-100 text-gray-600'
}

export default function SocialAnalyticsTab() {
  const { tenantId } = useTenant()
  const { tier } = usePlan()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('social_posts')
      .select('id, platform, status, created_at, published_at, caption')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [tenantId])

  const published = posts.filter(p => p.status === 'published')
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonth = posts.filter(p => p.created_at >= monthStart).length
  const activePlatforms = new Set(published.map(p => p.platform)).size

  const platformCounts: Record<string, number> = {}
  published.forEach(p => { platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1 })
  const maxCount = Math.max(...Object.values(platformCounts), 1)

  const bestPosts = published
    .filter(p => p.published_at)
    .sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))
    .slice(0, 5)

  if (loading) {
    return (
      <div>
        <PageHelpBanner tab="social-analytics" title="📊 Social Analytics"
          body="Track your social media output and identify your best-performing content." />
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHelpBanner tab="social-analytics" title="📊 Social Analytics"
        body="Track your social media output and identify your best-performing content." />

      {/* Summary Stat Cards — Pro and above */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Posts Published', value: published.length, color: 'text-emerald-600' },
            { label: 'Posts This Month', value: thisMonth, color: 'text-purple-600' },
            { label: 'Platforms Active', value: activePlatforms, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 2. Platform Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Platform Breakdown</h3>
          {Object.keys(platformCounts).length === 0 ? (
            <p className="text-sm text-gray-400">No published posts yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).map(([platform, count]) => (
                <div key={platform}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium text-gray-700">{platform}</span>
                    <span className="text-gray-500">{count} post{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Best Performing Posts + Volume — Elite only */}
        {tier >= 4 && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Best Performing Posts</h3>
              <p className="text-xs text-gray-400 mb-4">Connect Facebook to see reach &amp; engagement data</p>
              {bestPosts.length === 0 ? (
                <p className="text-sm text-gray-400">No published posts yet.</p>
              ) : (
                <div className="space-y-3">
                  {bestPosts.map(p => (
                    <div key={p.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium flex-shrink-0 ${platformBadgeClass(p.platform)}`}>
                        {p.platform}
                      </span>
                      <p className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                        {p.caption.length > 80 ? p.caption.slice(0, 80) + '…' : p.caption}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {tenantId && <SocialVolumeChart tenantId={tenantId} />}
          </>
        )}
    </div>
  )
}
