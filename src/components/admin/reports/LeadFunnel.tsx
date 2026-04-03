interface Props {
  leads: { status: string }[]
}

const FUNNEL_STEPS = [
  { key: 'new',       label: 'New',       color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { key: 'quoted',    label: 'Quoted',    color: 'bg-purple-500' },
  { key: 'won',       label: 'Won',       color: 'bg-green-500' },
  { key: 'lost',      label: 'Lost',      color: 'bg-gray-400' },
]

export default function LeadFunnel({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Lead Funnel</h3>
        <p className="text-sm text-gray-400 text-center py-4">No leads yet.</p>
      </div>
    )
  }

  const counts: Record<string, number> = {}
  for (const step of FUNNEL_STEPS) counts[step.key] = 0
  for (const lead of leads) {
    const s = lead.status || 'new'
    if (counts[s] !== undefined) counts[s]++
  }

  const maxCount = Math.max(...Object.values(counts), 1)
  const won = counts['won'] || 0
  const lost = counts['lost'] || 0
  const convRate = won + lost > 0 ? ((won / (won + lost)) * 100).toFixed(1) : '0.0'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Lead Funnel</h3>
      <div className="space-y-3">
        {FUNNEL_STEPS.map(step => {
          const count = counts[step.key]
          const pct = (count / maxCount) * 100
          return (
            <div key={step.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{step.label}</span>
                <span className="text-gray-500 tabular-nums">{count}</span>
              </div>
              <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                >
                  {pct > 15 && (
                    <span className="text-white text-xs font-medium">{count}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-600">Conversion rate (won / won+lost)</span>
        <span className="text-lg font-bold text-emerald-600">{convRate}%</span>
      </div>
    </div>
  )
}
