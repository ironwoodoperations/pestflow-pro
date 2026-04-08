import type { SocialPost, IntegrationSettings } from './useSocialData'

interface Props {
  posts: SocialPost[]
  integrations: IntegrationSettings | null
  onOpenConnections: () => void
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function AnalyticsTab({ posts, integrations, onOpenConnections }: Props) {
  const total = posts.length
  const published = posts.filter(p => p.status === 'published').length
  const scheduled = posts.filter(p => p.status === 'scheduled').length
  const drafts = posts.filter(p => p.status === 'draft' || p.status === 'approved').length

  const fbPosts = posts.filter(p => p.platform === 'facebook' || p.platform === 'both').length
  const igPosts = posts.filter(p => p.platform === 'instagram' || p.platform === 'both').length

  const recentPublished = posts
    .filter(p => p.status === 'published' && p.published_at)
    .slice(0, 5)

  const provider = integrations?.active_social_provider || 'export'

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={total} label="Total Posts" color="text-gray-800" />
        <StatCard value={published} label="Published" color="text-emerald-600" />
        <StatCard value={scheduled} label="Scheduled" color="text-purple-600" />
        <StatCard value={drafts} label="Drafts" color="text-amber-600" />
      </div>

      {/* Platform breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xl font-bold text-[#1877f2]">{fbPosts}</p>
          <p className="text-sm text-gray-500">Facebook Posts</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xl font-bold text-pink-500">{igPosts}</p>
          <p className="text-sm text-gray-500">Instagram Posts</p>
        </div>
      </div>

      {/* Engagement placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-2">Engagement Analytics</h4>
        {provider === 'export' ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-sm text-gray-500 mb-1">Connect a social account to unlock engagement analytics</p>
            <p className="text-xs text-gray-400 mb-3">Real-time likes, comments, reach, and click data will appear here once you connect via DIY or Buffer.</p>
            <button onClick={onOpenConnections}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
              Open Connections
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Coming soon — engagement data will sync once posts are published.
          </p>
        )}
      </div>

      {/* Recent activity */}
      {recentPublished.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {recentPublished.map(p => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${
                  p.platform === 'facebook' ? 'bg-blue-100 text-blue-700'
                    : p.platform === 'instagram' ? 'bg-pink-100 text-pink-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>{p.platform}</span>
                <span className="text-gray-600 truncate flex-1">{p.caption.slice(0, 60)}{p.caption.length > 60 ? '…' : ''}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
