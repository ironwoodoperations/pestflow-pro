import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { notifyTeamsFromClient } from '../../lib/teamsNotify'

const QA_ITEMS: { field: string; label: string }[] = [
  { field: 'site_reachable',            label: 'Site is reachable on live or preview URL' },
  { field: 'admin_login_works',         label: 'Admin login tested and working' },
  { field: 'lead_form_submits',         label: 'Lead form submits successfully' },
  { field: 'email_notifications_fire',  label: 'Email notifications firing correctly' },
  { field: 'sms_notifications_fire',    label: 'SMS notifications firing correctly' },
  { field: 'domain_connected',          label: 'Domain connected in Vercel' },
  { field: 'mobile_check_passed',       label: 'Mobile layout checked' },
  { field: 'content_proofed',           label: 'Content proofed (no placeholders, no "TEST TEST")' },
  { field: 'credentials_package_ready', label: 'Customer credentials package ready' },
]

interface Props {
  prospectId: string
  pipelineStage: string
  companyName: string
  onRevealReady: (passedAt: string) => void
}

export default function QAGate({ prospectId, pipelineStage, companyName, onRevealReady }: Props) {
  const [qa, setQa]       = useState<Record<string, any> | null>(null)
  const [saving, setSaving] = useState(false)
  const [moving, setMoving] = useState(false)
  const notesTimer          = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const visible = ['it_in_progress', 'reveal_ready'].includes(pipelineStage)

  const load = useCallback(async () => {
    const { data } = await supabase.from('qa_checklists')
      .select('*').eq('prospect_id', prospectId).maybeSingle()
    setQa(data)
  }, [prospectId])

  useEffect(() => { if (visible) load() }, [visible, load])

  async function initChecklist() {
    const { data } = await supabase.from('qa_checklists')
      .insert({ prospect_id: prospectId }).select().single()
    if (data) setQa(data)
  }

  async function toggleCheck(field: string) {
    if (!qa) return
    const next = !qa[field]
    const patch: Record<string, any> = { [field]: next, updated_at: new Date().toISOString() }
    setSaving(true)
    const { data } = await supabase.from('qa_checklists')
      .update(patch).eq('prospect_id', prospectId).select().single()
    if (data) setQa(data)
    setSaving(false)
  }

  function saveNotesDebounced(val: string) {
    setQa(q => q ? { ...q, reveal_notes: val } : q)
    clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      await supabase.from('qa_checklists')
        .update({ reveal_notes: val, updated_at: new Date().toISOString() })
        .eq('prospect_id', prospectId)
    }, 500)
  }

  async function moveToRevealReady() {
    if (!qa?.qa_passed_at) return
    setMoving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const actor = user?.email || 'ironwood'
    await supabase.from('qa_checklists')
      .update({ qa_passed_by: actor }).eq('prospect_id', prospectId)
    await supabase.from('prospects')
      .update({ pipeline_stage: 'reveal_ready' }).eq('id', prospectId)
    try {
      await supabase.from('prospect_activity').insert({
        prospect_id: prospectId, actor, action: 'qa_passed',
        detail: 'QA checklist complete — moved to Reveal Ready',
      })
    } catch (e) { console.error('[activity log]', e) }
    notifyTeamsFromClient(`✅ QA passed: ${companyName} is ready for reveal call`)
    toast.success(`${companyName} moved to Reveal Ready`)
    onRevealReady(qa.qa_passed_at)
    setMoving(false)
  }

  if (!visible) return null

  if (!qa) {
    return (
      <div>
        <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-3">QA Checklist</h3>
        <button onClick={initChecklist}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition">
          Initialize QA Checklist
        </button>
      </div>
    )
  }

  const passed = QA_ITEMS.filter(i => qa[i.field]).length
  const total  = QA_ITEMS.length
  const allDone = passed === total

  return (
    <div>
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-3">QA Checklist</h3>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{passed} / {total} checks passed</span>
          {qa.qa_passed_at && <span className="text-emerald-400">✓ QA Complete</span>}
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(passed / total) * 100}%` }} />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2 mb-4">
        {QA_ITEMS.map(item => (
          <label key={item.field} className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!qa[item.field]}
              onChange={() => toggleCheck(item.field)}
              disabled={saving}
              className="mt-0.5 flex-shrink-0 accent-emerald-500"
            />
            <span className={`text-xs ${qa[item.field] ? 'text-gray-300' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </label>
        ))}
      </div>

      {/* Reveal notes */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 block mb-1">Reveal Notes</label>
        <textarea
          value={qa.reveal_notes || ''}
          onChange={e => saveNotesDebounced(e.target.value)}
          rows={2}
          placeholder="Notes for the reveal call..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* QA complete banner */}
      {allDone && pipelineStage !== 'reveal_ready' && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
          <p className="text-sm text-emerald-300 font-medium mb-2">
            ✓ QA Complete — Ready to advance to Reveal Queue
          </p>
          <button onClick={moveToRevealReady} disabled={moving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {moving ? 'Moving…' : 'Move to Reveal Ready →'}
          </button>
        </div>
      )}
    </div>
  )
}
