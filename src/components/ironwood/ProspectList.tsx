import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect, ProspectStatus, Salesperson } from './types'
import ProspectDetail from './ProspectDetail'
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal'
import UndoToast from '../shared/UndoToast'
import { hardDeleteRecord, restoreRecord } from '../../lib/archiveUtils'

const ALL = 'all'
type SortKey = 'company_name' | 'status' | 'plan_name' | 'setup_fee_amount' | 'monthly_price' | 'call_date'
type ArchiveTab = 'active' | 'archived'

function TH({
  k,
  label,
  sortKey,
  sortAsc,
  onToggle,
}: {
  k: SortKey
  label: string
  sortKey: SortKey
  sortAsc: boolean
  onToggle: (k: SortKey) => void
}) {
  return (
    <th className="pb-2 cursor-pointer hover:text-white select-none text-left" onClick={() => onToggle(k)}>
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )
}

const STATUS_BADGE: Record<ProspectStatus, string> = {
  prospect: 'bg-gray-700 text-gray-300', quoted: 'bg-blue-800 text-blue-200',
  paid: 'bg-indigo-800 text-indigo-200', onboarding: 'bg-yellow-800 text-yellow-200',
  provisioned: 'bg-teal-800 text-teal-200', active: 'bg-green-800 text-green-200',
  churned: 'bg-red-900 text-red-200',
}

export default function ProspectList() {
  const [prospects, setProspects]       = useState<Prospect[]>([])
  const [salespeople, setSalespeople]   = useState<Salesperson[]>([])
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterRep, setFilterRep]       = useState<string>(ALL)
  const [sortKey, setSortKey]           = useState<SortKey>('call_date')
  const [sortAsc, setSortAsc]           = useState(false)
  const [selectedId, setSelectedId]     = useState<string | null | undefined>(undefined)
  const [archiveTab, setArchiveTab]     = useState<ArchiveTab>('active')
  const [deleteTarget, setDeleteTarget] = useState<Prospect | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [undoTarget, setUndoTarget]     = useState<{ id: string; name: string; tenantId?: string } | null>(null)

  const load = useCallback(async (tab: ArchiveTab = 'active') => {
    const query = supabase.from('prospects').select('*').order('created_at', { ascending: false })
    const finalQuery = tab === 'active'
      ? query.is('archived_at', null).neq('pipeline_stage', 'live')
      : query.not('archived_at', 'is', null)

    const [{ data: p }, { data: s }] = await Promise.all([
      finalQuery,
      supabase.from('salespeople').select('*'),
    ])
    if (p) setProspects(p)
    if (s) setSalespeople(s)
  }, [])

  useEffect(() => { load(archiveTab) }, [load, archiveTab])

  const spMap = Object.fromEntries(salespeople.map(s => [s.id, s]))

  const filtered = prospects
    .filter(p => {
      if (filterStatus !== ALL && p.status !== filterStatus) return false
      if (filterRep !== ALL && p.salesperson_id !== filterRep) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.company_name.toLowerCase().includes(q) && !(p.email || '').toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      const va = (a as any)[sortKey] ?? ''
      const vb = (b as any)[sortKey] ?? ''
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(a => !a)
    else { setSortKey(k); setSortAsc(true) }
  }
  const handleRestore = async (p: Prospect) => {
    await restoreRecord('prospects', p.id, supabase)
    // Also restore the live tenant site if provisioned
    if (p.tenant_id) {
      await restoreRecord('tenants', p.tenant_id, supabase)
    }
    load(archiveTab)
  }

  const handleDeletePermanently = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await hardDeleteRecord('prospects', deleteTarget.id, supabase)
    setDeleteTarget(null)
    setDeleting(false)
    load(archiveTab)
  }

  const isOpen = selectedId !== undefined

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Prospects</h2>
          {/* Archive tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs">
            <button
              onClick={() => setArchiveTab('active')}
              className={`px-3 py-1.5 transition ${archiveTab === 'active' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}
            >
              Active
            </button>
            <button
              onClick={() => setArchiveTab('archived')}
              className={`px-3 py-1.5 transition ${archiveTab === 'archived' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}
            >
              Archived
            </button>
          </div>
        </div>
        {archiveTab === 'active' && (
          <button onClick={() => setSelectedId(null)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500">
            + New Prospect
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input placeholder="Search company or email…"
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-56 focus:outline-none focus:border-emerald-500"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value={ALL}>All Statuses</option>
          {['prospect','quoted','paid','onboarding','provisioned','active','churned'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
          value={filterRep} onChange={e => setFilterRep(e.target.value)}>
          <option value={ALL}>All Reps</option>
          {salespeople.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {archiveTab === 'archived' && (
        <div className="mb-3 px-3 py-2 bg-yellow-900/20 border border-yellow-800/50 rounded text-xs text-yellow-400">
          Archived prospects are hidden from the pipeline. Restore to make them active again.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <TH k="company_name" label="Company" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
              <TH k="status" label="Status" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
              <th className="pb-2 text-left">Rep</th>
              <TH k="plan_name" label="Plan" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
              <TH k="setup_fee_amount" label="Setup" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
              <TH k="monthly_price" label="Monthly" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
              <TH k="call_date" label="Call Date" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
              <th className="pb-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-900/40">
                <td className="py-2 font-medium text-white">{p.company_name}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                </td>
                <td className="py-2 text-gray-400">{p.salesperson_id ? spMap[p.salesperson_id]?.name || '—' : '—'}</td>
                <td className="py-2 text-gray-300">{p.plan_name || '—'}</td>
                <td className="py-2 text-gray-300">{p.setup_fee_amount != null ? `$${p.setup_fee_amount}` : '—'}</td>
                <td className="py-2 text-gray-300">{p.monthly_price ? `$${p.monthly_price}/mo` : '—'}</td>
                <td className="py-2 text-gray-400">{p.call_date || '—'}</td>
                <td className="py-2">
                  {archiveTab === 'active' ? (
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedId(p.id)} className="text-xs text-emerald-400 hover:underline">Open</button>
                      {p.provisioned_at && p.slug && (
                        <button onClick={() => navigator.clipboard.writeText(`https://${p.slug}.pestflowpro.com`)}
                          className="text-xs text-gray-400 hover:underline">Copy URL</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleRestore(p)} className="text-xs text-emerald-400 hover:underline">Restore</button>
                      <button onClick={() => setDeleteTarget(p)} className="text-xs text-red-400 hover:underline">Delete Permanently</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-gray-600">
                {archiveTab === 'archived' ? 'No archived prospects.' : 'No prospects match the current filters.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-600">{filtered.length} of {prospects.length} prospects</div>

      {isOpen && (
        <ProspectDetail
          prospectId={selectedId ?? null}
          salespeople={salespeople}
          onClose={(refreshed) => { setSelectedId(undefined); if (refreshed) load(archiveTab) }}
          onArchived={(id, name, tenantId) => { setUndoTarget({ id, name, tenantId }); load(archiveTab) }}
        />
      )}

      {undoTarget && (
        <UndoToast
          table="prospects"
          id={undoTarget.id}
          label={`${undoTarget.name} archived.`}
          onUndo={async () => {
            await restoreRecord('prospects', undoTarget.id, supabase)
            if (undoTarget.tenantId) await restoreRecord('tenants', undoTarget.tenantId, supabase)
          }}
          onDismiss={() => { setUndoTarget(null); load(archiveTab) }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.company_name || 'this prospect'}
        onConfirm={handleDeletePermanently}
        onCancel={() => setDeleteTarget(null)}
      />
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
