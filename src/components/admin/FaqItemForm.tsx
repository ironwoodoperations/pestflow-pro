import { useState } from 'react'
import { NEUTRAL_ADMIN_PRESET } from '../../lib/adminVerticalPreset'

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
  /**
   * S285 — the tenant's FAQ categories, from the admin vertical preset.
   *
   * This select is CLOSED: it can only ever submit an option it renders. The
   * list was hardcoded to pest species, so pls's seven live FAQ rows — stored
   * against Sprinkler Systems, Drainage, Pump Systems and Sod & Dirt Work — had
   * no matching <option>, and a controlled select whose value matches no option
   * renders BLANK. Opening the edit form on any of them showed an empty
   * category, and saving silently rewrote it to whichever pest species the
   * browser selected first.
   */
  categories?: string[]
  /** Example question text; varies by trade. */
  questionPlaceholder?: string
}

export default function FaqItemForm({
  initial = EMPTY_FAQ_FORM, onSave, onCancel, saving, label,
  categories = NEUTRAL_ADMIN_PRESET.faqCategories,
  questionPlaceholder = NEUTRAL_ADMIN_PRESET.placeholders.faqQuestion,
}: Props) {
  // A category already stored on this row but absent from the preset still has
  // to be selectable, or editing it silently changes it. Mirrors FaqTab's
  // otherCats fallback, which is what keeps the LIST view correct.
  const options = categories.indexOf(initial.category) === -1 && initial.category
    ? [...categories, initial.category]
    : categories
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
          placeholder={questionPlaceholder}
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
            {options.map(c => <option key={c} value={c}>{c}</option>)}
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
