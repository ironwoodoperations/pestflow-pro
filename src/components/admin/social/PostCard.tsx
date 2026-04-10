import type { SocialPost, Campaign } from './useSocialData'

interface Props {
  post: SocialPost
  onPreview: (post: SocialPost) => void
  onEdit: (post: SocialPost) => void
  onApprove: (postId: string) => void
  onDelete: (postId: string) => void
  campaigns: Campaign[]
}

const platformStyles: Record<string, { bg: string; label: string }> = {
  facebook:  { bg: 'bg-[#1877f2] text-white', label: 'Facebook' },
  instagram: { bg: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', label: 'Instagram' },
  both:      { bg: 'bg-gray-700 text-white', label: 'FB + IG' },
}

const statusStyles: Record<string, string> = {
  draft:     'bg-yellow-100 text-yellow-800',
  approved:  'bg-blue-100 text-blue-800',
  scheduled: 'bg-purple-100 text-purple-800',
  published: 'bg-green-100 text-green-800',
  failed:    'bg-red-100 text-red-800',
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' \u00b7 ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function PostCard({ post, onPreview, onEdit, onApprove, onDelete, campaigns }: Props) {
  const pf = platformStyles[post.platform] || platformStyles.facebook
  const ss = statusStyles[post.status] || 'bg-gray-100 text-gray-600'
  const campaign = post.campaign_id ? campaigns.find(c => c.id === post.campaign_id) : null
  const dateStr = post.published_at || post.scheduled_for || post.created_at

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pf.bg}`}>{pf.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ss}`}>{post.status}</span>
      </div>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full max-h-32 object-cover" />
      )}

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-700 line-clamp-3">{post.caption}</p>

        {campaign && (
          <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {campaign.title}
          </span>
        )}

        {post.status === 'failed' && post.error_msg && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1 leading-snug" title={post.error_msg}>
            {post.error_msg.length > 120 ? post.error_msg.slice(0, 120) + '…' : post.error_msg}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-2">{fmtDate(dateStr)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-gray-100">
        <button onClick={() => onPreview(post)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50">Preview</button>
        {post.status === 'draft' && (
          <button onClick={() => onApprove(post.id)}
            className="text-xs text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 font-medium">Approve</button>
        )}
        <button onClick={() => onEdit(post)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50">Edit</button>
        <button onClick={() => { if (window.confirm('Delete this post?')) onDelete(post.id) }}
          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 ml-auto">&times;</button>
      </div>
    </div>
  )
}
