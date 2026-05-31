import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import InfoTooltip from '../common/InfoTooltip'

// Blog view tracking not yet implemented in DB schema — backlog item.
// This tile shows post counts only.

interface BlogPost {
  id: string
  title: string
  published_at: string | null
  created_at: string
}

function StatCard({ label, value, sub, metricKey }: { label: string; value: string | number; sub?: string; metricKey?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}{metricKey && <InfoTooltip metricKey={metricKey} />}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function BlogAnalyticsTile() {
  const { id: tenantId } = useTenant()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('blog_posts')
      .select('id, title, published_at, created_at')
      .eq('tenant_id', tenantId)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || [])
        setLoading(false)
      })
  }, [tenantId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-semibold text-gray-900">Blog</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const published = posts.filter(p => p.published_at)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const recentCount = published.filter(p => p.published_at! >= thirtyDaysAgo).length
  const mostRecent = published[0] ?? null
  const mostRecentLabel = mostRecent?.published_at
    ? new Date(mostRecent.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-semibold text-gray-900">Blog</h3>
      </div>

      {published.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          No published posts yet — create your first in the Blog tab.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Published" value={published.length} metricKey="blog.published" />
          <StatCard label="Last 30 Days" value={recentCount} metricKey="blog.last_30_days" />
          <StatCard
            label="Most Recent" metricKey="blog.most_recent"
            value={mostRecent ? (mostRecent.title.length > 18 ? mostRecent.title.slice(0, 18) + '…' : mostRecent.title) : '—'}
            sub={mostRecentLabel ?? undefined}
          />
        </div>
      )}
    </div>
  )
}
