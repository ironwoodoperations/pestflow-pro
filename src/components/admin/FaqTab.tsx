import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal'

interface FaqItem {
  id: string
  tenant_id: string
  question: string
  answer: string
  sort_order: number
}

const EMPTY_FORM = { question: '', answer: '' }

export default function FaqTab() {
  const { tenantId } = useTenant()
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    supabase.from('faq_items').select('*').eq('tenant_id', tenantId).order('sort_order').then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [tenantId])

  async function handleAdd() {
    if (!form.question.trim() || !form.answer.trim()) { toast.error('Question and answer are required.'); return }
    if (!tenantId) return
    setSaving(true)
    const next_order = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0
    const { data, error } = await supabase.from('faq_items').insert({
      tenant_id: tenantId, question: form.question.trim(), answer: form.answer.trim(), sort_order: next_order,
    }).select('*').single()
    setSaving(false)
    if (error) { toast.error('Failed to save.'); return }
    setItems(prev => [...prev, data])
    setForm(EMPTY_FORM)
    setAdding(false)
    toast.success('FAQ item added!')
  }

  async function handleSaveEdit(id: string) {
    if (!editForm.question.trim() || !editForm.answer.trim()) { toast.error('Question and answer are required.'); return }
    setSaving(true)
    const { error } = await supabase.from('faq_items').update({ question: editForm.question.trim(), answer: editForm.answer.trim() }).eq('id', id)
    setSaving(false)
    if (error) { toast.error('Failed to save.'); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, question: editForm.question.trim(), answer: editForm.answer.trim() } : i))
    setEditId(null)
    toast.success('FAQ item updated!')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('faq_items').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Failed to delete.'); return }
    setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast.success('FAQ item deleted.')
  }

  async function handleMove(index: number, dir: -1 | 1) {
    const newItems = [...items]
    const swap = index + dir
    if (swap < 0 || swap >= newItems.length) return
    ;[newItems[index], newItems[swap]] = [newItems[swap], newItems[index]]
    const updated = newItems.map((item, i) => ({ ...item, sort_order: i }))
    setItems(updated)
    await Promise.all(updated.map(item => supabase.from('faq_items').update({ sort_order: item.sort_order }).eq('id', item.id)))
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <div className="space-y-4">
      <PageHelpBanner tab="content" title="❓ FAQ Manager" body="Add, edit, or delete FAQ questions. Use the ↑↓ arrows to reorder them. Changes appear on your public FAQ page immediately." />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">FAQ Items ({items.length})</h3>
          {!adding && (
            <button onClick={() => setAdding(true)} className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">
              + Add Question
            </button>
          )}
        </div>

        {/* Add form */}
        {adding && (
          <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 space-y-3">
            <h4 className="font-medium text-gray-800 text-sm">New FAQ Item</h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.question}
                onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="e.g. Are your treatments safe for pets?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                value={form.answer}
                onChange={e => setForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Write the answer here..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setAdding(false); setForm(EMPTY_FORM) }} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {items.length === 0 && !adding && (
          <p className="text-sm text-gray-400 text-center py-8">No FAQ items yet. Click "Add Question" to start.</p>
        )}

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              {editId === item.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={editForm.question}
                      onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      value={editForm.answer}
                      onChange={e => setEditForm(prev => ({ ...prev, answer: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(item.id)} disabled={saving} className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-25 text-xs leading-none">▲</button>
                    <button onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-25 text-xs leading-none">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{item.question}</p>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditId(item.id); setEditForm({ question: item.question, answer: item.answer }) }}
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
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.question?.slice(0, 50) || 'this FAQ item'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
