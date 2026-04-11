import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const ACTION_ICON: Record<string, string> = {
  stage_changed:      '🔄',
  build_started:      '🔨',
  build_failed:       '❌',
  build_ready:        '✅',
  note_added:         '📝',
  intake_submitted:   '📋',
  invoice_sent:       '💰',
  payment_confirmed:  '💳',
}

function relativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)    return 'just now'
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

interface ActivityEntry {
  id: string
  actor: string
  action: string
  detail: string | null
  created_at: string
}

interface Props {
  prospectId: string
}

export default function ActivityLog({ prospectId }: Props) {
  const [entries, setEntries]   = useState<ActivityEntry[]>([])
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('prospect_activity')
      .select('id, actor, action, detail, created_at')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setEntries(data)
  }, [prospectId])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  async function addNote() {
    const text = note.trim()
    if (!text) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const actor = user?.email || 'ironwood'
    try {
      await supabase.from('prospect_activity').insert({
        prospect_id: prospectId,
        actor,
        action: 'note_added',
        detail: text,
      })
      setNote('')
      await load()
    } catch (e) { console.error('[activity log]', e) }
    setSaving(false)
  }

  const formatActor = (actor: string) =>
    actor === 'system' ? 'System' : actor.split('@')[0]

  return (
    <div>
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-3">Activity Log</h3>

      {/* Add note */}
      <div className="mb-4 space-y-2">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
        <button
          onClick={addNote}
          disabled={saving || !note.trim()}
          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded transition disabled:opacity-50"
        >
          {saving ? 'Saving…' : '+ Add Note'}
        </button>
      </div>

      {/* Timeline */}
      {entries.length === 0 && (
        <p className="text-xs text-gray-500 italic">No activity yet.</p>
      )}
      <div className="space-y-0">
        {entries.map((e, i) => (
          <div key={e.id} className="flex gap-3">
            {/* Line + icon */}
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                {ACTION_ICON[e.action] || '📌'}
              </div>
              {i < entries.length - 1 && (
                <div className="w-px flex-1 bg-gray-800 min-h-3" />
              )}
            </div>
            {/* Content */}
            <div className="pb-3 min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-300">{formatActor(e.actor)}</span>
                <span className="text-xs text-gray-500">{relativeTime(e.created_at)}</span>
              </div>
              {e.detail && (
                <p className="text-xs text-gray-400 mt-0.5 break-words">{e.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
