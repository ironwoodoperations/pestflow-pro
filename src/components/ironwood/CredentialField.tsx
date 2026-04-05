import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  label: string
  hint: string
  tenantId: string
  settingKey: string
  onSaved?: () => void
}

export default function CredentialField({ label, hint, tenantId, settingKey, onSaved }: Props) {
  const [val, setVal]       = useState('')
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!val.trim()) return
    setSaving(true)
    const { data: existing } = await supabase
      .from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
    const current = (existing?.value as Record<string, string>) || {}
    await supabase.from('settings').upsert(
      { tenant_id: tenantId, key: 'integrations', value: { ...current, [settingKey]: val } },
      { onConflict: 'tenant_id,key' }
    )
    setSaving(false)
    setSaved(true)
    onSaved?.()
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-300">{label}</label>
      <p className="text-xs text-gray-500">{hint}</p>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
          type="text"
          placeholder="Paste token…"
          value={val}
          onChange={e => { setVal(e.target.value); setSaved(false) }}
        />
        <button
          onClick={save}
          disabled={saving || !val.trim()}
          className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500 disabled:opacity-50 shrink-0"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
      {saved && <p className="text-xs text-emerald-400">✓ Token saved to client settings</p>}
    </div>
  )
}
