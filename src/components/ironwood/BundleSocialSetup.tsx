import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  tenantId: string
}

// Late (getlate.dev) per-platform account IDs stored in settings.integrations.late_accounts
const PLATFORMS = [
  { key: 'facebook',        label: 'Facebook',        placeholder: 'e.g. acc_abc123' },
  { key: 'instagram',       label: 'Instagram',       placeholder: 'e.g. acc_def456' },
  { key: 'youtube',         label: 'YouTube',         placeholder: 'e.g. acc_ghi789' },
  { key: 'google_business', label: 'Google Business', placeholder: 'e.g. acc_jkl012' },
]

const STEPS = [
  'Log in to Late dashboard (getlate.dev)',
  'Connect client\'s Facebook page via Late OAuth',
  'Connect client\'s Instagram account via Late OAuth',
  'Copy each Account ID from Late dashboard → Accounts',
  'Paste each Account ID below and save',
]

type LateAccounts = Record<string, string>

export default function BundleSocialSetup({ tenantId }: Props) {
  const [open, setOpen]         = useState(false)
  const [accounts, setAccounts] = useState<LateAccounts>({
    facebook: '', instagram: '', youtube: '', google_business: '',
  })
  const [progress, setProgress] = useState<boolean[]>(Array(STEPS.length).fill(false))
  const [saving, setSaving]     = useState<string | null>(null)
  const [savedPlatform, setSavedPlatform] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    async function load() {
      // Load existing Late account IDs from integrations settings
      const { data: integ } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'integrations')
        .maybeSingle()
      if (integ?.value?.late_accounts) {
        setAccounts(prev => ({ ...prev, ...integ.value.late_accounts }))
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

  const savePlatformId = async (platformKey: string) => {
    const accountId = accounts[platformKey]?.trim()
    if (!accountId) return
    setSaving(platformKey)
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'integrations')
        .maybeSingle()
      const currentInteg = existing?.value || {}
      const currentLate = currentInteg.late_accounts || {}
      const merged = { ...currentInteg, late_accounts: { ...currentLate, [platformKey]: accountId } }
      await supabase.from('settings').upsert(
        { tenant_id: tenantId, key: 'integrations', value: merged },
        { onConflict: 'tenant_id,key' }
      )
      setSavedPlatform(platformKey)
      setTimeout(() => setSavedPlatform(null), 2000)
    } finally {
      setSaving(null)
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
  const connectedCount = PLATFORMS.filter(p => !!accounts[p.key]?.trim()).length

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">📱 Social Media Setup (Late)</span>
          {connectedCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300">
              {connectedCount} account{connectedCount !== 1 ? 's' : ''} connected
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
          {/* Per-platform Late Account ID inputs */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-400">Late Account IDs (getlate.dev)</label>
            {PLATFORMS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-gray-500">{label}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accounts[key] ?? ''}
                    onChange={e => setAccounts(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={() => savePlatformId(key)}
                    disabled={saving === key || !accounts[key]?.trim()}
                    className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium rounded transition disabled:opacity-50"
                  >
                    {saving === key ? 'Saving…' : savedPlatform === key ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500">
              Found in Late dashboard → Accounts → copy the Account ID for each connected platform.
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

          {allDone && connectedCount > 0 && (
            <div className="bg-emerald-900/20 border border-emerald-700 rounded px-3 py-2">
              <p className="text-xs text-emerald-400 font-medium">✓ Social media setup complete</p>
              <p className="text-xs text-gray-500 mt-0.5">Social posting via Late is enabled for this tenant.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
