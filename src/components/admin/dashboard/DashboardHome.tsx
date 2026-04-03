import { useState, useEffect } from 'react'
import { Users, ArrowUp, TrendingUp, BarChart3 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import PlanOverviewCard from './PlanOverviewCard'
import DemoControls from './DemoControls'

interface Props {
  onboardingComplete: boolean
  demoActive: boolean
  onDemoSeeded: () => void
}

interface Lead { id: string; name: string; status: string; created_at: string; services: string[] | null }

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700', contacted: 'bg-amber-100 text-amber-700',
    converted: 'bg-emerald-100 text-emerald-700', won: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status || 'new'}
    </span>
  )
}

function QuickLink({ label, icon, tab }: { label: string; icon: string; tab: string }) {
  return (
    <button onClick={() => {
      const btn = document.querySelector(`button[aria-current]`)?.parentElement?.querySelector(`button:nth-child(${tab === 'crm' ? 9 : tab === 'content' ? 2 : tab === 'seo' ? 3 : 1})`) as HTMLButtonElement | null
      btn?.click()
    }} className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium text-gray-700">
      {icon} {label}
    </button>
  )
}

export default function DashboardHome({ onboardingComplete, demoActive, onDemoSeeded }: Props) {
  const { tenantId } = useTenant()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    supabase.from('leads').select('id, name, status, created_at, services').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [tenantId])

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisWeek = new Date(now.getTime() - 7 * 86400000)
  const totalLeads = leads.length
  const newThisMonth = leads.filter(l => new Date(l.created_at) >= thisMonth).length
  const newThisWeek = leads.filter(l => new Date(l.created_at) >= thisWeek).length
  const withStatus = leads.filter(l => l.status)
  const converted = withStatus.filter(l => l.status === 'converted' || l.status === 'won').length
  const conversionRate = withStatus.length > 0 ? Math.round((converted / withStatus.length) * 100) : 0

  const monthlyLeads: { label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const count = leads.filter(l => { const c = new Date(l.created_at); return c >= d && c < nextMonth }).length
    monthlyLeads.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), count })
  }
  const maxMonthly = Math.max(...monthlyLeads.map(m => m.count), 1)
  const recentLeads = leads.slice(0, 5)

  if (loading) return <p className="text-gray-400 p-4">Loading dashboard...</p>

  return (
    <div>
      {!onboardingComplete && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800">Complete your setup</p>
            <p className="text-sm text-amber-700">Finish onboarding to get your site ready for customers.</p>
          </div>
          <a href="/admin/onboarding" className="ml-4 px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600">
            Finish Setup →
          </a>
        </div>
      )}

      <PlanOverviewCard />

      {!demoActive && tenantId && (
        <DemoControls tenantId={tenantId} onSeeded={onDemoSeeded} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: totalLeads, icon: Users, color: '#3b82f6' },
          { label: 'New This Month', value: newThisMonth, icon: ArrowUp, color: '#10b981' },
          { label: 'New This Week', value: newThisWeek, icon: TrendingUp, color: '#f59e0b' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: BarChart3, color: '#a855f7' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {totalLeads === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-semibold text-gray-900 mb-1">No leads yet</p>
          <p className="text-gray-500 text-sm">Your quote form is live and ready! Leads will appear here as they come in.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Per Month</h3>
            <div className="h-48 flex items-end gap-3 px-2">
              {monthlyLeads.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-xs text-gray-500 font-medium mb-1">{m.count}</span>
                  <div className="w-full rounded-t-md bg-emerald-500" style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '8px' : '2px' }} />
                  <span className="text-xs text-gray-400 mt-2">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h3>
            <div className="space-y-0">
              {recentLeads.map((lead, i) => (
                <div key={lead.id} className={`flex items-center justify-between py-3 ${i < recentLeads.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                    <p className="text-xs text-gray-400">
                      {(lead.services || []).join(', ') || 'General inquiry'} · {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {statusBadge(lead.status)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink label="View All Leads" icon="📋" tab="crm" />
          <QuickLink label="Edit Site Content" icon="📝" tab="content" />
          <QuickLink label="Manage SEO" icon="🔍" tab="seo" />
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium text-gray-700">
            🌐 View Live Site
          </a>
        </div>
      </div>
    </div>
  )
}
