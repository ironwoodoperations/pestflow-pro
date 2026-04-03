import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'

const TENANT_ID = import.meta.env.VITE_TENANT_ID

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function NewCampaignModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    title: '', goal: '', tone: 'casual', duration_days: 7,
    platforms: [] as string[], start_date: '',
  })
  const [saving, setSaving] = useState(false)

  function togglePlatform(p: string) {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }))
  }

  async function handleCreate() {
    if (!form.title.trim()) { toast.error('Campaign title is required.'); return }
    if (form.platforms.length === 0) { toast.error('Select at least one platform.'); return }
    setSaving(true)
    const { error } = await supabase.from('social_campaigns').insert({
      tenant_id: TENANT_ID,
      title: form.title,
      goal: form.goal || null,
      tone: form.tone,
      duration_days: form.duration_days,
      platforms: form.platforms,
      start_date: form.start_date || null,
      status: 'active',
    })
    setSaving(false)
    if (error) { toast.error('Failed to create campaign.'); return }
    toast.success('Campaign created!')
    onCreated()
    onClose()
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">New Campaign</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Campaign Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Spring Termite Season" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Goal</label>
            <textarea value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
              rows={2} placeholder="e.g. Promote spring termite season deals" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Tone</label>
            <select value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))}
              className={`${inputCls} bg-white`}>
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="urgent">Urgent</option>
              <option value="friendly">Friendly</option>
              <option value="educational">Educational</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Duration (days)</label>
            <input type="number" min={1} max={90} value={form.duration_days}
              onChange={e => setForm(p => ({ ...p, duration_days: parseInt(e.target.value) || 7 }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Platforms *</label>
            <div className="flex gap-4">
              {['facebook', 'instagram'].map(p => (
                <label key={p} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer capitalize">
                  <input type="checkbox" checked={form.platforms.includes(p)}
                    onChange={() => togglePlatform(p)} className="accent-emerald-600" />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Start Date</label>
            <input type="date" value={form.start_date}
              onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
              className={inputCls} />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Campaign'}
            </button>
            <button onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
