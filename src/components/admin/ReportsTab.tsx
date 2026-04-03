import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { FeatureGate } from './FeatureGate'
import PageHelpBanner from './PageHelpBanner'
import LeadFunnel from './reports/LeadFunnel'
import SocialSeoReport from './reports/SocialSeoReport'
import ReportsStatCards from './reports/ReportsStatCards'
import LeadSourceChart from './reports/LeadSourceChart'
import SocialVolumeChart from './reports/SocialVolumeChart'

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

  const serviceCounts: Record<string, number> = {}
  filtered.forEach(l => { (l.services || []).forEach(s => { serviceCounts[s] = (serviceCounts[s] || 0) + 1 }) })
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxServiceCount = topServices.length > 0 ? topServices[0][1] : 1

  const dayCount = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 60
  const dailyLeads: { label: string; count: number }[] = []
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    const count = filtered.filter(l => l.created_at.startsWith(dateStr)).length
    dailyLeads.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count })
  }
  const maxDaily = Math.max(...dailyLeads.map(d => d.count), 1)

  const statusCounts = {
    new: newLeads, contacted,
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
        <div className="flex items-center gap-2 mb-6">
          {(['7d', '30d', '90d', 'all'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${range === r ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>

        <ReportsStatCards totalLeads={totalLeads} newLeads={newLeads} converted={converted}
          conversionRate={conversionRate} leadsTrend={leadsTrend} convTrend={convTrend} range={range} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="mt-6">
          <LeadFunnel leads={filtered} />
        </div>

        <FeatureGate minTier={3} featureName="Advanced Reports & Trends">
          <SocialSeoReport />
        </FeatureGate>

        <FeatureGate minTier={3} featureName="Advanced Analytics">
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Advanced Analytics</h2>
            {tenantId && <LeadSourceChart tenantId={tenantId} />}
            {tenantId && <SocialVolumeChart tenantId={tenantId} />}
          </div>
        </FeatureGate>

        <p className="text-xs text-gray-400 mt-6 text-center">Privacy-first analytics — all data stays in your database. No third-party tracking.</p>
      </FeatureGate>
    </div>
  )
}
