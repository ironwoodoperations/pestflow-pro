import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Download, Users, Inbox, FileText, CheckCircle, Phone, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'

interface Lead {
  id: string; name: string; email: string; phone: string; services: string[] | null
  message: string; status: string; notes?: string; created_at: string
}

type Status = 'new' | 'contacted' | 'quoted' | 'won' | 'lost'
const STATUSES: Status[] = ['new', 'contacted', 'quoted', 'won', 'lost']
const PER_PAGE = 25

const statusBadge: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', contacted: 'bg-amber-100 text-amber-700',
  quoted: 'bg-purple-100 text-purple-700', won: 'bg-emerald-100 text-emerald-700', lost: 'bg-gray-100 text-gray-500',
}

export default function CRMTab() {
  const { tenantId } = useTenant()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState<Lead | null>(null)
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [notesSaved, setNotesSaved] = useState<Record<string, boolean>>({})

  async function fetchLeads() {
    if (!tenantId) return
    const { data } = await supabase.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [tenantId])

  async function updateStatus(id: string, status: string) {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    toast.success('Status updated')

    // Send review request email when lead is marked as won
    if (status === 'won' && tenantId) {
      const lead = leads.find(l => l.id === id)
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || 'https://biezzykcgzkrwdgqpsar.supabase.co'}/functions/v1/send-review-request`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lead_id: id, tenant_id: tenantId }),
          }
        )
        const data = await res.json()
        if (data.sent) {
          toast.success(`Review request sent to ${lead?.name || 'customer'}`)
        } else if (data.skipped && data.reason === 'no_place_id') {
          toast('Lead marked won. Add a Google Place ID in Settings to enable review request emails.', { icon: 'ℹ️' })
        }
      } catch (err) {
        console.error('Review request failed:', err)
      }
    }
  }

  async function handleNotesSave(leadId: string) {
    const notes = notesDraft[leadId] ?? ''
    await supabase.from('leads').update({ notes }).eq('id', leadId).eq('tenant_id', tenantId)
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l))
    setNotesSaved(prev => ({ ...prev, [leadId]: true }))
    setTimeout(() => setNotesSaved(prev => ({ ...prev, [leadId]: false })), 2000)
  }

  function toggleNotes(lead: Lead) {
    if (notesOpenId === lead.id) {
      setNotesOpenId(null)
    } else {
      setNotesOpenId(lead.id)
      setNotesDraft(prev => ({ ...prev, [lead.id]: lead.notes || '' }))
    }
  }

  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      if (!l.name?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q) && !l.phone?.includes(q)) return false
    }
    if (dateFrom && new Date(l.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(l.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const newCount = leads.filter(l => l.status === 'new').length
  const quotedCount = leads.filter(l => l.status === 'quoted').length
  const wonCount = leads.filter(l => l.status === 'won').length

  function exportCSV() {
    const csv = [
      ['Name', 'Email', 'Phone', 'Services', 'Message', 'Status', 'Notes', 'Date'],
      ...filtered.map(l => [
        l.name, l.email, l.phone,
        Array.isArray(l.services) ? l.services.join('; ') : (l.services || ''),
        l.message?.replace(/,/g, ';') || '',
        l.status || '',
        l.notes?.replace(/,/g, ';') || '',
        new Date(l.created_at).toLocaleDateString(),
      ])
    ].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  const inputClass = 'px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  return (
    <div>
      <PageHelpBanner tab="crm" title="📋 CRM — Lead Management"
        body="Manage incoming quote requests. Click a phone number to call, the email to send a message, or update the status as leads move through your pipeline." />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: leads.length, icon: Users, color: '#475569' },
          { label: 'New', value: newCount, icon: Inbox, color: '#3b82f6' },
          { label: 'Quoted', value: quotedCount, icon: FileText, color: '#f59e0b' },
          { label: 'Won', value: wonCount, icon: CheckCircle, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }} className={`${inputClass} bg-white`}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }} className={inputClass} />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }} className={inputClass} />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Search name, email, phone..." className={`${inputClass} flex-1 min-w-[200px]`} />
        <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-lg bg-gray-200 animate-pulse h-16 w-full" />)}
        </div>
      ) : (
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
                <>
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{l.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {l.email && (
                          <a
                            href={`mailto:${l.email}?subject=Following up on your quote request&body=Hi ${encodeURIComponent(l.name)},%0A%0A`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors w-fit"
                            title={`Email ${l.name}`}
                          >
                            <Mail size={11} /> {l.email}
                          </a>
                        )}
                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors w-fit"
                            title={`Call ${l.name}`}
                          >
                            <Phone size={11} /> {l.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[120px] truncate">{Array.isArray(l.services) ? l.services.join(', ') : (l.services || '—')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">{l.message?.slice(0, 60) || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={l.status || 'new'} onChange={e => updateStatus(l.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-emerald-500 cursor-pointer ${statusBadge[l.status || 'new'] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleNotes(l)}
                          className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                          title="Add/view notes"
                        >
                          📝
                        </button>
                        <button onClick={() => setDetail(l)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">View</button>
                      </div>
                    </td>
                  </tr>
                  {notesOpenId === l.id && (
                    <tr key={`${l.id}-notes`} className="bg-amber-50 border-b border-amber-100">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <textarea
                              value={notesDraft[l.id] ?? l.notes ?? ''}
                              onChange={e => setNotesDraft(prev => ({ ...prev, [l.id]: e.target.value }))}
                              onBlur={() => handleNotesSave(l.id)}
                              rows={2}
                              placeholder="Add a note about this lead..."
                              className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-gray-400 resize-none bg-white max-h-[120px] overflow-y-auto"
                            />
                            {notesSaved[l.id] && (
                              <p className="text-xs text-emerald-600 mt-1">Saved ✓</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded text-sm disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Name</p><p className="text-gray-900 font-medium">{detail.name}</p></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <a href={`mailto:${detail.email}?subject=Following up on your quote request&body=Hi ${encodeURIComponent(detail.name)},%0A%0A`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  title={`Email ${detail.name}`}>
                  <Mail size={11} /> {detail.email}
                </a>
              </div>
              {detail.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                  <a href={`tel:${detail.phone}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                    <Phone size={11} /> {detail.phone}
                  </a>
                </div>
              )}
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Services</p><p className="text-gray-700">{Array.isArray(detail.services) ? detail.services.join(', ') : (detail.services || '—')}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Message</p><p className="text-gray-700 whitespace-pre-wrap">{detail.message || '—'}</p></div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                <select value={detail.status || 'new'} onChange={e => { updateStatus(detail.id, e.target.value); setDetail({ ...detail, status: e.target.value }) }}
                  className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-emerald-500 cursor-pointer ${statusBadge[detail.status || 'new']}`}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Submitted</p><p className="text-gray-700">{new Date(detail.created_at).toLocaleString()}</p></div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setDetail(null)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
