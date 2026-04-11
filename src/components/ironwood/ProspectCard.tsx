import type { Prospect } from './types'

const BUILD_BADGE: Record<string, { label: string; cls: string }> = {
  template_launch:     { label: 'Template',  cls: 'bg-green-800 text-green-200' },
  firecrawl_migration: { label: 'Firecrawl', cls: 'bg-blue-800 text-blue-200' },
  full_custom:         { label: 'Custom',    cls: 'bg-purple-800 text-purple-200' },
}

const TIER_BADGE: Record<string, string> = {
  starter: 'bg-gray-700 text-gray-300',
  growth:  'bg-blue-800 text-blue-200',
  pro:     'bg-indigo-800 text-indigo-200',
  elite:   'bg-amber-700 text-amber-200',
}
const TIER_PRICE: Record<string, string> = {
  starter: '$149/mo',
  growth:  '$249/mo',
  pro:     '$349/mo',
  elite:   '$499/mo',
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

interface Props {
  prospect: Prospect
  onClick: () => void
  onDragStart: (p: Prospect) => void
}

export default function ProspectCard({ prospect: p, onClick, onDragStart }: Props) {
  const bp   = p.build_path ? BUILD_BADGE[p.build_path] : null
  const tier = (p.tier || 'starter').toLowerCase()

  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart(p) }}
      onClick={onClick}
      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="font-semibold text-white text-sm leading-tight mb-1.5">
        {p.company_name}
      </div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {bp && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${bp.cls}`}>
            {bp.label}
          </span>
        )}
        {!bp && (
          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-gray-700 text-gray-400">
            No path
          </span>
        )}
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${TIER_BADGE[tier] ?? TIER_BADGE.starter}`}>
          {tier} · {TIER_PRICE[tier] ?? '$149/mo'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        {p.intake_submitted_at
          ? <span className="text-emerald-400">✓ Intake</span>
          : <span className="text-gray-600">· Intake pending</span>
        }
        <span className="text-gray-500">{daysSince(p.updated_at)}d</span>
      </div>
    </div>
  )
}
