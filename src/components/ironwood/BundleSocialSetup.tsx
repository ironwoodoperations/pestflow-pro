import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  tenantId: string
}

const STEPS = [
  'Client has a bundle.social account (create at bundle.social if needed)',
  'Connect client\'s Facebook page in bundle.social workspace',
  'Connect client\'s Instagram account in bundle.social workspace',
  'Copy the bundle.social Team ID from workspace settings → General',
  'Save Team ID below and confirm posts are scheduled successfully',
]

export default function BundleSocialSetup({ tenantId }: Props) {
  const [open, setOpen]         = useState(false)
  const [teamId, setTeamId]     = useState('')
  const [progress, setProgress] = useState<boolean[]>(Array(STEPS.length).fill(false))
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    if (!open) return
    async function load() {
      // Load existing team ID from integrations settings
      const { data: integ } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'integrations')
        .maybeSingle()
      if (integ?.value?.bundle_social_team_id) {
        setTeamId(integ.value.bundle_social_team_id)
      }
      // Load checklist progress
      const { data: prog } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'social_setup_progress')
        .maybeSingle()
      if (prog?.value?.steps) {
        setProgress(prog.value.steps)
      }
    }
    load()
  }, [open, tenantId])

  const saveTeamId = async () => {
    if (!teamId.trim()) return
    setSaving(true)
    try {
      // Merge into existing integrations value
      const { data: existing } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'integrations')
        .maybeSingle()
      const merged = { ...(existing?.value || {}), bundle_social_team_id: teamId.trim() }
      await supabase.from('settings').upsert(
        { tenant_id: tenantId, key: 'integrations', value: merged },
        { onConflict: 'tenant_id,key' }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const toggleStep = async (i: number) => {
    const next = progress.map((v, j) => j === i ? !v : v)
    setProgress(next)
    await supabase.from('settings').upsert(
      { tenant_id: tenantId, key: 'social_setup_progress', value: { steps: next } },
      { onConflict: 'tenant_id,key' }
    )
  }

  const allDone = progress.every(Boolean)
  const hasTeamId = !!teamId.trim()

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">📱 bundle.social Setup</span>
          {hasTeamId && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300">
              team ID saved
            </span>
          )}
          {allDone && (
            <span className="text-xs bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded">✓ complete</span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-gray-950">
          {/* Team ID input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">bundle.social Team ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                placeholder="e.g. bdbe4976-6563-431d-affd-232eba8b143a"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={saveTeamId}
                disabled={saving || !teamId.trim()}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium rounded transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Found in bundle.social workspace → Settings → General → Team ID
            </p>
          </div>

          {/* 5-step checklist */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400">Setup Checklist</p>
            {STEPS.map((step, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={progress[i]}
                  onChange={() => toggleStep(i)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className={`text-xs ${progress[i] ? 'text-emerald-400 line-through' : 'text-gray-300 group-hover:text-white'} transition`}>
                  {step}
                </span>
              </label>
            ))}
          </div>

          {allDone && hasTeamId && (
            <div className="bg-emerald-900/20 border border-emerald-700 rounded px-3 py-2">
              <p className="text-xs text-emerald-400 font-medium">✓ bundle.social setup complete</p>
              <p className="text-xs text-gray-500 mt-0.5">Social posting is enabled for this tenant.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
