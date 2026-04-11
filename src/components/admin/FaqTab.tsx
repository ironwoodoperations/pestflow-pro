import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal'
import FaqItemForm, { FAQ_CATEGORIES, type FaqFormData } from './FaqItemForm'

interface FaqItem {
  id: string
  tenant_id: string
  question: string
  answer: string
  category: string
  sort_order: number
}

export default function FaqTab() {
  const { tenantId } = useTenant()
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    supabase.from('faqs').select('*').eq('tenant_id', tenantId)
      .order('category').order('sort_order')
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [tenantId])

  async function handleAdd(form: FaqFormData) {
    if (!form.question.trim() || !form.answer.trim()) { toast.error('Question and answer are required.'); return }
    if (!tenantId) return
    setSaving(true)
    const { data, error } = await supabase.from('faqs').insert({
      tenant_id: tenantId,
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      sort_order: Number(form.sort_order) || 0,
    }).select('*').single()
    setSaving(false)
    if (error) { toast.error('Failed to save.'); return }
    setItems(prev => [...prev, data].sort((a, b) => a.category.localeCompare(b.category) || a.sort_order - b.sort_order))
    setAdding(false)
    toast.success('FAQ item added!')
  }

  async function handleSaveEdit(id: string, form: FaqFormData) {
    if (!form.question.trim() || !form.answer.trim()) { toast.error('Question and answer are required.'); return }
    setSaving(true)
    const { error } = await supabase.from('faqs').update({
      question: form.question.trim(), answer: form.answer.trim(),
      category: form.category, sort_order: Number(form.sort_order) || 0,
    }).eq('id', id)
    setSaving(false)
    if (error) { toast.error('Failed to save.'); return }
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, question: form.question.trim(), answer: form.answer.trim(), category: form.category, sort_order: Number(form.sort_order) || 0 }
      : i).sort((a, b) => a.category.localeCompare(b.category) || a.sort_order - b.sort_order))
    setEditId(null)
    toast.success('FAQ item updated!')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('faqs').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Failed to delete.'); return }
    setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast.success('FAQ item deleted.')
  }

  const grouped = FAQ_CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {} as Record<string, FaqItem[]>)

  // Also catch any items with categories not in the preset list
  const otherCats = [...new Set(items.map(i => i.category))].filter(c => !FAQ_CATEGORIES.includes(c))
  otherCats.forEach(cat => { grouped[cat] = items.filter(i => i.category === cat) })

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <div className="space-y-4">
      <PageHelpBanner tab="content" title="❓ FAQ Manager" body="Add, edit, or delete FAQ questions by category. Changes appear on your public FAQ page immediately." />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">FAQ Items ({items.length})</h3>
          {!adding && (
            <button onClick={() => setAdding(true)} className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">
              + Add Question
            </button>
          )}
        </div>

        {adding && (
          <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
            <h4 className="font-medium text-gray-800 text-sm mb-3">New FAQ Item</h4>
            <FaqItemForm
              onSave={handleAdd}
              onCancel={() => setAdding(false)}
              saving={saving}
              label="Save"
            />
          </div>
        )}

        {items.length === 0 && !adding && (
          <p className="text-sm text-gray-400 text-center py-8">No FAQ items yet. Click "Add Question" to start.</p>
        )}

        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 py-1 border-b border-gray-100 mb-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">{cat}</span>
              <span className="text-xs text-gray-400">({catItems.length})</span>
            </div>
            <div className="space-y-2">
              {catItems.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  {editId === item.id ? (
                    <FaqItemForm
                      initial={{ question: item.question, answer: item.answer, category: item.category, sort_order: String(item.sort_order) }}
                      onSave={form => handleSaveEdit(item.id, form)}
                      onCancel={() => setEditId(null)}
                      saving={saving}
                      label="Save"
                    />
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{item.question}</p>
                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{item.answer}</p>
                        <p className="text-xs text-gray-300 mt-1">order: {item.sort_order}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 items-start">
                        <button
                          onClick={() => setEditId(item.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >Edit</button>
                        <button onClick={() => setDeleteTarget(item)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.question?.slice(0, 50) || 'this FAQ item'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
