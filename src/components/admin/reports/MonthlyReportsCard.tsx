import { useEffect, useState } from 'react'
import { FileText, AlertTriangle, Eye } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import MonthlyReportViewer from './MonthlyReportViewer'

// S259 — Monthly prescriptive reports. Reads tenant_reports (RLS: admin-only by
// policy, so isolation is enforced server-side). Not tier-gated: every plan that
// can see the Reports tab sees this card.
// S260-1 — "View" now opens an in-app sandboxed-iframe viewer (MonthlyReportViewer)
// instead of opening the signed URL in a tab (Supabase serves the HTML as
// text/plain, so a tab showed raw source). The viewer fetches a fresh signed URL
// each time it opens.

interface ReportRow {
  id: string
  period: string
  storage_path: string | null
  findings_count: number
  high_count: number
  status: string
  generated_at: string
}

function formatPeriod(period: string): string {
  const [y, m] = period.split('-')
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const idx = parseInt(m, 10) - 1
  return idx >= 0 && idx < 12 ? `${months[idx]} ${y}` : period
}

export default function MonthlyReportsCard() {
  const { id: tenantId } = useTenant()
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ReportRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    let active = true
    setLoading(true)
    supabase
      .from('tenant_reports')
      .select('id, period, storage_path, findings_count, high_count, status, generated_at')
      .eq('tenant_id', tenantId)
      .order('period', { ascending: false })
      .then(({ data, error: fetchErr }) => {
        if (!active) return
        if (fetchErr) setError(fetchErr.message)
        else setReports((data as ReportRow[]) ?? [])
        setLoading(false)
      })
    return () => { active = false }
  }, [tenantId])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Monthly Reports
        </h3>
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-400">Your first monthly report arrives on the 10th.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{formatPeriod(r.period)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {r.findings_count} {r.findings_count === 1 ? 'item' : 'items'} to improve
                  </span>
                  {r.high_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                      <AlertTriangle className="w-3 h-3" /> {r.high_count} high
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setError(null); setSelected(r) }}
                disabled={!r.storage_path}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                View <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <MonthlyReportViewer
          report={{
            id: selected.id,
            storage_path: selected.storage_path,
            periodLabel: formatPeriod(selected.period),
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
