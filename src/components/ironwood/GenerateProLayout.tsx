import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'
import ProLayoutSummary   from './ProLayoutSummary'
import ApplyProSiteButton from './ApplyProSiteButton'

interface Props {
  prospectId: string
  tier: string | null
  form: Partial<Prospect>
}

export default function GenerateProLayout({ prospectId, tier, form }: Props) {
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [layout, setLayout]       = useState<Record<string, any> | null>(null)
  const [expanded, setExpanded]   = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [editJson, setEditJson]   = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaved, setEditSaved] = useState(false)

  if (tier !== 'pro') return null

  // Use freshly generated layout, or fall back to persisted DB value
  const activeLayout = layout ?? form.youpest_layout ?? null
  const hasLayout    = !!activeLayout && Object.keys(activeLayout).length > 0

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setLayout(null)
    setEditMode(false)
    setEditError(null)
    setEditSaved(false)

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-youpest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: prospectId }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || data.raw || 'Generation failed')
        return
      }

      setLayout(data.layout_config)
      setEditJson(JSON.stringify(data.layout_config, null, 2))
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    setEditError(null)
    setEditSaved(false)
    let parsed: Record<string, any>
    try {
      parsed = JSON.parse(editJson.replace(/```json|```/g, '').trim())
    } catch {
      setEditError('Invalid JSON — check syntax')
      return
    }

    const { error: dbErr } = await supabase
      .from('prospects')
      .update({ youpest_layout: parsed })
      .eq('id', prospectId)

    if (dbErr) {
      setEditError('Save failed: ' + dbErr.message)
      return
    }

    setLayout(parsed)
    setEditSaved(true)
  }

  return (
    <div className="space-y-3 border border-violet-700/40 rounded-lg p-4 bg-violet-950/20">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-violet-300 text-sm">Pro Layout Generator</h4>
        <span className="text-xs bg-violet-800/50 text-violet-300 px-2 py-0.5 rounded">Pro Tier</span>
      </div>

      <p className="text-xs text-gray-400">
        Analyzes this prospect's scraped site and generates a custom youpest theme layout via Claude.
        Review before provisioning.
      </p>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-2"
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {loading ? 'Generating…' : '⚡ Generate Pro Layout'}
      </button>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded p-3">
          <p className="text-red-400 text-xs font-medium mb-1">Generation failed</p>
          <pre className="text-red-300 text-xs whitespace-pre-wrap break-all">{error}</pre>
        </div>
      )}

      {success && layout && (
        <div className="space-y-2">
          <p className="text-emerald-400 text-xs font-medium">
            ✓ Pro layout generated — review before provisioning
          </p>

          <ProLayoutSummary layoutConfig={layout} />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-gray-400 hover:text-gray-200 underline"
            >
              {expanded ? 'Collapse' : 'Expand'} layout JSON
            </button>
            <button
              onClick={() => { setEditMode(e => !e); setEditSaved(false); setEditError(null) }}
              className="text-xs text-violet-400 hover:text-violet-200 underline"
            >
              {editMode ? 'Cancel Edit' : 'Edit Layout JSON'}
            </button>
          </div>

          {expanded && !editMode && (
            <pre className="bg-gray-950 border border-gray-700 rounded p-3 text-xs text-green-300 font-mono whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
              {JSON.stringify(layout, null, 2)}
            </pre>
          )}

          {editMode && (
            <div className="space-y-2">
              <textarea
                value={editJson}
                onChange={e => { setEditJson(e.target.value); setEditSaved(false); setEditError(null) }}
                className="w-full h-72 bg-gray-950 border border-gray-600 rounded p-3 text-xs text-green-300 font-mono resize-y focus:outline-none focus:border-violet-500"
                spellCheck={false}
              />
              {editError && <p className="text-red-400 text-xs">{editError}</p>}
              {editSaved && <p className="text-emerald-400 text-xs">✓ Saved</p>}
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-medium rounded transition"
              >
                Save Edits
              </button>
            </div>
          )}
        </div>
      )}

      {/* Always show Apply button when a layout exists (fresh or from DB) */}
      {hasLayout && !form.provisioned_at && (
        <div className="pt-2 border-t border-violet-700/30">
          <p className="text-xs text-gray-500 mb-2">Layout ready — provision the Pro site:</p>
          <ApplyProSiteButton
            prospectId={prospectId}
            form={form}
            layout={activeLayout!}
          />
        </div>
      )}

      {/* Persisted layout indicator when no fresh generation */}
      {!success && form.youpest_layout && Object.keys(form.youpest_layout).length > 0 && (
        <p className="text-xs text-violet-400">
          ✓ Layout saved — click Generate to regenerate or Apply to provision.
        </p>
      )}
    </div>
  )
}
