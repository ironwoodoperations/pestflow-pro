import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Download, RefreshCw, Clock, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { usePlan } from '../../context/PlanContext'
import { triggerRevalidate } from '../../lib/revalidate'
import PageHelpBanner from './PageHelpBanner'
import TestimonialCard from './TestimonialCard'
import type { Testimonial } from './TestimonialCard'
import TestimonialModal from './TestimonialModal'
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal'
import { FeatureGate } from '../common/FeatureGate'

interface FormState {
  author_name: string; author_email: string; review_text: string
  rating: number; source: string; featured: boolean
}

const EMPTY_FORM: FormState = { author_name: '', author_email: '', review_text: '', rating: 5, source: 'Google', featured: false }

/** Relative time formatter — "3 days ago", "just now", etc. */
function relativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Never'
  const diffMs = Date.now() - new Date(isoString).getTime()
  if (diffMs < 60_000)           return 'Just now'
  if (diffMs < 3_600_000)        return `${Math.floor(diffMs / 60_000)}m ago`
  if (diffMs < 86_400_000)       return `${Math.floor(diffMs / 3_600_000)}h ago`
  if (diffMs < 7 * 86_400_000)   return `${Math.floor(diffMs / 86_400_000)}d ago`
  return new Date(isoString).toLocaleDateString()
}

/** Countdown formatted as H:MM:SS */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Auto-refresh cadence label derived from tier */
function cadenceLabel(tier: number): string {
  if (tier >= 3) return 'Weekly'
  if (tier === 2) return 'Every 2 weeks'
  return 'Monthly'
}

