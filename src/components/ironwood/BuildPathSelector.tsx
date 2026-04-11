import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

const PATHS = [
  {
    id:    'template_launch',
    icon:  '🟢',
    label: 'Template Launch',
    desc:  'New business or simple setup. Fastest path.',
    cls:   'border-green-500 bg-green-950/30',
  },
  {
    id:    'firecrawl_migration',
    icon:  '🔵',
    label: 'Firecrawl Migration',
    desc:  'Has existing site we scrape + rebuild from scratch.',
    cls:   'border-blue-500 bg-blue-950/30',
  },
  {
    id:    'full_custom',
    icon:  '🟣',
    label: 'Full Custom Rebuild',
    desc:  'Complete redesign + full dashboard. Pro/Elite only.',
    cls:   'border-purple-500 bg-purple-950/30',
  },
]

interface Props {
  prospectId: string
  buildPath: string | null
  customScopeNotes: string | null
  onChanged: (path: string | null, notes?: string) => void
}

export default function BuildPathSelector({ prospectId, buildPath, customScopeNotes, onChanged }: Props) {
  const [changing, setChanging] = useState(false)
  const [notes, setNotes]       = useState(customScopeNotes || '')
  const [saving, setSaving]     = useState(false)

  async function selectPath(pathId: string) {
    setSaving(true)
    const now = new Date().toISOString()
    await supabase.from('prospects')
      .update({ build_path: pathId, build_path_set_at: now })
      .eq('id', prospectId)
    onChanged(pathId)
    toast.success(`Build path: ${PATHS.find(p => p.id === pathId)?.label}`)
    setChanging(false)
    setSaving(false)
  }

  async function saveNotes(val: string) {
    await supabase.from('prospects').update({ custom_scope_notes: val }).eq('id', prospectId)
    onChanged(buildPath, val)
  }

  const selected = PATHS.find(p => p.id === buildPath)
  const showCards = !buildPath || changing

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-gray-200 pb-1 flex-1 border-b border-gray-700">Build Path</h3>
        {buildPath && !changing && (
          <button
            onClick={() => setChanging(true)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Change
          </button>
        )}
      </div>

      {showCards ? (
        <div className="grid grid-cols-3 gap-2">
          {PATHS.map(p => (
            <button
              key={p.id}
              onClick={() => selectPath(p.id)}
              disabled={saving}
              className={`text-left p-3 rounded-lg border-2 transition disabled:opacity-50 ${
                buildPath === p.id
                  ? p.cls
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="text-base mb-1">{p.icon}</div>
              <div className="text-xs font-semibold text-white mb-0.5">{p.label}</div>
              <div className="text-xs text-gray-400 leading-snug">{p.desc}</div>
              {buildPath === p.id && (
                <div className="mt-1.5 text-xs text-emerald-400 font-medium">✓ Selected</div>
              )}
            </button>
          ))}
        </div>
      ) : selected ? (
        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 ${selected.cls}`}>
          <span className="text-base">{selected.icon}</span>
          <span className="text-sm font-semibold text-white">{selected.label}</span>
        </div>
      ) : null}

      {buildPath === 'full_custom' && (
        <div className="mt-3">
          <label className="text-xs text-gray-400 block mb-1">Custom Scope Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={e => saveNotes(e.target.value)}
            rows={3}
            placeholder="Describe custom scope, special requirements, design references..."
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>
      )}
    </div>
  )
}
