import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import type { Prospect, Salesperson } from './types'
import ProspectDetail from './ProspectDetail'
import PipelineColumn from './PipelineColumn'

export const PIPELINE_STAGES = [
  { id: 'lead_closed',     label: 'Lead Closed' },
  { id: 'intake_complete', label: 'Intake Complete' },
  { id: 'build_ready',     label: 'Build Ready' },
  { id: 'it_in_progress',  label: 'IT In Progress' },
  { id: 'reveal_ready',    label: 'Reveal Ready' },
  { id: 'live',            label: 'Live ✓' },
]
const GATED = 'reveal_ready'

type ViewMode = 'pipeline' | 'table'

interface PendingMove { prospect: Prospect; toStage: string }

export default function PipelineBoard() {
  const [prospects, setProspects]     = useState<Prospect[]>([])
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [selectedId, setSelectedId]   = useState<string | null | undefined>(undefined)
  const [showNew, setShowNew]         = useState(false)
  const [viewMode, setViewMode]       = useState<ViewMode>('pipeline')
  const [dragging, setDragging]       = useState<Prospect | null>(null)
  const [dragOver, setDragOver]       = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)

  const load = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('prospects').select('*').is('archived_at', null).order('updated_at', { ascending: false }),
      supabase.from('salespeople').select('*').eq('active', true),
    ])
    if (p) setProspects(p)
    if (s) setSalespeople(s)
  }, [])

  useEffect(() => { load() }, [load])

  function handleDragStart(p: Prospect) { setDragging(p) }
  function handleDragOver(stageId: string) { if (dragging) setDragOver(stageId) }

  function handleDrop(toStage: string) {
    if (!dragging) return
    setDragOver(null)
    if (dragging.pipeline_stage === toStage) { setDragging(null); return }
    if (toStage === GATED) {
      toast.error('QA gate required — complete in Reveal Queue')
      setDragging(null)
      return
    }
    setPendingMove({ prospect: dragging, toStage })
    setDragging(null)
  }

  async function confirmMove() {
    if (!pendingMove) return
    const { prospect, toStage } = pendingMove
    await supabase.from('prospects').update({ pipeline_stage: toStage }).eq('id', prospect.id)
    setProspects(ps => ps.map(p => p.id === prospect.id ? { ...p, pipeline_stage: toStage } : p))
    toast.success(`${prospect.company_name} → ${PIPELINE_STAGES.find(s => s.id === toStage)?.label}`)
    setPendingMove(null)
  }

  function openDetail(p: Prospect) { setSelectedId(p.id); setShowNew(false) }
  const isOpen = selectedId !== undefined || showNew
  const closeFn = (refreshed?: boolean) => { setSelectedId(undefined); setShowNew(false); if (refreshed) load() }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Pipeline</h2>
          <div className="flex rounded-lg border border-gray-700 overflow-hidden">
            <button onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1 text-xs font-medium transition ${viewMode === 'pipeline' ? 'bg-blue-700 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>
              Pipeline
            </button>
            <button onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-medium transition ${viewMode === 'table' ? 'bg-blue-700 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>
              Table
            </button>
          </div>
        </div>
        <button onClick={() => { setSelectedId(undefined); setShowNew(true) }}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500">
          + New Prospect
        </button>
      </div>

      {/* Pipeline view */}
      {viewMode === 'pipeline' && (
        <div className="flex-1 overflow-x-auto" onDragEnd={() => { setDragging(null); setDragOver(null) }}>
          <div className="flex gap-3 p-4 h-full" style={{ minWidth: `${PIPELINE_STAGES.length * 210}px` }}>
            {PIPELINE_STAGES.map(stage => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                prospects={prospects.filter(p => (p.pipeline_stage || 'lead_closed') === stage.id)}
                isGated={stage.id === GATED}
                isDragOver={dragOver === stage.id}
                onCardClick={openDetail}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-700">
                {['Company', 'Stage', 'Build Path', 'Tier', 'Intake'].map(h => (
                  <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => (
                <tr key={p.id} onClick={() => openDetail(p)}
                  className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                  <td className="py-2 pr-4 text-white font-medium">{p.company_name}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs capitalize">{(p.pipeline_stage || 'lead_closed').replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">{p.build_path ? p.build_path.replace(/_/g, ' ') : '—'}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs capitalize">{p.tier || 'starter'}</td>
                  <td className="py-2 text-xs">{p.intake_submitted_at ? <span className="text-emerald-400">✓</span> : <span className="text-gray-600">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drag confirm modal */}
      {pendingMove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-5 max-w-sm w-full mx-4">
            <p className="text-white text-sm mb-4">
              Move <strong>{pendingMove.prospect.company_name}</strong> to{' '}
              <strong>{PIPELINE_STAGES.find(s => s.id === pendingMove.toStage)?.label}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingMove(null)}
                className="px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={confirmMove}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <ProspectDetail
          prospectId={showNew ? null : selectedId!}
          salespeople={salespeople}
          onClose={closeFn}
        />
      )}
    </div>
  )
}