export default function TestimonialsTab() {
  const { id: tenantId } = useTenant()
  const { tier } = usePlan()

  const [reviews, setReviews] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)

  // Outscraper sync panel state
  const [outscraperLastSynced, setOutscraperLastSynced] = useState<string | null>(null)
  const [outscraperReviewTotal, setOutscraperReviewTotal] = useState<number | null>(null)
  const [outscraperLastError, setOutscraperLastError] = useState<string | null>(null)
  const [outscraperRefreshing, setOutscraperRefreshing] = useState(false)
  const [rateLimitUntil, setRateLimitUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState<string | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchReviews() {
    if (!tenantId) return
    const { data } = await supabase.from('testimonials').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!tenantId) return
    supabase.from('testimonials').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      .then(({ data }) => { setReviews(data || []); setLoading(false) })
  }, [tenantId])

  // Load Outscraper sync metadata from settings.integrations
  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setOutscraperLastSynced(data.value.outscraper_last_synced_at ?? null)
          setOutscraperReviewTotal(data.value.outscraper_review_total ?? null)
          setOutscraperLastError(data.value.outscraper_last_error ?? null)
        }
      })
  }, [tenantId])

  // Countdown timer for rate-limit window
  useEffect(() => {
    if (!rateLimitUntil) { setCountdown(null); return }
    const tick = () => {
      const remaining = rateLimitUntil.getTime() - Date.now()
      if (remaining <= 0) { setRateLimitUntil(null); setCountdown(null); if (countdownRef.current) clearInterval(countdownRef.current) }
      else { setCountdown(formatCountdown(remaining)) }
    }
    tick()
    countdownRef.current = setInterval(tick, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [rateLimitUntil])

  async function handleOutscraperRefresh() {
    if (!tenantId || outscraperRefreshing) return
    setOutscraperRefreshing(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) { toast.error('Session expired — please log in again.'); return }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outscraper-reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ tenant_id: tenantId, mode: 'manual' }),
        },
      )

      const body = await res.json()

      if (res.status === 429) {
        const retryAfter = body.retry_after ? new Date(body.retry_after) : new Date(Date.now() + 6 * 60 * 60 * 1000)
        setRateLimitUntil(retryAfter)
        toast.error('Manual refresh is rate-limited to once per 6 hours.')
        return
      }

      if (!res.ok) {
        toast.error(body.error ?? 'Refresh failed — check Supabase logs.')
        return
      }

      // Success
      const synced = new Date().toISOString()
      setOutscraperLastSynced(synced)
      setOutscraperReviewTotal(body.total_reviews ?? null)
      setOutscraperLastError(null)
      setRateLimitUntil(new Date(Date.now() + 6 * 60 * 60 * 1000)) // start 6h cooldown

      toast.success(`✅ Synced ${body.inserted_count ?? 0} new review${body.inserted_count !== 1 ? 's' : ''} from Google (${body.total_reviews ?? 0} total on profile)`)
      fetchReviews()
    } catch (e) {
      toast.error('Refresh failed — network error.')
      console.error('[TestimonialsTab] outscraper refresh error:', e)
    } finally {
      setOutscraperRefreshing(false)
    }
  }

  function openNew() { setForm(EMPTY_FORM); setEditingId(null); setModalOpen(true) }

  function openEdit(r: Testimonial) {
    setForm({ author_name: r.author_name, author_email: r.author_email || '', review_text: r.review_text, rating: r.rating, source: r.source || 'Google', featured: r.featured })
    setEditingId(r.id); setModalOpen(true)
  }

  async function handleSave() {
    if (!tenantId || !form.author_name.trim() || !form.review_text.trim()) { toast.error('Name and review text are required.'); return }
    setSaving(true)
    const payload = { author_name: form.author_name, author_email: form.author_email || null, review_text: form.review_text, rating: form.rating, source: form.source, featured: form.featured }
    if (editingId) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editingId)
      if (error) { toast.error(`Failed to update: ${error.message}`) } else {
        toast.success('Review updated!')
        const { data: s } = await supabase.auth.getSession()
        if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'testimonials', tenantId }, s.session.access_token)
      }
    } else {
      const { error } = await supabase.from('testimonials').insert({ tenant_id: tenantId, ...payload })
      if (error) { toast.error(`Failed to add review: ${error.message}`) } else {
        toast.success('Review added!')
        const { data: s } = await supabase.auth.getSession()
        if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'testimonials', tenantId }, s.session.access_token)
      }
    }
    setSaving(false); setModalOpen(false); fetchReviews()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await supabase.from('testimonials').delete().eq('id', deleteTarget.id)
    toast.success('Review deleted.')
    setDeleteTarget(null)
    fetchReviews()
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'testimonials', tenantId }, s.session.access_token)
  }

  async function toggleFeatured(r: Testimonial) {
    await supabase.from('testimonials').update({ featured: !r.featured }).eq('id', r.id)
    toast.success(r.featured ? 'Unfeatured' : 'Featured!')
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, featured: !x.featured } : x))
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'testimonials', tenantId }, s.session.access_token)
  }

  async function requestReview(r: Testimonial) {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-review-request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ tenant_id: tenantId, email_override: r.author_email, name_override: r.author_name }),
      }
    )
    if (!res.ok) { const b = await res.json(); throw new Error(b.error || 'Request failed') }
    const body = await res.json()
    if (body.skipped && body.reason === 'no_place_id') { toast.info('Add a Google Place ID in Settings → Integrations to send review requests.'); return }
    setSentIds(prev => new Set(prev).add(r.id))
    toast.success(`✅ Review request sent to ${r.author_name}`)
  }

  async function importGoogleReviews() {
    if (!tenantId) return
    setImporting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) { toast.error('Session expired. Please log in again.'); return }

      const { data, error } = await supabase.functions.invoke('places-reviews', {
        body: { tenant_id: tenantId },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (error) {
        const msg = (error as { message?: string })?.message ?? ''
        if (msg.includes('422') || msg.includes('No place_id')) {
          toast.error('No Google location linked. Add a Place ID in Settings → Integrations.')
        } else if (msg.includes('502') || msg.includes('Google Places API error')) {
          toast.error('Google returned an error. Check the Place ID or try again later.')
        } else {
          toast.error('Failed to fetch Google reviews.')
        }
        return
      }

      const gReviews: { author_name: string; rating: number; text: string }[] = data?.reviews || []
      if (gReviews.length === 0) { toast.error('No reviews found for this location.'); return }

      let imported = 0
      for (const r of gReviews) {
        const { error: insertErr } = await supabase.from('testimonials').insert({
          tenant_id: tenantId,
          author_name: r.author_name || 'Google User',
          review_text: r.text || '',
          rating: r.rating || 5,
          source: 'Google',
          featured: false,
        })
        if (!insertErr) imported++
      }

      toast.success(`Imported ${imported} Google review${imported !== 1 ? 's' : ''}!`)
      fetchReviews()
      const { data: s } = await supabase.auth.getSession()
      if (s.session?.access_token && tenantId) {
        await triggerRevalidate({ type: 'testimonials', tenantId }, s.session.access_token)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch Google reviews.')
    } finally {
      setImporting(false)
    }
  }

  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) } return n })
  const totalReviews = reviews.length
  const featuredCount = reviews.filter(r => r.featured).length
  const avgRating = totalReviews ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '0'

  return (
    <div>
      <PageHelpBanner tab="testimonials" title="⭐ Reviews — How to use this tab" body="Import your Google reviews automatically, or add them manually. Toggle 'Featured' on your best reviews to show them on the homepage. Add a customer email to enable one-click review request emails." />

      {/* ── Google Reviews Auto-Sync panel ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Google Reviews Auto-Sync</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Powered by Outscraper · Auto-refresh: <span className="font-medium">{cadenceLabel(tier)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0 text-right">
            {/* Stats */}
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Imported</p>
              <p className="text-sm font-bold text-gray-800">
                {outscraperReviewTotal != null ? outscraperReviewTotal : '—'}
              </p>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Last Synced</p>
              <p className="text-sm font-bold text-gray-800">{relativeTime(outscraperLastSynced)}</p>
            </div>
            {/* Refresh Now button — tier 4 only */}
            <FeatureGate
              minTier={4}
              featureName="Manual Google Review Sync"
              fallback={
                <div className="text-center">
                  <button
                    disabled
                    className="flex items-center gap-2 border border-gray-200 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed"
                    title="Upgrade to Elite to enable manual refresh"
                  >
                    <RefreshCw size={13} /> Refresh Now
                  </button>
                  <p className="text-[10px] text-gray-400 mt-1">Elite plan only</p>
                </div>
              }
            >
              {countdown ? (
                <div className="text-center">
                  <button disabled className="flex items-center gap-2 border border-gray-200 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed">
                    <Clock size={13} /> {countdown}
                  </button>
                  <p className="text-[10px] text-gray-400 mt-1">Next refresh available</p>
                </div>
              ) : (
                <button
                  onClick={handleOutscraperRefresh}
                  disabled={outscraperRefreshing}
                  className="flex items-center gap-2 border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={13} className={outscraperRefreshing ? 'animate-spin' : ''} />
                  {outscraperRefreshing ? 'Syncing...' : 'Refresh Now'}
                </button>
              )}
            </FeatureGate>
          </div>
        </div>
        {outscraperLastError && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            ⚠️ Last sync error: {outscraperLastError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          {[{ label: 'Total', value: totalReviews }, { label: 'Featured', value: featuredCount }, { label: 'Avg Rating', value: avgRating }].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={importGoogleReviews} disabled={importing} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Download size={16} /> {importing ? 'Importing...' : 'Import Google Reviews'}
          </button>
          <button onClick={openNew} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Add Testimonial
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No testimonials yet. Add your first review!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(r => (
            <TestimonialCard
              key={r.id} testimonial={r} expanded={expanded.has(r.id)} sent={sentIds.has(r.id)}
              onToggleExpand={() => toggleExpand(r.id)} onEdit={() => openEdit(r)}
              onDelete={() => setDeleteTarget(r)} onToggleFeatured={() => toggleFeatured(r)}
              onRequestReview={() => requestReview(r)}
            />
          ))}
        </div>
      )}

      {modalOpen && <TestimonialModal form={form} setForm={setForm} editingId={editingId} saving={saving} onSave={handleSave} onClose={() => setModalOpen(false)} />}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.author_name || 'this review'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
