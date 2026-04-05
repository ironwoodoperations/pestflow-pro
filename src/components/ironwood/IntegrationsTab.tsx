import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Integration {
  id: string
  key: string
  label: string
  value: string | null
  category: string
  is_secret: boolean
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  platform: 'Platform',
  social: 'Social',
  seo: 'SEO',
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
  )
}

export default function IntegrationsTab() {
  const [rows, setRows]           = useState<Integration[]>([])
  const [editing, setEditing]     = useState<Record<string, string>>({})
  const [saving, setSaving]       = useState<string | null>(null)

  useEffect(() => {
    supabase.from('ironwood_integrations').select('*').order('category').order('label').then(({ data }) => {
      if (data) setRows(data)
    })
  }, [])

  const saveValue = async (row: Integration) => {
    const val = editing[row.key] ?? row.value ?? ''
    setSaving(row.key)
    await supabase.from('ironwood_integrations')
      .update({ value: val || null, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    setRows(r => r.map(x => x.id === row.id ? { ...x, value: val || null } : x))
    setEditing(e => { const n = { ...e }; delete n[row.key]; return n })
    setSaving(null)
  }

  const grouped = rows.reduce<Record<string, Integration[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Integrations</h2>
      </div>

      {/* Banner */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg px-4 py-3 text-sm text-blue-200">
        <strong>Platform credentials are managed in Doppler</strong> and injected at runtime.
        Secret keys are never stored in this database. This panel shows configuration status
        and stores non-sensitive reference values only.
      </div>

      {/* Platform key sections */}
      {(['platform', 'social', 'seo'] as const).map(cat => (
        <section key={cat}>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {CATEGORY_LABELS[cat]}
          </h3>
          <div className="space-y-2">
            {(grouped[cat] || []).map(row => (
              <div key={row.key} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot active={!!row.value} />
                    <span className="text-sm text-white font-medium truncate">{row.label}</span>
                    <span className="text-xs text-gray-500 font-mono shrink-0">{row.key}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {row.is_secret ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                        Configured in Doppler
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white w-48 focus:outline-none focus:border-emerald-500"
                          placeholder="Enter value…"
                          value={editing[row.key] ?? row.value ?? ''}
                          onChange={e => setEditing(ed => ({ ...ed, [row.key]: e.target.value }))}
                        />
                        {(editing[row.key] !== undefined) && (
                          <button
                            onClick={() => saveValue(row)}
                            disabled={saving === row.key}
                            className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {saving === row.key ? 'Saving…' : 'Save'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Per-client credentials (display only) */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Per-Client Required Credentials
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          These are collected per client during the reveal call and stored in each client's encrypted tenant settings.
        </p>
        <div className="space-y-2">
          {[
            'Facebook Page Access Token — collected in Prospect Detail → Provisioning',
            'Google Business Profile Token — collected in Prospect Detail → Provisioning',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800/50 border border-gray-700/50 rounded px-4 py-2">
              <span className="text-emerald-400">✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
