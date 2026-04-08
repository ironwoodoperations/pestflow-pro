import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  prospectId: string
  tier: string | null
}

export default function GenerateProLayout({ prospectId, tier }: Props) {
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [layout, setLayout]             = useState<Record<string, any> | null>(null)
  const [expanded, setExpanded]         = useState(false)

  if (tier !== 'pro') return null

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setLayout(null)

    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: r } = await supabase.auth.refreshSession()
        session = r.session
      }

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
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 border border-violet-700/40 rounded-lg p-4 bg-violet-950/20">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-violet-300 text-sm">Pro Layout Generator</h4>
        <span className="text-xs bg-violet-800/50 text-violet-300 px-2 py-0.5 rounded">Pro Tier</span>
      </div>

      <p className="text-xs text-gray-400">
        Analyzes this prospect's scraped site and generates a custom youpest shell layout via Claude.
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
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-gray-400 hover:text-gray-200 underline"
          >
            {expanded ? 'Collapse' : 'Expand'} layout JSON
          </button>
          {expanded && (
            <pre className="bg-gray-950 border border-gray-700 rounded p-3 text-xs text-green-300 font-mono whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
              {JSON.stringify(layout, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
