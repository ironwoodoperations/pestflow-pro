import { useEffect, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

// S260-1 — In-app monthly report viewer (v1). Supabase Storage serves the report
// HTML as text/plain, so opening the signed URL in a tab shows raw source. Instead
// we fetch the HTML string ONCE from a short-lived signed URL, hold it in state,
// and render it inside a BARE-sandbox iframe via srcDoc. The empty sandbox gives the
// frame an opaque/null origin (so the parent CSP can't cascade in and strip styles)
// while blocking scripts entirely. v1 has no PDF/download — that is v1.1.

interface Props {
  report: { id: string; storage_path: string | null; periodLabel: string }
  onClose: () => void
}

export default function MonthlyReportViewer({ report, onClose }: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!report.storage_path) throw new Error('no-path')
        // Fresh signed URL on every open — it expires (~60s), so we read it ONCE
        // below and never re-fetch. All rendering uses the in-memory string.
        const { data, error: signErr } = await supabase.storage
          .from('reports')
          .createSignedUrl(report.storage_path, 60)
        if (signErr || !data?.signedUrl) throw new Error('sign-failed')
        const res = await fetch(data.signedUrl)
        if (!res.ok) throw new Error(`http-${res.status}`)
        const text = await res.text() // read the body exactly once
        if (!active) return
        setHtml(text)
      } catch {
        if (active) setError("We couldn't load this report. Please close and try again.")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [report.id, report.storage_path])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200 shrink-0">
          <span className="text-sm font-semibold text-gray-900">
            {report.periodLabel} — Monthly SEO Report
          </span>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-gray-50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <iframe
              // SECURITY: never add allow-scripts
              sandbox=""
              srcDoc={html ?? ''}
              title="Monthly SEO Report"
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
