import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { triggerRevalidate } from '../../lib/revalidate'
import PageHelpBanner from './PageHelpBanner'
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal'

interface Location {
  id: string; city: string; slug: string; hero_title: string; intro: string
  is_live: boolean; created_at: string
  meta_title?: string; meta_description?: string; focus_keyword?: string
}

interface LocForm {
  city: string; slug: string; hero_title: string; intro: string; is_live: boolean
  meta_title: string; meta_description: string; focus_keyword: string
}

const toSlug = (city: string) => {
  let s = city.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  if (!s.endsWith('-tx')) s += '-tx'
  return s
}

export default function LocationsTab() {
  const { tenantId } = useTenant()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LocForm>({ city: '', slug: '', hero_title: '', intro: '', is_live: false, meta_title: '', meta_description: '', focus_keyword: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)

  async function fetchLocations() {
    if (!tenantId) return
    const { data } = await supabase.from('location_data').select('*').eq('tenant_id', tenantId).order('city')
    setLocations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!tenantId) return
    supabase.from('location_data').select('*').eq('tenant_id', tenantId).order('city')
      .then(({ data }) => { setLocations(data || []); setLoading(false) })
  }, [tenantId])

  function openNew() {
    setForm({ city: '', slug: '', hero_title: '', intro: '', is_live: false, meta_title: '', meta_description: '', focus_keyword: '' })
    setEditingId(null); setModalOpen(true)
  }

  function openEdit(loc: Location) {
    setForm({ city: loc.city, slug: loc.slug, hero_title: loc.hero_title || '', intro: loc.intro || '', is_live: loc.is_live, meta_title: loc.meta_title || '', meta_description: loc.meta_description || '', focus_keyword: loc.focus_keyword || '' })
    setEditingId(loc.id); setModalOpen(true)
  }

  async function handleSave() {
    if (!tenantId || !form.city.trim()) { toast.error('City name is required.'); return }
    const slug = form.slug || toSlug(form.city)
    const hero_title = form.hero_title || `${form.city} Pest Control`
    setSaving(true)
    const seoFields = { meta_title: form.meta_title || null, meta_description: form.meta_description || null, focus_keyword: form.focus_keyword || null }
    if (editingId) {
      const { error } = await supabase.from('location_data').update({ city: form.city, slug, hero_title, intro: form.intro, is_live: form.is_live, ...seoFields }).eq('id', editingId)
      if (error) { toast.error(`Failed to update: ${error.message}`) } else {
        toast.success('Location updated!')
        const { data: s } = await supabase.auth.getSession()
        if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'locations', tenantId }, s.session.access_token)
      }
    } else {
      const { error } = await supabase.from('location_data').insert({ tenant_id: tenantId, city: form.city, slug, hero_title, intro: form.intro, is_live: form.is_live, ...seoFields })
      if (error) { toast.error(`Failed to add location: ${error.message}`) } else {
        toast.success('Location added!')
        const { data: s } = await supabase.auth.getSession()
        if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'locations', tenantId }, s.session.access_token)
      }
    }
    setSaving(false); setModalOpen(false); fetchLocations()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await supabase.from('location_data').delete().eq('id', deleteTarget.id)
    toast.success('Location deleted.')
    setDeleteTarget(null)
    fetchLocations()
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'locations', tenantId }, s.session.access_token)
  }

  async function toggleLive(loc: Location) {
    await supabase.from('location_data').update({ is_live: !loc.is_live }).eq('id', loc.id)
    toast.success(loc.is_live ? 'Hidden' : 'Live!')
    setLocations(prev => prev.map(x => x.id === loc.id ? { ...x, is_live: !x.is_live } : x))
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'locations', tenantId }, s.session.access_token)
  }

  const activeCount = locations.filter(l => l.is_live).length
  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  return (
    <div>
      <PageHelpBanner tab="locations" title="📍 Service Locations" body="Each city you add gets its own SEO-optimized page. Add the city name and a URL slug (e.g. tyler-tx), then toggle Live when the page is ready to publish. More location pages = more Google traffic." />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{activeCount} active location{activeCount !== 1 ? 's' : ''} · {locations.length} total</p>
        <button onClick={openNew} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--admin-accent, #10b981)' }}>
          <Plus size={16} /> Add Location
        </button>
      </div>

      {loading ? <p className="text-gray-400 p-4">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['City', 'Slug', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <tr key={loc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{loc.city}</span>
                      {loc.is_live && (
                        <a href={`/${loc.slug}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 text-xs font-medium">
                          View Page <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">/{loc.slug}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleLive(loc)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${loc.is_live ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {loc.is_live ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(loc)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Edit</button>
                      <button onClick={() => setDeleteTarget(loc)} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No locations yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit' : 'Add'} Location</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City Name *</label>
                <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value, slug: editingId ? p.slug : toSlug(e.target.value) }))} placeholder="Tyler" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="tyler-tx" className={inputClass} />
                <p className="text-xs text-gray-400 mt-1">/{form.slug || 'slug-preview'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Title</label>
                <input value={form.hero_title} onChange={e => setForm(p => ({ ...p, hero_title: e.target.value }))} placeholder={`${form.city || 'City'} Pest Control`} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro Text</label>
                <textarea value={form.intro} onChange={e => setForm(p => ({ ...p, intro: e.target.value }))} rows={4} placeholder="Brief intro shown on the location page" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label>
                <input value={form.meta_title} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))} placeholder={`Pest Control in ${form.city || 'City'}, TX | Your Business`} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
                <textarea value={form.meta_description} onChange={e => setForm(p => ({ ...p, meta_description: e.target.value }))} rows={2} placeholder="150-160 char description for Google" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Focus Keyword</label>
                <input value={form.focus_keyword} onChange={e => setForm(p => ({ ...p, focus_keyword: e.target.value }))} placeholder={`pest control ${form.city ? form.city.toLowerCase() : 'city'} tx`} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_live} onChange={e => setForm(p => ({ ...p, is_live: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                Show this page on the website
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: 'var(--admin-accent, #10b981)' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.city || 'this location'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
