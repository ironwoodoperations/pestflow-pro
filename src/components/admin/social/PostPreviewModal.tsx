import { useState } from 'react'
import type { SocialPost } from './useSocialData'

interface Props {
  post: SocialPost | null
  onClose: () => void
}

export default function PostPreviewModal({ post, onClose }: Props) {
  const [previewPlatform, setPreviewPlatform] = useState<'facebook' | 'instagram'>('facebook')

  if (!post) return null
  const showToggle = post.platform === 'both'
  const platform = showToggle ? previewPlatform : post.platform === 'instagram' ? 'instagram' : 'facebook'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between ${
          platform === 'instagram'
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'bg-[#1877f2] text-white'
        }`}>
          <span className="text-sm font-semibold">
            {platform === 'instagram' ? 'Instagram Preview' : 'Facebook Preview'}
          </span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-lg">&times;</button>
        </div>

        {showToggle && (
          <div className="flex border-b border-gray-200">
            {(['facebook', 'instagram'] as const).map(p => (
              <button key={p} onClick={() => setPreviewPlatform(p)}
                className={`flex-1 py-2 text-xs font-medium capitalize ${
                  previewPlatform === p ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-400'
                }`}>{p}</button>
            ))}
          </div>
        )}

        {platform === 'facebook' ? (
          <FBPreview post={post} />
        ) : (
          <IGPreview post={post} />
        )}
      </div>
    </div>
  )
}

function FBPreview({ post }: { post: SocialPost }) {
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-sm">IC</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">PestFlow Pro</p>
          <p className="text-xs text-gray-400">Just now · 🌐</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.caption}</p>
      </div>
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full max-h-64 object-cover" />
      )}
      <div className="flex items-center justify-around border-t border-gray-200 px-4 py-2.5 text-xs text-gray-500">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗ Share</span>
      </div>
    </div>
  )
}

function IGPreview({ post }: { post: SocialPost }) {
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold">IC</div>
        <span className="text-xs font-semibold text-gray-900">ironclad_pest</span>
        <span className="ml-auto text-gray-400">···</span>
      </div>
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {post.image_url
          ? <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-4xl text-gray-300">📷</span>
        }
      </div>
      <div className="px-4 py-2.5">
        <div className="flex justify-between mb-2 text-lg">
          <div className="flex gap-4">
            <span>♡</span><span>🗨</span><span>✈</span>
          </div>
          <span>🔖</span>
        </div>
        <p className="text-xs text-gray-400 mb-1">Be the first to like this</p>
        <p className="text-xs text-gray-800">
          <span className="font-semibold">ironclad_pest</span>{' '}
          {post.caption.length > 100 ? post.caption.slice(0, 100) + '…' : post.caption}
        </p>
      </div>
    </div>
  )
}
