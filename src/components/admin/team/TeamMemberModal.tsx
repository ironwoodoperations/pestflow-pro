import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { triggerRevalidate } from '../../../lib/revalidate'
import type { TeamMember } from './TeamMemberCard'

interface Props {
  tenantId: string
  member: TeamMember | null
  onClose: () => void
  onSaved: () => void
}

interface FormState {
  name: string
  title: string
  bio: string
  photo_url: string
  display_order: string
}

export default function TeamMemberModal({ tenantId, member, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>({
    name: '',
    title: '',
    bio: '',
    photo_url: '',
    display_order: '0',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (member) {
      void (async () => {
        setForm({
          name: member.name,
          title: member.title || '',
          bio: member.bio || '',
          photo_url: member.photo_url || '',
          display_order: String(member.display_order),
        })
      })()
    }
  }, [member])

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)
    const payload = {
      tenant_id: tenantId,
      name: form.name.trim(),
      title: form.title.trim() || null,
      bio: form.bio.trim() || null,
      photo_url: form.photo_url.trim() || null,
      display_order: parseInt(form.display_order) || 0,
    }
    const { error: dbErr } = member
      ? await supabase.from('team_members').update(payload).eq('id', member.id)
      : await supabase.from('team_members').insert(payload)
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token) await triggerRevalidate({ type: 'team', tenantId }, s.session.access_token)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input value={form.name} onChange={set('name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Marcus Webb" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={form.title} onChange={set('title')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Owner & Lead Technician" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea value={form.bio} onChange={set('bio')} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Short bio shown on your website…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
            <input value={form.photo_url} onChange={set('photo_url')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
            <input type="number" value={form.display_order} onChange={set('display_order')}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
