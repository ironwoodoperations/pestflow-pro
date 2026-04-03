import { useState } from 'react'
import { Mail } from 'lucide-react'

export interface Testimonial {
  id: string; author_name: string; author_email?: string; review_text: string
  rating: number; source: string; featured: boolean; created_at: string
}

interface Props {
  testimonial: Testimonial
  expanded: boolean
  sent: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFeatured: () => void
  onRequestReview: () => Promise<void>
}

const SOURCE_BADGE: Record<string, string> = {
  Google: 'bg-blue-100 text-blue-700',
  Facebook: 'bg-purple-100 text-purple-700',
  Direct: 'bg-gray-100 text-gray-600',
  Yelp: 'bg-red-100 text-red-700',
}

export default function TestimonialCard({ testimonial: r, expanded, sent, onToggleExpand, onEdit, onDelete, onToggleFeatured, onRequestReview }: Props) {
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState(false)

  async function handleRequest() {
    setRequesting(true)
    setError(false)
    try { await onRequestReview() } catch { setError(true) }
    setRequesting(false)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 transition ${r.featured ? 'border-l-4 border-l-emerald-500 border-t border-r border-b border-gray-100' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{r.author_name}</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_BADGE[r.source] || 'bg-gray-100 text-gray-600'}`}>{r.source}</span>
        </div>
        <div className="flex text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
      </div>
      <p className={`text-gray-600 text-sm cursor-pointer ${expanded ? '' : 'line-clamp-3'}`} onClick={onToggleExpand}>
        {r.review_text}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={onToggleFeatured} className={`text-xs font-medium px-2 py-1 rounded ${r.featured ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {r.featured ? '★ Featured' : 'Feature'}
          </button>
          <button onClick={onEdit} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">Edit</button>
          <button onClick={onDelete} className="text-red-500 hover:text-red-600 text-xs font-medium">Delete</button>
          {r.author_email && !sent && (
            <button onClick={handleRequest} disabled={requesting} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
              <Mail size={11} /> {requesting ? 'Sending...' : 'Request Review'}
            </button>
          )}
          {r.author_email && sent && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-50 text-emerald-600">✅ Sent</span>
          )}
          {error && <span className="text-xs text-red-500">Failed — try again</span>}
        </div>
        <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  )
}
