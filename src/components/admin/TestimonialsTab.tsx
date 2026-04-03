import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
import TestimonialCard from './TestimonialCard'
import type { Testimonial } from './TestimonialCard'
import TestimonialModal from './TestimonialModal'

interface FormState {
  author_name: string; author_email: string; review_text: string
  rating: number; source: string; featured: boolean
}

const EMPTY_FORM: FormState = { author_name: '', author_email: '', review_text: '', rating: 5, source: 'Google', featured: false }

export default function TestimonialsTab() {
  const { tenantId } = useTenant()
  const [reviews, setReviews] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  async function fetchReviews() {
    if (!tenantId) return
    const { data } = await supabase.from('testimonials').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [tenantId])

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
      if (error) toast.error('Failed to update.'); else toast.success('Review updated!')
    } else {
      const { error } = await supabase.from('testimonials').insert({ tenant_id: tenantId, ...payload })
      if (error) toast.error('Failed to add review.'); else toast.success('Review added!')
    }
    setSaving(false); setModalOpen(false); fetchReviews()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review? This cannot be undone.')) return
    await supabase.from('testimonials').delete().eq('id', id)
    toast.success('Review deleted.'); fetchReviews()
  }

  async function toggleFeatured(r: Testimonial) {
    await supabase.from('testimonials').update({ featured: !r.featured }).eq('id', r.id)
    toast.success(r.featured ? 'Unfeatured' : 'Featured!')
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, featured: !x.featured } : x))
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
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
    if (!apiKey) { toast.error('Set VITE_GOOGLE_PLACES_API_KEY to import Google reviews.'); return }
    const { data: settings } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
    const placeId = settings?.value?.google_place_id
    if (!placeId) { toast.error('Set Google Place ID in Settings → Integrations first.'); return }
    setImporting(true)
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`)
      const json = await res.json()
      const gReviews = json?.result?.reviews || []
      if (gReviews.length === 0) { toast.error('No reviews found for this Place ID.'); setImporting(false); return }
      let imported = 0
      for (const r of gReviews) {
        const { error } = await supabase.from('testimonials').insert({ tenant_id: tenantId, author_name: r.author_name || 'Google User', review_text: r.text || '', rating: r.rating || 5, source: 'Google', featured: false })
        if (!error) imported++
      }
      toast.success(`Imported ${imported} Google review${imported !== 1 ? 's' : ''}!`); fetchReviews()
    } catch { toast.error('Failed to fetch Google reviews. Check API key and Place ID.') }
    setImporting(false)
  }

  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const totalReviews = reviews.length
  const featuredCount = reviews.filter(r => r.featured).length
  const avgRating = totalReviews ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '0'

  return (
    <div>
      <PageHelpBanner tab="testimonials" title="⭐ Reviews — How to use this tab" body="Import your Google reviews automatically, or add them manually. Toggle 'Featured' on your best reviews to show them on the homepage. Add a customer email to enable one-click review request emails." />

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
              onDelete={() => handleDelete(r.id)} onToggleFeatured={() => toggleFeatured(r)}
              onRequestReview={() => requestReview(r)}
            />
          ))}
        </div>
      )}

      {modalOpen && <TestimonialModal form={form} setForm={setForm} editingId={editingId} saving={saving} onSave={handleSave} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
