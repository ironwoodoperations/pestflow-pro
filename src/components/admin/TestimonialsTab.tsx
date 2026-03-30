import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Star, Plus, X, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

interface Testimonial {
  id: string; author_name: string; content: string; rating: number
  source: string; featured: boolean; created_at: string
}

interface FormState {
  author_name: string; content: string; rating: number; source: string; featured: boolean
}

const EMPTY_FORM: FormState = { author_name: '', content: '', rating: 5, source: 'Google', featured: false }
const SOURCES = ['Google', 'Facebook', 'Direct', 'Yelp']

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
      const googleReviews = json?.result?.reviews || []
      if (googleReviews.length === 0) { toast.error('No reviews found for this Place ID.'); setImporting(false); return }
      let imported = 0
      for (const r of googleReviews) {
        const { error } = await supabase.from('testimonials').insert({
          tenant_id: tenantId, author_name: r.author_name || 'Google User',
          content: r.text || '', rating: r.rating || 5, source: 'Google', featured: false,
        })
        if (!error) imported++
      }
      toast.success(`Imported ${imported} Google review${imported !== 1 ? 's' : ''}!`)
      fetchReviews()
    } catch { toast.error('Failed to fetch Google reviews. Check API key and Place ID.') }
    setImporting(false)
  }

  async function fetchReviews() {
    if (!tenantId) return
    const { data } = await supabase.from('testimonials').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [tenantId])

  function openNew() { setForm(EMPTY_FORM); setEditingId(null); setModalOpen(true) }
  function openEdit(r: Testimonial) {
    setForm({ author_name: r.author_name, content: r.content, rating: r.rating, source: r.source || 'Google', featured: r.featured })
    setEditingId(r.id); setModalOpen(true)
  }

  async function handleSave() {
    if (!tenantId || !form.author_name.trim() || !form.content.trim()) { toast.error('Name and review text are required.'); return }
    setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('testimonials').update({ author_name: form.author_name, content: form.content, rating: form.rating, source: form.source, featured: form.featured }).eq('id', editingId)
      if (error) toast.error('Failed to update.'); else toast.success('Review updated!')
    } else {
      const { error } = await supabase.from('testimonials').insert({ tenant_id: tenantId, author_name: form.author_name, content: form.content, rating: form.rating, source: form.source, featured: form.featured })
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

  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const totalReviews = reviews.length
  const featuredCount = reviews.filter(r => r.featured).length
  const avgRating = totalReviews ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '0'

  const sourceBadge: Record<string, string> = { Google: 'bg-blue-100 text-blue-700', Facebook: 'bg-purple-100 text-purple-700', Direct: 'bg-gray-100 text-gray-600', Yelp: 'bg-red-100 text-red-700' }

  return (
    <div>
      {/* Top bar */}
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
            <div key={r.id} className={`bg-white rounded-xl shadow-sm border p-5 transition ${r.featured ? 'border-l-4 border-l-emerald-500 border-t border-r border-b border-gray-100' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{r.author_name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge[r.source] || 'bg-gray-100 text-gray-600'}`}>{r.source}</span>
                </div>
                <div className="flex text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              </div>
              <p className={`text-gray-600 text-sm ${expanded.has(r.id) ? '' : 'line-clamp-3'} cursor-pointer`} onClick={() => toggleExpand(r.id)}>
                {r.content}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex gap-2">
                  <button onClick={() => toggleFeatured(r)} className={`text-xs font-medium px-2 py-1 rounded ${r.featured ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.featured ? '★ Featured' : 'Feature'}
                  </button>
                  <button onClick={() => openEdit(r)} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 text-xs font-medium">Delete</button>
                </div>
                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit' : 'Add'} Testimonial</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Author Name *</label>
                <input value={form.author_name} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Text *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setForm(p => ({ ...p, rating: n }))} className="focus:outline-none">
                      <Star size={24} className={n <= form.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white">
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                Featured (shown on homepage)
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
