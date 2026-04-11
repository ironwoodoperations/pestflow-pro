import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { notifyTeamsFromClient } from '../../lib/teamsNotify'

export const PIPELINE_STAGES = [
  { id: 'lead_closed',     label: 'Lead Closed' },
  { id: 'intake_complete', label: 'Intake Complete' },
  { id: 'build_ready',     label: 'Build Ready' },
  { id: 'it_in_progress',  label: 'IT In Progress' },
  { id: 'reveal_ready',    label: 'Reveal Ready' },
  { id: 'live',            label: 'Live ✓' },
]

const GATED_STAGE = 'reveal_ready'

interface Props {
  prospectId: string
  stage: string
  qaPassedAt?: string | null
  companyName?: string
  buildPath?: string | null
  onChanged: (stage: string) => void
}

export default function PipelineStage({ prospectId, stage, qaPassedAt, companyName, buildPath, onChanged }: Props) {
  const [pending, setPending] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [gateMsg, setGateMsg] = useState(false)

  const currentIdx = PIPELINE_STAGES.findIndex(s => s.id === stage)

  async function confirm() {
    if (!pending) return
    setSaving(true)
    await supabase.from('prospects').update({ pipeline_stage: pending }).eq('id', prospectId)
    onChanged(pending)
    toast.success(`Moved to ${PIPELINE_STAGES.find(s => s.id === pending)?.label}`)
    if (pending === 'it_in_progress' && companyName) {
      const path = buildPath ? ` (${buildPath.replace(/_/g, ' ')})` : ''
      notifyTeamsFromClient(`🔨 Build started: ${companyName}${path} — assigned to IT`)
    }
    setPending(null)
    setSaving(false)
  }

  function handleClick(stageId: string) {
    if (stageId === stage) return
    if (stageId === GATED_STAGE) {
      const alreadyPast = currentIdx > PIPELINE_STAGES.findIndex(s => s.id === GATED_STAGE)
      if (!qaPassedAt && !alreadyPast) {
        setGateMsg(true)
        setTimeout(() => setGateMsg(false), 3000)
        return
      }
    }
    setPending(stageId)
  }

  return (
    <div>
      <div className="flex items-center overflow-x-auto pb-1 gap-0.5">
        {PIPELINE_STAGES.map((s, i) => {
          const isDone    = i < currentIdx
          const isCurrent = i === currentIdx
          const isGated   = s.id === GATED_STAGE
          const qaLocked  = isGated && !qaPassedAt && currentIdx <= i
          const gatedTitle = qaLocked
            ? 'Complete QA checklist first'
            : isGated ? 'QA gate — complete checklist to unlock' : undefined
          return (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => handleClick(s.id)}
                title={gatedTitle}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  isCurrent   ? 'bg-blue-600 text-white' :
                  isDone      ? 'bg-green-500 text-white' :
                  qaLocked    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60' :
                                'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {isDone && <span className="mr-1">✓</span>}
                {s.label}
                {qaLocked && <span className="ml-1">🔒</span>}
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="w-2.5 h-px bg-gray-600 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {gateMsg && (
        <p className="text-xs text-amber-400 mt-1.5">
          Complete the QA checklist first to advance to Reveal Ready
        </p>
      )}

      {pending && (
        <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg">
          <span className="text-xs text-gray-300">
            Move to <strong className="text-white">{PIPELINE_STAGES.find(s => s.id === pending)?.label}</strong>?
          </span>
          <button onClick={confirm} disabled={saving}
            className="px-2.5 py-0.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50">
            {saving ? '…' : 'Confirm'}
          </button>
          <button onClick={() => setPending(null)}
            className="px-2.5 py-0.5 bg-gray-700 text-white text-xs rounded hover:bg-gray-600">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
