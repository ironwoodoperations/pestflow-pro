import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

const DEMO_TENANT = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'

interface Props {
  slug: string
  label: string
  initialTitle: string
  initialDesc: string
}

export default function IronwoodSEOPageCard({ slug, label, initialTitle, initialDesc }: Props) {
  const [form, setForm] = useState({ meta_title: initialTitle, meta_description: initialDesc })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('seo_meta').upsert(
      { tenant_id: DEMO_TENANT, page_slug: slug, meta_title: form.meta_title, meta_description: form.meta_description, user_edited: true },
      { onConflict: 'tenant_id,page_slug' }
    )
    setSaving(false)
    if (error) toast.error(`Save failed: ${error.message}`)
    else toast.success(`${label} meta saved`)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-gray-200">{label}</div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Meta Title</label>
        <input
          value={form.meta_title}
          onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          placeholder="Page title for search results"
        />
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-xs text-gray-400">Meta Description</label>
          <span className={`text-xs ${form.meta_description.length > 160 ? 'text-red-400' : 'text-gray-500'}`}>
            {form.meta_description.length}/160
          </span>
        </div>
        <textarea
          value={form.meta_description}
          onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
          rows={2}
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
          placeholder="Brief description shown in search results (max 160 chars)"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
