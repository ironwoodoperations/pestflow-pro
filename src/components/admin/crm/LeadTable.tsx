import React from 'react'
import { Mail, Phone } from 'lucide-react'
import type { Lead } from './types'
import { STATUSES, STATUS_BADGE, PER_PAGE } from './types'

interface Props {
  loading: boolean
  paginated: Lead[]
  filtered: Lead[]
  page: number
  totalPages: number
  notesOpenId: string | null
  notesDraft: Record<string, string>
  notesSaved: Record<string, boolean>
  showArchived?: boolean
  onUpdateStatus: (id: string, status: string) => void
  onToggleNotes: (lead: Lead) => void
  onNotesDraftChange: (id: string, val: string) => void
  onNotesSave: (id: string) => void
  onPageChange: (fn: (p: number) => number) => void
  onView: (lead: Lead) => void
  onArchive?: (lead: Lead) => void
  onRestore?: (lead: Lead) => void
  onDeletePermanently?: (lead: Lead) => void
}

export default function LeadTable({ loading, paginated, filtered, page, totalPages, notesOpenId, notesDraft, notesSaved, showArchived, onUpdateStatus, onToggleNotes, onNotesDraftChange, onNotesSave, onPageChange, onView, onArchive, onRestore, onDeletePermanently }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="rounded-lg bg-gray-200 animate-pulse h-16 w-full" />)}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {['Name', 'Contact', 'Services', 'Message', 'Status', 'Date', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.map(l => (
            <React.Fragment key={l.id}>
              <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{l.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {l.email && (
                      <a href={`mailto:${l.email}?subject=Following up on your quote request&body=Hi ${encodeURIComponent(l.name)},%0A%0A`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors w-fit"
                        title={`Email ${l.name}`}>
                        <Mail size={11} /> {l.email}
                      </a>
                    )}
                    {l.phone && (
                      <a href={`tel:${l.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors w-fit"
                        title={`Call ${l.name}`}>
                        <Phone size={11} /> {l.phone}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[120px] truncate">{Array.isArray(l.services) ? l.services.join(', ') : (l.services || '—')}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">{l.message?.slice(0, 60) || '—'}</td>
                <td className="px-4 py-3">
                  <select value={l.status || 'new'} onChange={e => onUpdateStatus(l.id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-emerald-500 cursor-pointer ${STATUS_BADGE[l.status || 'new'] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {showArchived ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => onRestore?.(l)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Restore</button>
                      <button onClick={() => onDeletePermanently?.(l)} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => onToggleNotes(l)} className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors" title="Add/view notes">📝</button>
                      <button onClick={() => onView(l)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">View</button>
                      <button onClick={() => onArchive?.(l)} className="text-xs text-yellow-600 hover:text-yellow-700 font-medium" title="Archive lead">Archive</button>
                    </div>
                  )}
                </td>
              </tr>
              {notesOpenId === l.id && (
                <tr className="bg-amber-50 border-b border-amber-100">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <textarea
                          value={notesDraft[l.id] ?? l.notes ?? ''}
                          onChange={e => onNotesDraftChange(l.id, e.target.value)}
                          onBlur={() => onNotesSave(l.id)}
                          rows={2}
                          placeholder="Add a note about this lead..."
                          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-gray-400 resize-none bg-white max-h-[120px] overflow-y-auto"
                        />
                        {notesSaved[l.id] && <p className="text-xs text-emerald-600 mt-1">Saved ✓</p>}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {paginated.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No leads found.</td></tr>
          )}
        </tbody>
      </table>
      {filtered.length > PER_PAGE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length} leads</p>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(p => Math.max(0, p - 1))} disabled={page === 0} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded text-sm disabled:opacity-40">Prev</button>
            <button onClick={() => onPageChange(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
