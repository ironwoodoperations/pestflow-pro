import { useState, useEffect } from 'react'
import type { SocialPost } from './useSocialData'

interface Props {
  post: SocialPost | null
  onClose: () => void
  onSave: (postId: string, updates: { caption: string; scheduled_for: string | null; status: string }) => Promise<void>
}

const platformLabels: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', both: 'FB + IG',
}

export default function EditPostModal({ post, onClose, onSave }: Props) {
  const [form, setForm] = useState({ caption: '', scheduledFor: '', status: 'draft', scheduleMode: 'now' as 'now' | 'schedule' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!post) return
    setForm({
      caption: post.caption,
      scheduledFor: post.scheduled_for ? post.scheduled_for.substring(0, 16) : '',
      status: post.status,
      scheduleMode: post.scheduled_for ? 'schedule' : 'now',
    })
    setError('')
  }, [post])

  if (!post) return null

  const charMax = post.platform === 'facebook' ? 63206 : 2200

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await onSave(post!.id, {
        caption: form.caption,
        scheduled_for: form.scheduleMode === 'schedule' && form.scheduledFor
          ? new Date(form.scheduledFor).toISOString() : null,
        status: form.status,
      })
    } catch {
      setError('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Post</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            {platformLabels[post.platform] || post.platform}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Caption</label>
            <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))}
              rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400 text-right mt-0.5">{form.caption.length}/{charMax}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Schedule</label>
            <div className="flex gap-3">
              {(['now', 'schedule'] as const).map(m => (
                <label key={m} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="schedMode" checked={form.scheduleMode === m}
                    onChange={() => setForm(p => ({ ...p, scheduleMode: m }))} className="accent-emerald-600" />
                  {m === 'now' ? 'Post Now' : 'Schedule'}
                </label>
              ))}
            </div>
            {form.scheduleMode === 'schedule' && (
              <input type="datetime-local" value={form.scheduledFor}
                onChange={e => setForm(p => ({ ...p, scheduledFor: e.target.value }))}
                className="mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white w-full">
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
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
