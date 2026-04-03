import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Calendar, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { FeatureGate } from './FeatureGate'
import PageHelpBanner from './PageHelpBanner'
import LeadFunnel from './reports/LeadFunnel'
import SocialSeoReport from './reports/SocialSeoReport'

interface LeadRow {
  id: string
  status: string
  created_at: string
  services: string[] | null
}

export default function ReportsTab() {
  const { tenantId } = useTenant()
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (!tenantId) return
    supabase.from('leads').select('id, status, created_at, services').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [tenantId])

  const now = new Date()
  const cutoff = range === 'all' ? new Date(0)
    : range === '90d' ? new Date(now.getTime() - 90 * 86400000)
    : range === '30d' ? new Date(now.getTime() - 30 * 86400000)
    : new Date(now.getTime() - 7 * 86400000)
  const prevCutoff = range === 'all' ? new Date(0)
    : new Date(cutoff.getTime() - (now.getTime() - cutoff.getTime()))

  const filtered = leads.filter(l => new Date(l.created_at) >= cutoff)
  const prevFiltered = range !== 'all' ? leads.filter(l => { const d = new Date(l.created_at); return d >= prevCutoff && d < cutoff }) : []

  const totalLeads = filtered.length
  const prevTotal = prevFiltered.length
  const newLeads = filtered.filter(l => l.status === 'new').length
  const contacted = filtered.filter(l => l.status === 'contacted').length
  const converted = filtered.filter(l => l.status === 'converted' || l.status === 'won').length
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0
  const prevConversion = prevTotal > 0 ? Math.round((prevFiltered.filter(l => l.status === 'converted' || l.status === 'won').length / prevTotal) * 100) : 0

  const leadsTrend = prevTotal > 0 ? Math.round(((totalLeads - prevTotal) / prevTotal) * 100) : 0
  const convTrend = prevConversion > 0 ? conversionRate - prevConversion : 0

  // Top services
  const serviceCounts: Record<string, number> = {}
  filtered.forEach(l => {
    (l.services || []).forEach(s => { serviceCounts[s] = (serviceCounts[s] || 0) + 1 })
  })
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxServiceCount = topServices.length > 0 ? topServices[0][1] : 1

  // Leads by day (last 30 or 7 days)
  const dayCount = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 60
  const dailyLeads: { label: string; count: number }[] = []
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    const count = filtered.filter(l => l.created_at.startsWith(dateStr)).length
    dailyLeads.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count })
  }
  const maxDaily = Math.max(...dailyLeads.map(d => d.count), 1)

  // Lead status breakdown
  const statusCounts = {
    new: newLeads,
    contacted,
    converted,
    lost: filtered.filter(l => l.status === 'lost').length,
  }
  const statusColors: Record<string, string> = { new: '#3b82f6', contacted: '#f59e0b', converted: '#10b981', lost: '#ef4444' }

  if (loading) return <div className="text-gray-400 p-4">Loading analytics...</div>

  return (
    <div>
      <PageHelpBanner tab="reports" title="📊 Reports & Insights"
        body="A snapshot of your social media activity and SEO health. Use this to spot gaps and track progress over time." />

      <FeatureGate minTier={2} featureName="Reports">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2 mb-6">
          {(['7d', '30d', '90d', 'all'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${range === r ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Leads', value: totalLeads, trend: leadsTrend, icon: Users, color: '#3b82f6' },
            { label: 'New (Uncontacted)', value: newLeads, trend: 0, icon: Calendar, color: '#f59e0b' },
            { label: 'Converted', value: converted, trend: 0, icon: TrendingUp, color: '#10b981' },
            { label: 'Conversion Rate', value: `${conversionRate}%`, trend: convTrend, icon: BarChart3, color: '#a855f7' },
          ].map(s => (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads Over Time Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Leads Over Time</h3>
            <div className="flex items-end gap-[2px] h-40">
              {dailyLeads.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="w-full rounded-t bg-emerald-500/80 hover:bg-emerald-500 transition-colors" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }} />
                  <div className="hidden group-hover:block absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.label}: {d.count} lead{d.count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{dailyLeads[0]?.label}</span>
              <span>{dailyLeads[dailyLeads.length - 1]?.label}</span>
            </div>
          </div>

          {/* Lead Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Lead Status</h3>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700 font-medium">{status}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${totalLeads > 0 ? (count / totalLeads) * 100 : 0}%`, background: statusColors[status] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Top Requested Services</h3>
            {topServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topServices.map(([service, count]) => (
                  <div key={service} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{service}</span>
                        <span className="text-gray-500">{count} lead{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / maxServiceCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No service data yet — leads with services will appear here.</p>
            )}
          </div>
        </div>

      {/* Lead Funnel */}
      <div className="mt-6">
        <LeadFunnel leads={filtered} />
      </div>

        <FeatureGate minTier={3} featureName="Advanced Reports & Trends">
          <SocialSeoReport />
        </FeatureGate>

        <p className="text-xs text-gray-400 mt-6 text-center">Privacy-first analytics — all data stays in your database. No third-party tracking.</p>
      </FeatureGate>
    </div>
  )
}
