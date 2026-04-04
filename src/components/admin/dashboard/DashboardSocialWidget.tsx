import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

interface Post { id: string; scheduled_at: string | null; status: string; created_at: string }

interface Props {
  onNavigate: (tab: string) => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardSocialWidget({ onNavigate }: Props) {
  const { tenantId } = useTenant()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('social_posts')
      .select('id, scheduled_at, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [tenantId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-xs text-gray-400">Loading social data…</p>
      </div>
    )
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthPosts = posts.filter(p => {
    const d = new Date(p.scheduled_at || p.created_at)
    return d >= monthStart && (p.status === 'scheduled' || p.status === 'published')
  })
  const lastPost = posts.find(p => p.status === 'published')

  if (thisMonthPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Social Media</h3>
        <p className="text-xs text-gray-400 mb-4">No posts scheduled yet</p>
        <button onClick={() => onNavigate('social')}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
          Go to Social →
        </button>
      </div>
    )
  }

  const publishedCount = thisMonthPosts.filter(p => p.status === 'published').length
  const scheduledCount = thisMonthPosts.filter(p => p.status === 'scheduled').length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Social Media</h3>
          <p className="text-xs text-gray-400 mt-0.5">This month</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center">
          <span className="font-bold text-xl text-emerald-700">{thisMonthPosts.length}</span>
        </div>
      </div>
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Published</span>
          <span className="font-medium text-gray-700">{publishedCount}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Scheduled</span>
          <span className="font-medium text-gray-700">{scheduledCount}</span>
        </div>
      </div>
      {lastPost && (
        <p className="text-xs text-gray-400 mb-3">
          Last published: {fmtDate(lastPost.scheduled_at || lastPost.created_at)}
        </p>
      )}
      <button onClick={() => onNavigate('social')}
        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition">
        Manage Social →
      </button>
    </div>
  )
}
