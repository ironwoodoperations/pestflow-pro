import { Users, ArrowUp, TrendingUp, BarChart3 } from 'lucide-react'

interface Props {
  totalLeads: number
  newThisMonth: number
  newThisWeek: number
  conversionRate: number
}

export default function DashboardStats({ totalLeads, newThisMonth, newThisWeek, conversionRate }: Props) {
  const stats = [
    { label: 'Total Leads',       value: totalLeads,        icon: Users,     color: '#3b82f6' },
    { label: 'New This Month',    value: newThisMonth,      icon: ArrowUp,   color: '#10b981' },
    { label: 'New This Week',     value: newThisWeek,       icon: TrendingUp, color: '#f59e0b' },
    { label: 'Conversion Rate',   value: `${conversionRate}%`, icon: BarChart3, color: '#a855f7' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}18` }}>
            <s.icon className="w-5 h-5" style={{ color: s.color }} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          <p className="text-sm text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
