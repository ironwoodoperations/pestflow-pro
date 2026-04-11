import { useState } from 'react'

export type MatchType = 'exact' | 'slug_change' | 'no_match' | 'backlink'

export interface RedirectRow {
  id: string
  old_url: string
  new_url: string
  match_type: MatchType
  has_backlinks: boolean
  notes: string
  page_title?: string
}

const MATCH_BADGE: Record<MatchType, { label: string; cls: string }> = {
  exact:       { label: 'exact',      cls: 'bg-emerald-900/50 text-emerald-400 border-emerald-700' },
  slug_change: { label: 'slug change',cls: 'bg-blue-900/50 text-blue-400 border-blue-700' },
  no_match:    { label: 'no match',   cls: 'bg-amber-900/50 text-amber-400 border-amber-700' },
  backlink:    { label: 'backlink!',  cls: 'bg-red-900/50 text-red-400 border-red-700' },
}

const STANDARD_ROUTES = [
  '/', '/about', '/pest-control', '/termite-control', '/termite-inspections',
  '/mosquito-control', '/rodent-control', '/ant-control', '/spider-control',
  '/roach-control', '/bed-bug-control', '/flea-tick-control', '/wasp-hornet-control',
  '/scorpion-control', '/contact', '/quote', '/blog', '/faq', '/reviews', '/service-area',
]

function deriveMatchType(row: RedirectRow): MatchType {
  if (row.has_backlinks) return 'backlink'
  if (row.old_url === row.new_url) return 'exact'
  if (row.new_url === '/') return 'no_match'
  return 'slug_change'
}

interface Props {
  rows: RedirectRow[]
  customRoutes: string[]
  onChange: (rows: RedirectRow[]) => void
}

export default function RedirectMapTable({ rows, customRoutes, onChange }: Props) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})

  const allRoutes = [...STANDARD_ROUTES, ...customRoutes.filter(r => !STANDARD_ROUTES.includes(r))]

  function updateRow(id: string, patch: Partial<RedirectRow>) {
    const updated = rows.map(r => {
      if (r.id !== id) return r
      const next = { ...r, ...patch }
      next.match_type = deriveMatchType(next)
      return next
    })
    onChange(updated)
  }

  function deleteRow(id: string) {
    onChange(rows.filter(r => r.id !== id))
  }

  function addRow() {
    const id = crypto.randomUUID()
    const newRow: RedirectRow = {
      id, old_url: '', new_url: '/', match_type: 'no_match',
      has_backlinks: false, notes: '',
    }
    onChange([...rows, newRow])
  }

  return (
    <div className="space-y-2">
      {/* Table header */}
      {rows.length > 0 && (
        <div className="grid grid-cols-[2fr_2fr_1fr_auto_auto_auto] gap-2 text-xs text-gray-500 px-1">
          <span>Old URL</span>
          <span>New URL</span>
          <span>Type</span>
          <span>Links</span>
          <span>Notes</span>
          <span />
        </div>
      )}

      {rows.map(row => {
        const badge = MATCH_BADGE[row.match_type]
        const isCustom = customInputs[row.id] !== undefined

        return (
          <div key={row.id} className="grid grid-cols-[2fr_2fr_1fr_auto_auto_auto] gap-2 items-center bg-gray-800/60 rounded px-2 py-1.5">
            {/* Old URL */}
            <div className="min-w-0">
              {row.page_title && (
                <div className="text-xs text-gray-500 truncate mb-0.5">{row.page_title}</div>
              )}
              <input
                value={row.old_url}
                onChange={e => updateRow(row.id, { old_url: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-300 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* New URL — dropdown + optional custom text */}
            <div className="min-w-0">
              {isCustom ? (
                <div className="flex gap-1">
                  <input
                    value={customInputs[row.id]}
                    onChange={e => {
                      const val = e.target.value
                      setCustomInputs(c => ({ ...c, [row.id]: val }))
                      updateRow(row.id, { new_url: val })
                    }}
                    placeholder="/custom-path"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => setCustomInputs(c => { const n = { ...c }; delete n[row.id]; return n })}
                    className="text-xs text-gray-500 hover:text-gray-300 px-1"
                  >↩</button>
                </div>
              ) : (
                <select
                  value={allRoutes.includes(row.new_url) ? row.new_url : '__custom__'}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setCustomInputs(c => ({ ...c, [row.id]: row.new_url }))
                    } else {
                      updateRow(row.id, { new_url: e.target.value })
                    }
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {allRoutes.map(r => <option key={r} value={r}>{r}</option>)}
                  <option value="__custom__">Custom…</option>
                </select>
              )}
            </div>

            {/* Match type badge */}
            <span className={`px-1.5 py-0.5 text-xs rounded border whitespace-nowrap ${badge.cls}`}>
              {badge.label}
            </span>

            {/* Backlinks checkbox */}
            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={row.has_backlinks}
                onChange={e => updateRow(row.id, { has_backlinks: e.target.checked })}
                className="accent-red-500"
              />
              <span className="hidden">links</span>
            </label>

            {/* Notes */}
            <input
              value={row.notes}
              onChange={e => updateRow(row.id, { notes: e.target.value })}
              placeholder="notes…"
              className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500 w-28"
            />

            {/* Delete */}
            <button onClick={() => deleteRow(row.id)}
              className="text-gray-600 hover:text-red-400 transition text-base leading-none px-1">×</button>
          </div>
        )
      })}

      <button onClick={addRow}
        className="text-xs text-gray-500 hover:text-gray-300 transition px-2 py-1 border border-dashed border-gray-700 rounded w-full">
        + Add Row manually
      </button>
    </div>
  )
}
