import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect, ProspectStatus, Salesperson } from './types'
import ProspectDetail from './ProspectDetail'

const ALL = 'all'
type SortKey = 'company_name' | 'status' | 'plan_name' | 'setup_fee_amount' | 'monthly_price' | 'call_date'

const STATUS_BADGE: Record<ProspectStatus, string> = {
  prospect: 'bg-gray-700 text-gray-300', quoted: 'bg-blue-800 text-blue-200',
  paid: 'bg-indigo-800 text-indigo-200', onboarding: 'bg-yellow-800 text-yellow-200',
  provisioned: 'bg-teal-800 text-teal-200', active: 'bg-green-800 text-green-200',
  churned: 'bg-red-900 text-red-200',
}

export default function ProspectList() {
  const [prospects, setProspects]     = useState<Prospect[]>([])
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterRep, setFilterRep]     = useState<string>(ALL)
  const [sortKey, setSortKey]         = useState<SortKey>('call_date')
  const [sortAsc, setSortAsc]         = useState(false)
  const [selectedId, setSelectedId]   = useState<string | null | undefined>(undefined)

  const load = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('prospects').select('*').order('created_at', { ascending: false }),
      supabase.from('salespeople').select('*'),
    ])
    if (p) setProspects(p)
    if (s) setSalespeople(s)
  }, [])

  useEffect(() => { load() }, [load])

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
  const TH = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="pb-2 cursor-pointer hover:text-white select-none text-left" onClick={() => toggleSort(k)}>
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  const isOpen = selectedId !== undefined

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Prospects</h2>
        <button onClick={() => setSelectedId(null)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500">
          + New Prospect
        </button>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <TH k="company_name" label="Company" />
              <TH k="status" label="Status" />
              <th className="pb-2 text-left">Rep</th>
              <TH k="plan_name" label="Plan" />
              <TH k="setup_fee_amount" label="Setup" />
              <TH k="monthly_price" label="Monthly" />
              <TH k="call_date" label="Call Date" />
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
                <td className="py-2 flex gap-2">
                  <button onClick={() => setSelectedId(p.id)} className="text-xs text-emerald-400 hover:underline">Open</button>
                  {p.provisioned_at && p.slug && (
                    <button onClick={() => navigator.clipboard.writeText(`https://${p.slug}.pestflowpro.com`)}
                      className="text-xs text-gray-400 hover:underline">Copy URL</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-gray-600">No prospects match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-600">{filtered.length} of {prospects.length} prospects</div>

      {isOpen && (
        <ProspectDetail
          prospectId={selectedId ?? null}
          salespeople={salespeople}
          onClose={(refreshed) => { setSelectedId(undefined); if (refreshed) load() }}
        />
      )}
    </div>
  )
}
