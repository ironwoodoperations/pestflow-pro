import { useState } from 'react'

export const FAQ_CATEGORIES = [
  'General', 'Ants', 'Spiders', 'Wasps & Yellow Jackets',
  'Scorpions', 'Rodents', 'Mosquitoes', 'Fleas & Ticks', 'Roaches', 'Bed Bugs',
]

export interface FaqFormData {
  question: string
  answer: string
  category: string
  sort_order: string
}

export const EMPTY_FAQ_FORM: FaqFormData = { question: '', answer: '', category: 'General', sort_order: '0' }

interface Props {
  initial?: FaqFormData
  onSave: (data: FaqFormData) => void
  onCancel: () => void
  saving: boolean
  label: string
}

export default function FaqItemForm({ initial = EMPTY_FAQ_FORM, onSave, onCancel, saving, label }: Props) {
  const [form, setForm] = useState<FaqFormData>(initial)
  const set = (k: keyof FaqFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={form.question} onChange={set('question')}
          placeholder="e.g. Are your treatments safe for pets?"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
        <textarea
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          value={form.answer} onChange={set('answer')}
          placeholder="Write the answer here..."
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={form.category} onChange={set('category')}
          >
            {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
          <input
            type="number" min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={form.sort_order} onChange={set('sort_order')}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} disabled={saving}
          className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-50">
          {saving ? 'Saving...' : label}
        </button>
        <button onClick={onCancel}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  )
}
