import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

type StepDef = { label: string; status: string }

const STEPS: Record<string, StepDef[]> = {
  template_launch: [
    { label: 'Queued', status: 'queued' },
    { label: 'Selecting Template', status: 'scraping' },
    { label: 'Loading Content', status: 'extracting' },
    { label: 'Deploying', status: 'deploying' },
    { label: 'QA Needed', status: 'qa_needed' },
    { label: 'Ready', status: 'ready' },
  ],
  firecrawl_migration: [
    { label: 'Queued', status: 'queued' },
    { label: 'Scraping Site', status: 'scraping' },
    { label: 'Extracting Content', status: 'extracting' },
    { label: 'Generating Site', status: 'generating' },
    { label: 'Deploying', status: 'deploying' },
    { label: 'QA Needed', status: 'qa_needed' },
    { label: 'Ready', status: 'ready' },
  ],
  full_custom: [
    { label: 'Queued', status: 'queued' },
    { label: 'Scope Review', status: 'scraping' },
    { label: 'Design Build', status: 'generating' },
    { label: 'Deploying', status: 'deploying' },
    { label: 'QA Needed', status: 'qa_needed' },
    { label: 'Ready', status: 'ready' },
  ],
}

const TERMINAL = ['ready', 'failed']
const IN_PROGRESS_STATUSES = ['scraping', 'extracting', 'generating', 'deploying']

interface Props {
  prospectId: string
  buildPath: string | null
  pipelineStage: string
}

async function logActivity(prospectId: string, actor: string, action: string, detail: string) {
  try {
    await supabase.from('prospect_activity').insert({ prospect_id: prospectId, actor, action, detail })
  } catch (e) { console.error('[activity log]', e) }
}

