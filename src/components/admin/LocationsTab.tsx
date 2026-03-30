import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

interface Location {
  id: string; city: string; slug: string; hero_title: string; intro: string
  is_live: boolean; created_at: string
}

interface LocForm {
  city: string; slug: string; hero_title: string; intro: string; is_live: boolean
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
  const [form, setForm] = useState<LocForm>({ city: '', slug: '', hero_title: '', intro: '', is_live: false })
  const [saving, setSaving] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  async function fetchLocations() {
    if (!tenantId) return
    const { data } = await supabase.from('location_data').select('*').eq('tenant_id', tenantId).order('city')
    setLocations(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLocations() }, [tenantId])

  function openNew() {
    setForm({ city: '', slug: '', hero_title: '', intro: '', is_live: false })
    setEditingId(null); setModalOpen(true)
  }

  function openEdit(loc: Location) {
    setForm({ city: loc.city, slug: loc.slug, hero_title: loc.hero_title || '', intro: loc.intro || '', is_live: loc.is_live })
    setEditingId(loc.id); setModalOpen(true)
  }

  async function handleSave() {
    if (!tenantId || !form.city.trim()) { toast.error('City name is required.'); return }
    const slug = form.slug || toSlug(form.city)
    const hero_title = form.hero_title || `${form.city} Pest Control`
    setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('location_data').update({ city: form.city, slug, hero_title, intro: form.intro, is_live: form.is_live }).eq('id', editingId)
      if (error) toast.error('Failed to update.'); else toast.success('Location updated!')
    } else {
      const { error } = await supabase.from('location_data').insert({ tenant_id: tenantId, city: form.city, slug, hero_title, intro: form.intro, is_live: form.is_live })
      if (error) toast.error('Failed to add location.'); else toast.success('Location added!')
    }
    setSaving(false); setModalOpen(false); fetchLocations()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location? This cannot be undone.')) return
    await supabase.from('location_data').delete().eq('id', id)
    toast.success('Location deleted.'); fetchLocations()
  }

  async function toggleLive(loc: Location) {
    await supabase.from('location_data').update({ is_live: !loc.is_live }).eq('id', loc.id)
    toast.success(loc.is_live ? 'Hidden' : 'Live!')
    setLocations(prev => prev.map(x => x.id === loc.id ? { ...x, is_live: !x.is_live } : x))
  }

  const activeCount = locations.filter(l => l.is_live).length
  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  return (
    <div>
      {/* Help Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <button onClick={() => setHelpOpen(!helpOpen)} className="flex items-center justify-between w-full text-left">
          <span className="text-sm font-semibold text-blue-900">📍 Locations — How to use this</span>
          {helpOpen ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
        </button>
        {helpOpen && (
          <div className="mt-3 text-sm text-blue-800 space-y-2">
            <p>This is where you manage the cities your business serves. Each city gets its own page on your website that shows up in Google when people search for pest control in that city.</p>
            <ul className="list-none space-y-1">
              <li><strong>CITY NAME</strong> — The name of the city (e.g. Tyler, Longview)</li>
              <li><strong>SLUG</strong> — The URL for that city's page (e.g. tyler-tx)</li>
              <li><strong>LIVE</strong> — Toggle this ON when you're ready for the page to be public</li>
              <li><strong>VIEW PAGE</strong> — Click to see exactly what the page looks like on your site</li>
            </ul>
            <p className="text-blue-700 italic">💡 Add every city you serve. More location pages = more Google traffic.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{activeCount} active location{activeCount !== 1 ? 's' : ''} · {locations.length} total</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
                      <button onClick={() => handleDelete(loc.id)} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
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
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_live} onChange={e => setForm(p => ({ ...p, is_live: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                Show this page on the website
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
