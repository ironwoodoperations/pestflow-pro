import type { Prospect } from './types'
import ProspectCard from './ProspectCard'

interface Stage {
  id: string
  label: string
}

interface Props {
  stage: Stage
  prospects: Prospect[]
  isGated: boolean
  isDragOver: boolean
  onCardClick: (p: Prospect) => void
  onDragStart: (p: Prospect) => void
  onDragOver: (stageId: string) => void
  onDrop: (stageId: string) => void
}

export default function PipelineColumn({
  stage, prospects, isGated, isDragOver,
  onCardClick, onDragStart, onDragOver, onDrop,
}: Props) {
  return (
    <div
      className={`flex flex-col shrink-0 w-48 rounded-lg p-1 transition-colors ${
        isDragOver && !isGated ? 'bg-blue-900/20 ring-1 ring-blue-500' : ''
      }`}
      onDragOver={e => { e.preventDefault(); onDragOver(stage.id) }}
      onDrop={e => { e.preventDefault(); onDrop(stage.id) }}
    >
      {/* Column header */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-xs font-semibold text-gray-300 truncate">{stage.label}</span>
        {isGated && (
          <span title="QA gate required — complete in Reveal Queue" className="text-amber-500 text-xs flex-shrink-0">
            🔒
          </span>
        )}
        <span className="text-xs text-gray-500 ml-auto flex-shrink-0">{prospects.length}</span>
      </div>

      {/* Cards */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-16">
        {prospects.length === 0 ? (
          <p className="text-xs text-gray-600 italic text-center pt-4 px-2">
            No clients in this stage
          </p>
        ) : (
          prospects.map(p => (
            <ProspectCard
              key={p.id}
              prospect={p}
              onClick={() => onCardClick(p)}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  )
}
