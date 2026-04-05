import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Download, Users, Inbox, FileText, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
import LeadTable from './crm/LeadTable'
import LeadDetailModal from './crm/LeadDetailModal'
import type { Lead } from './crm/types'
import { STATUSES, PER_PAGE } from './crm/types'

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

  useEffect(() => {
    if (!tenantId) return
    supabase.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [tenantId])

  async function updateStatus(id: string, status: string) {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    toast.success('Status updated')
    if (status === 'won' && tenantId) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || 'https://biezzykcgzkrwdgqpsar.supabase.co'}/functions/v1/send-review-request`,
          { method: 'POST', headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, tenant_id: tenantId }) }
        )
        const data = await res.json()
        const lead = leads.find(l => l.id === id)
        if (data.sent) toast.success(`Review request sent to ${lead?.name || 'customer'}`)
        else if (data.skipped && data.reason === 'no_place_id') toast('Lead marked won. Add a Google Place ID in Settings to enable review request emails.', { icon: 'ℹ️' })
      } catch (err) { console.error('Review request failed:', err) }
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
    if (notesOpenId === lead.id) { setNotesOpenId(null) }
    else { setNotesOpenId(lead.id); setNotesDraft(prev => ({ ...prev, [lead.id]: lead.notes || '' })) }
  }

  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    if (search) { const q = search.toLowerCase(); if (!l.name?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q) && !l.phone?.includes(q)) return false }
    if (dateFrom && new Date(l.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(l.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  function exportCSV() {
    const csv = [
      ['Name', 'Email', 'Phone', 'Services', 'Message', 'Status', 'Notes', 'Date'],
      ...filtered.map(l => [l.name, l.email, l.phone, Array.isArray(l.services) ? l.services.join('; ') : (l.services || ''), l.message?.replace(/,/g, ';') || '', l.status || '', l.notes?.replace(/,/g, ';') || '', new Date(l.created_at).toLocaleDateString()])
    ].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url); toast.success('CSV exported!')
  }

  const ic = 'px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
  const newCount = leads.filter(l => l.status === 'new').length
  const quotedCount = leads.filter(l => l.status === 'quoted').length
  const wonCount = leads.filter(l => l.status === 'won').length

  return (
    <div>
      <PageHelpBanner tab="crm" title="📋 CRM — Lead Management"
        body="Manage incoming quote requests. Click a phone number to call, the email to send a message, or update the status as leads move through your pipeline." />

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }} className={`${ic} bg-white`}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }} className={ic} />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }} className={ic} />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Search name, email, phone..." className={`${ic} flex-1 min-w-[200px]`} />
        <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <LeadTable
        loading={loading} paginated={paginated} filtered={filtered}
        page={page} totalPages={totalPages}
        notesOpenId={notesOpenId} notesDraft={notesDraft} notesSaved={notesSaved}
        onUpdateStatus={updateStatus} onToggleNotes={toggleNotes}
        onNotesDraftChange={(id, val) => setNotesDraft(prev => ({ ...prev, [id]: val }))}
        onNotesSave={handleNotesSave} onPageChange={setPage} onView={setDetail}
      />

      {detail && <LeadDetailModal lead={detail} onClose={() => setDetail(null)} onStatusChange={(id, status) => { updateStatus(id, status); setDetail({ ...detail, status }) }} />}
    </div>
  )
}
