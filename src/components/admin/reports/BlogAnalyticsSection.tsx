import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

interface BlogPost {
  id: string
  title: string
  excerpt: string | null
  published_at: string | null
}

export default function BlogAnalyticsSection() {
  const { tenantId } = useTenant()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('blog_posts')
      .select('id, title, excerpt, published_at')
      .eq('tenant_id', tenantId)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || [])
        setLoading(false)
      })
  }, [tenantId])

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Blog Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-24 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Blog Analytics</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No blog posts found. Create your first post in the Blog tab.</p>
        </div>
      </div>
    )
  }

  const published = posts.filter(p => p.published_at)
  const publishedCount = published.length

  const mostRecent = published[0] || null
  const mostRecentTitle = mostRecent
    ? mostRecent.title.length > 40 ? mostRecent.title.slice(0, 40) + '...' : mostRecent.title
    : null
  const mostRecentDate = mostRecent?.published_at
    ? new Date(mostRecent.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const missingExcerpts = posts.filter(p => !p.excerpt || p.excerpt.trim() === '').length

  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Blog Analytics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Published Posts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Published Posts</p>
          <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
        </div>

        {/* Most Recent Post */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Most Recent Post</p>
          {mostRecent ? (
            <>
              <p className="text-sm font-semibold text-gray-900 truncate">{mostRecentTitle}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mostRecentDate}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No posts yet</p>
          )}
        </div>

        {/* Missing Excerpts */}
        <div className={`rounded-xl shadow-sm border p-5 ${
          missingExcerpts > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Missing Excerpts</p>
          <p className={`text-2xl font-bold ${missingExcerpts > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {missingExcerpts}
          </p>
          <p className={`text-xs mt-0.5 ${missingExcerpts > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {missingExcerpts > 0 ? `${missingExcerpts} post${missingExcerpts > 1 ? 's' : ''} need an excerpt` : 'All posts have excerpts'}
          </p>
        </div>
      </div>
    </div>
  )
}
