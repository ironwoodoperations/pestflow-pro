import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface ClientRow {
  id: string
  name: string
  slug: string
  created_at: string
  template: string | null
  pipeline_stage: string | null
}

type SortKey = 'name' | 'newest' | 'status'

const STAGE_BADGE: Record<string, string> = {
  live:            'bg-emerald-900/50 text-emerald-300 border border-emerald-700',
  reveal_ready:    'bg-purple-900/50 text-purple-300 border border-purple-700',
  it_in_progress:  'bg-blue-900/50 text-blue-300 border border-blue-700',
  build_ready:     'bg-indigo-900/50 text-indigo-300 border border-indigo-700',
  intake_complete: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  lead_closed:     'bg-gray-700 text-gray-300 border border-gray-600',
}

const STAGE_ORDER: Record<string, number> = {
  live: 0, reveal_ready: 1, it_in_progress: 2,
  build_ready: 3, intake_complete: 4, lead_closed: 5,
}

function stageLabel(s: string | null) {
  if (!s) return 'Unknown'
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function AllClients() {
  const [clients, setClients]   = useState<ClientRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<SortKey>('newest')

  const load = useCallback(async () => {
    const [{ data: tenants }, { data: brandRows }, { data: prospects }] = await Promise.all([
      supabase.from('tenants').select('id, name, slug, created_at').is('archived_at', null),
      supabase.from('settings').select('tenant_id, value').eq('key', 'branding'),
      supabase.from('prospects').select('tenant_id, pipeline_stage').not('tenant_id', 'is', null),
    ])
    if (!tenants) { setLoading(false); return }

    const brandMap: Record<string, string> = {}
    brandRows?.forEach(r => {
      if (r.value?.theme) brandMap[r.tenant_id] = r.value.theme
    })

    const stageMap: Record<string, string> = {}
    prospects?.forEach(p => {
      if (p.tenant_id) stageMap[p.tenant_id] = p.pipeline_stage || 'lead_closed'
    })

    setClients(tenants.map(t => ({
      id:             t.id,
      name:           t.name,
      slug:           t.slug,
      created_at:     t.created_at,
      template:       brandMap[t.id] ?? null,
      pipeline_stage: stageMap[t.id] ?? null,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = clients
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sort === 'name')   return a.name.localeCompare(b.name)
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'status') {
        const ao = STAGE_ORDER[a.pipeline_stage ?? ''] ?? 99
        const bo = STAGE_ORDER[b.pipeline_stage ?? ''] ?? 99
        return ao - bo
      }
      return 0
    })

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) return <div className="p-8 text-gray-500 text-sm">Loading clients…</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">All Clients</h1>
          <p className="text-xs text-gray-500 mt-0.5">{clients.length} total sites</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or slug…"
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-56 focus:outline-none focus:border-emerald-500"
        />
        <div className="flex rounded-lg border border-gray-700 overflow-hidden">
          {(['newest', 'name', 'status'] as SortKey[]).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-3 py-1.5 text-xs font-medium transition capitalize ${
                sort === s ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:text-white'
              }`}>
              {s === 'newest' ? 'Newest' : s === 'name' ? 'A–Z' : 'Status'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
              <th className="pb-2 pr-4 font-medium">Company</th>
              <th className="pb-2 pr-4 font-medium">Slug / URL</th>
              <th className="pb-2 pr-4 font-medium">Template</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Admin</th>
              <th className="pb-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                <td className="py-2.5 pr-4 text-white font-medium">{c.name}</td>
                <td className="py-2.5 pr-4">
                  <a href={`https://${c.slug}.pestflowpro.ai`} target="_blank" rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-mono text-xs hover:underline">
                    {c.slug}.pestflowpro.ai ↗
                  </a>
                </td>
                <td className="py-2.5 pr-4 text-gray-400 text-xs capitalize">{c.template ?? '—'}</td>
                <td className="py-2.5 pr-4">
                  {c.pipeline_stage ? (
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${STAGE_BADGE[c.pipeline_stage] ?? 'bg-gray-700 text-gray-300'}`}>
                      {stageLabel(c.pipeline_stage)}
                    </span>
                  ) : <span className="text-gray-600 text-xs">—</span>}
                </td>
                <td className="py-2.5 pr-4">
                  <a href={`https://${c.slug}.pestflowpro.ai/admin`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-white hover:underline">
                    Admin ↗
                  </a>
                </td>
                <td className="py-2.5 text-gray-500 text-xs">{fmtDate(c.created_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-600">No clients match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
