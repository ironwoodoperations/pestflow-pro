import { Star, X } from 'lucide-react'

interface FormState {
  author_name: string; author_email: string; review_text: string
  rating: number; source: string; featured: boolean
}

interface Props {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  editingId: string | null
  saving: boolean
  onSave: () => void
  onClose: () => void
}

const SOURCES = ['Google', 'Facebook', 'Direct', 'Yelp']

export default function TestimonialModal({ form, setForm, editingId, saving, onSave, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit' : 'Add'} Testimonial</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Author Name *</label>
            <input value={form.author_name} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Email <span className="text-gray-400 font-normal">(for review requests)</span></label>
            <input type="email" value={form.author_email} onChange={e => setForm(p => ({ ...p, author_email: e.target.value }))} placeholder="customer@example.com" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Text *</label>
            <textarea value={form.review_text} onChange={e => setForm(p => ({ ...p, review_text: e.target.value }))} rows={4} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
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
            <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
            Featured (shown on homepage)
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={onSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
