import { useState, useEffect } from 'react'
import { RefreshCw, Star, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { usePlan } from '../../hooks/usePlan'
import PageHelpBanner from './PageHelpBanner'

interface GoogleReview {
  author_name: string
  rating: number
  text: string
  relative_time_description: string
}

interface PlacesData {
  rating?: number
  user_ratings_total?: number
  reviews?: GoogleReview[]
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const px = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={px}
          fill={i <= rating ? '#f97316' : 'none'}
          stroke={i <= rating ? '#f97316' : '#9ca3af'} />
      ))}
    </div>
  )
}

export default function ReviewsTab() {
  const { tenantId } = useTenant()
  const { canAccess } = usePlan()
  const [data, setData] = useState<PlacesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncedIdx, setSyncedIdx] = useState<Set<number>>(new Set())
  const [syncing, setSyncing] = useState<number | null>(null)

  async function fetchReviews() {
    if (!tenantId) return
    setLoading(true); setError(null)
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
      if (!apiKey) throw new Error('Set VITE_GOOGLE_PLACES_API_KEY in environment variables.')
      const { data: settingsRow } = await supabase
        .from('settings').select('value')
        .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      const placeId = settingsRow?.value?.google_place_id
      if (!placeId) throw new Error('No Google Place ID set. Add it in Settings → Integrations.')
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}`
      )
      const json = await res.json()
      if (json.status !== 'OK') throw new Error(`Google API error: ${json.status}`)
      setData(json.result || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [tenantId]) // eslint-disable-line

  async function syncToTestimonials(review: GoogleReview, idx: number) {
    if (!tenantId) return
    setSyncing(idx)
    try {
      const { error: insertErr } = await supabase.from('testimonials').insert({
        tenant_id: tenantId,
        author_name: review.author_name || 'Google Reviewer',
        review_text: review.text || '',
        rating: review.rating || 5,
        source: 'Google',
        featured: false,
      })
      if (insertErr) throw insertErr
      setSyncedIdx(prev => new Set(prev).add(idx))
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(null)
    }
  }

  if (!canAccess(4)) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-12 text-center">
        <span className="text-4xl mb-4 block">🔒</span>
        <h3 className="font-semibold text-gray-900 mb-2">Elite Plan Feature</h3>
        <p className="text-gray-500 text-sm">Live Google Reviews sync is available on the Elite plan. Upgrade to unlock.</p>
      </div>
    )
  }

  const reviews = (data?.reviews || []).slice(0, 5)

  return (
    <div>
      <PageHelpBanner tab="reviews" title="⭐ Live Google Reviews" body="Pull your latest Google reviews directly from your listing. Click 'Sync to Testimonials' to add any review to your website's testimonials carousel." />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Live Google Reviews</h2>
        <button onClick={fetchReviews} disabled={loading}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading Google reviews…</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchReviews} className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Overall rating */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 flex items-center gap-5">
            <div className="text-4xl font-bold text-gray-900">{data.rating?.toFixed(1) || '—'}</div>
            <div>
              <StarRow rating={Math.round(data.rating || 0)} size="lg" />
              <p className="text-sm text-gray-500 mt-1">{data.user_ratings_total || 0} reviews on Google</p>
            </div>
          </div>

          {/* Review cards */}
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No reviews found for this Place ID.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((review, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{review.author_name || 'Anonymous'}</span>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">{review.relative_time_description}</span>
                    </div>
                    <StarRow rating={review.rating || 0} />
                    <p className="text-xs text-gray-500 leading-relaxed mt-2 mb-3 line-clamp-4">{review.text}</p>
                  </div>
                  {syncedIdx.has(idx) ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced to testimonials
                    </div>
                  ) : (
                    <button onClick={() => syncToTestimonials(review, idx)} disabled={syncing === idx}
                      className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {syncing === idx && <Loader2 className="w-3 h-3 animate-spin" />}
                      Sync to Testimonials
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
