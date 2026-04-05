import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect, ProspectStatus, Salesperson } from './types'
import ProspectDetail from './ProspectDetail'

const STAGES: ProspectStatus[] = [
  'prospect','quoted','paid','onboarding','provisioned','active','churned',
]
const STAGE_COLORS: Record<ProspectStatus, string> = {
  prospect: 'bg-gray-700', quoted: 'bg-blue-800', paid: 'bg-indigo-800',
  onboarding: 'bg-yellow-800', provisioned: 'bg-teal-800',
  active: 'bg-green-800', churned: 'bg-red-900',
}
const PLAN_BADGE: Record<string, string> = {
  Starter: 'bg-gray-600', Grow: 'bg-blue-700',
  Pro: 'bg-purple-700', Elite: 'bg-amber-700',
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}
function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PipelineBoard() {
  const [prospects, setProspects]     = useState<Prospect[]>([])
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [selectedId, setSelectedId]   = useState<string | null>(undefined as any)
  const [showNew, setShowNew]         = useState(false)

  const load = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('prospects').select('*').order('updated_at', { ascending: false }),
      supabase.from('salespeople').select('*').eq('active', true),
    ])
    if (p) setProspects(p)
    if (s) setSalespeople(s)
  }, [])

  useEffect(() => { load() }, [load])

  const spMap = Object.fromEntries(salespeople.map(s => [s.id, s]))

  const grouped = STAGES.reduce<Record<ProspectStatus, Prospect[]>>((acc, s) => {
    acc[s] = prospects.filter(p => p.status === s)
    return acc
  }, {} as any)

  const isOpen = selectedId !== undefined || showNew

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Pipeline</h2>
        <button
          onClick={() => { setSelectedId(undefined as any); setShowNew(true) }}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500"
        >
          + New Prospect
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: `${STAGES.length * 200}px` }}>
          {STAGES.map(stage => (
            <div key={stage} className="flex flex-col w-48 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${STAGE_COLORS[stage]} text-white`}>
                  {stage}
                </span>
                <span className="text-xs text-gray-500">{grouped[stage].length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {grouped[stage].map(p => {
                  const sp = p.salesperson_id ? spMap[p.salesperson_id] : null
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedId(p.id); setShowNew(false) }}
                      className="w-full text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 space-y-1.5"
                    >
                      <div className="font-semibold text-white text-sm leading-tight">{p.company_name}</div>
                      {p.contact_name && <div className="text-xs text-gray-400">{p.contact_name}</div>}
                      {p.phone && <a href={`tel:${p.phone}`} onClick={e => e.stopPropagation()} className="block text-xs text-blue-400 hover:underline">{p.phone}</a>}
                      <div className="flex items-center justify-between mt-1">
                        {p.plan_name && (
                          <span className={`text-xs px-1.5 py-0.5 rounded text-white ${PLAN_BADGE[p.plan_name] || 'bg-gray-600'}`}>
                            {p.plan_name}
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          {sp && <span className="text-xs bg-emerald-800 text-emerald-200 rounded-full w-5 h-5 flex items-center justify-center font-bold">{initials(sp.name)}</span>}
                          <span className="text-xs text-gray-500">D{daysSince(p.updated_at)}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isOpen && (
        <ProspectDetail
          prospectId={showNew ? null : selectedId}
          salespeople={salespeople}
          onClose={(refreshed) => {
            setSelectedId(undefined as any)
            setShowNew(false)
            if (refreshed) load()
          }}
        />
      )}
    </div>
  )
}