export default function BuildStatusWidget({ prospectId, buildPath, pipelineStage }: Props) {
  const [job, setJob]         = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('build_jobs')
      .select('*').eq('prospect_id', prospectId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    setJob(data)
    setLoading(false)
  }, [prospectId])

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load])

  async function startBuild() {
    if (!buildPath) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const actor = user?.email || 'ironwood'
    const now = new Date().toISOString()
    const { data } = await supabase.from('build_jobs')
      .insert({ prospect_id: prospectId, build_path: buildPath, status: 'queued', started_at: now })
      .select().single()
    if (data) setJob(data)
    await logActivity(prospectId, actor, 'build_started', `Build job started — path: ${buildPath}`)
    toast.success('Build job created')
    setSaving(false)
  }

  async function advanceStep() {
    if (!job) return
    setSaving(true)
    const steps = STEPS[job.build_path] || STEPS.template_launch
    const idx = steps.findIndex(s => s.status === job.status)
    const next = steps[idx + 1]
    if (!next) { setSaving(false); return }
    const updates: any = { status: next.status, current_step: next.label, updated_at: new Date().toISOString() }
    if (next.status === 'ready') updates.completed_at = new Date().toISOString()
    const { data } = await supabase.from('build_jobs').update(updates).eq('id', job.id).select().single()
    if (data) setJob(data)
    if (next.status === 'ready') {
      await logActivity(prospectId, 'system', 'build_ready', 'Build complete — ready for reveal')
      toast.success('Build marked ready!')
    }
    setSaving(false)
  }

  async function markFailed() {
    if (!job) return
    setSaving(true)
    const msg = prompt('Error message (optional):') || 'Manual failure'
    const now = new Date().toISOString()
    const { data } = await supabase.from('build_jobs')
      .update({ status: 'failed', failed_at: now, error_message: msg, updated_at: now })
      .eq('id', job.id).select().single()
    if (data) setJob(data)
    await logActivity(prospectId, 'system', 'build_failed', `Build failed: ${msg}`)
    setSaving(false)
  }

  async function retryBuild() {
    if (!job) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const actor = user?.email || 'ironwood'
    const now = new Date().toISOString()
    const { data } = await supabase.from('build_jobs')
      .insert({ prospect_id: prospectId, build_path: job.build_path, status: 'queued', started_at: now })
      .select().single()
    if (data) setJob(data)
    await logActivity(prospectId, actor, 'build_started', `Build retried — path: ${job.build_path}`)
    toast.success('Build retried')
    setSaving(false)
  }

  const canStart = ['build_ready', 'it_in_progress'].includes(pipelineStage)
  const steps = job ? (STEPS[job.build_path] || STEPS.template_launch) : []
  const currentIdx = job ? steps.findIndex(s => s.status === job.status) : -1
  const isInProgress = job && IN_PROGRESS_STATUSES.includes(job.status)
  const duration = job?.started_at && (job.completed_at || job.failed_at)
    ? Math.round((new Date(job.completed_at || job.failed_at).getTime() - new Date(job.started_at).getTime()) / 60000)
    : null

  if (loading) return null

  return (
    <div>
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-3">Build Status</h3>

      {!job && (
        <div>
          {canStart && buildPath ? (
            <button onClick={startBuild} disabled={saving}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition disabled:opacity-50">
              {saving ? 'Starting…' : '🔨 Start Build'}
            </button>
          ) : (
            <p className="text-xs text-gray-500 italic">
              {buildPath ? 'Advance to Build Ready to start.' : 'Set build path first.'}
            </p>
          )}
        </div>
      )}

      {job && (
        <div className="space-y-3">
          {/* Status badge */}
          <div className="flex items-center gap-3">
            {job.status === 'queued'    && <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">Queued</span>}
            {isInProgress               && <span className="text-xs px-2 py-0.5 rounded bg-blue-800 text-blue-200 animate-pulse">{job.current_step || 'In Progress'}…</span>}
            {job.status === 'qa_needed' && <span className="text-xs px-2 py-0.5 rounded bg-amber-800 text-amber-200">⚠ QA Required</span>}
            {job.status === 'ready'     && <span className="text-xs px-2 py-0.5 rounded bg-green-800 text-green-200">✓ Ready for Reveal</span>}
            {job.status === 'failed'    && <span className="text-xs px-2 py-0.5 rounded bg-red-900 text-red-200">✗ Build Failed</span>}
            {job.started_at && <span className="text-xs text-gray-500">Started {new Date(job.started_at).toLocaleString()}</span>}
            {duration !== null && <span className="text-xs text-gray-500">{duration}m</span>}
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
            {steps.map((s, i) => {
              const done = i < currentIdx || (job.status === 'failed' && i < currentIdx)
              const curr = i === currentIdx && job.status !== 'failed'
              const failed = i === currentIdx && job.status === 'failed'
              return (
                <div key={s.status} className="flex items-center">
                  <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                    failed ? 'bg-red-900 text-red-200' :
                    done   ? 'bg-green-700 text-white' :
                    curr   ? 'bg-blue-600 text-white' :
                             'bg-gray-800 text-gray-500'
                  }`}>
                    {done && !failed && '✓ '}{s.label}
                  </span>
                  {i < steps.length - 1 && <div className="w-2 h-px bg-gray-700 flex-shrink-0" />}
                </div>
              )
            })}
          </div>

          {job.error_message && (
            <div className="p-2 bg-red-950 border border-red-800 rounded text-xs text-red-300">{job.error_message}</div>
          )}
          {job.result_url && (
            <a href={job.result_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:underline">🔗 View result</a>
          )}

          {/* IT staff action buttons */}
          {!TERMINAL.includes(job.status) && (
            <div className="flex gap-2">
              <button onClick={advanceStep} disabled={saving}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded transition disabled:opacity-50">
                ✓ Mark Step Complete
              </button>
              <button onClick={markFailed} disabled={saving}
                className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white text-xs rounded transition disabled:opacity-50">
                ✗ Mark Failed
              </button>
            </div>
          )}
          {job.status === 'failed' && (
            <button onClick={retryBuild} disabled={saving}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition disabled:opacity-50">
              ↻ Retry Build
            </button>
          )}
        </div>
      )}
    </div>
  )
}
