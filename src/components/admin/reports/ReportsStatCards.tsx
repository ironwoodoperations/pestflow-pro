import { BarChart3, TrendingUp, Users, Calendar, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  totalLeads: number
  newLeads: number
  converted: number
  conversionRate: number
  leadsTrend: number
  convTrend: number
  range: '7d' | '30d' | '90d' | 'all'
}

export default function ReportsStatCards({ totalLeads, newLeads, converted, conversionRate, leadsTrend, convTrend, range }: Props) {
  const stats = [
    { label: 'Total Leads', value: totalLeads, trend: leadsTrend, icon: Users, color: '#3b82f6' },
    { label: 'New (Uncontacted)', value: newLeads, trend: 0, icon: Calendar, color: '#f59e0b' },
    { label: 'Converted', value: converted, trend: 0, icon: TrendingUp, color: '#10b981' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, trend: convTrend, icon: BarChart3, color: '#a855f7' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            {s.trend !== 0 && range !== 'all' && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${s.trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {s.trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(s.trend)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
