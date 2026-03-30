import { BarChart3, TrendingUp, Search, Users } from 'lucide-react'

const REPORTS = [
  { title: 'Monthly Summary Report', desc: 'Revenue, jobs completed, new customers, and top services for the month.', icon: BarChart3, color: '#10b981' },
  { title: 'Lead Conversion Report', desc: 'Lead sources, conversion rates by channel, and win/loss analysis.', icon: TrendingUp, color: '#3b82f6' },
  { title: 'SEO Performance Report', desc: 'Keyword rankings, estimated traffic, and page-level performance.', icon: Search, color: '#f59e0b' },
  { title: 'Technician Performance', desc: 'Jobs per technician, completion rate, and average time per job.', icon: Users, color: '#a855f7' },
]

export default function ReportsTab() {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700">Full reporting launches in the next update. Export your leads from the Leads tab in the meantime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Coming Soon</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: r.color }}>
              <r.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{r.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{r.desc}</p>
            <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Generate Report
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
