import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { PreviewModeContext } from '../../hooks/usePreviewMode'
import {
  FileText, Search, BookOpen, Share2, Star,
  MapPin, BarChart3, Users, Settings, LogOut, ExternalLink, Eye, EyeOff,
  TrendingUp, ArrowUp
} from 'lucide-react'
const ContentTab    = lazy(() => import('../../components/admin/ContentTab'))
const SEOTab        = lazy(() => import('../../components/admin/SEOTab'))
const BlogTab       = lazy(() => import('../../components/admin/BlogTab'))
const SocialTab     = lazy(() => import('../../components/admin/SocialTab'))
const TestimonialsTab = lazy(() => import('../../components/admin/TestimonialsTab'))
const LocationsTab  = lazy(() => import('../../components/admin/LocationsTab'))
const ReportsTab    = lazy(() => import('../../components/admin/ReportsTab'))
const CRMTab        = lazy(() => import('../../components/admin/CRMTab'))
const SettingsTab   = lazy(() => import('../../components/admin/settings/SettingsTab'))

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'seo', label: 'SEO', icon: Search },
  { key: 'blog', label: 'Blog', icon: BookOpen },
  { key: 'social', label: 'Social', icon: Share2 },
  { key: 'testimonials', label: 'Testimonials', icon: Star },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'reports', label: 'Reports', icon: TrendingUp },
  { key: 'crm', label: 'CRM', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [businessName, setBusinessName] = useState('Your Business')
  const [previewMode, setPreviewMode] = useState(false)
  const { tenantId } = useTenant()
  const navigate = useNavigate()

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').single()
      .then(({ data }) => { if (data?.value?.name) setBusinessName(data.value.name) })
  }, [tenantId])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const activeLabel = TABS.find(t => t.key === activeTab)?.label || ''
  const tabSubtitles: Record<string, string> = {
    dashboard: 'Overview of your pest control business',
    content: 'Manage page content across your website',
    seo: 'Optimize your search engine rankings',
    blog: 'Create and manage blog posts',
    social: 'Schedule and manage social media',
    testimonials: 'Manage customer reviews and testimonials',
    locations: 'Manage service area locations',
    reports: 'Business analytics and reports',
    crm: 'Track leads and customer relationships',
    settings: 'Configure your business settings',
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#1a1f2e' }}>
        <div className="px-6 py-5" style={{ background: '#141922' }}>
          <h1 className="font-oswald text-xl text-white tracking-wide">PestFlow Pro</h1>
          <p className="text-gray-400 text-xs uppercase tracking-widest mt-0.5">Operations Platform</p>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-current={activeTab === key ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 mx-0 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === key
                  ? 'bg-[#1a3d2b] text-white border-l-4 border-emerald-500'
                  : 'text-gray-300 hover:bg-[#22304a] hover:text-white border-l-4 border-transparent'
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-white/10">
          <p className="px-4 py-1 text-xs text-gray-500 truncate mb-1">{businessName}</p>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-[#f1f5f9]">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activeLabel}</h1>
              <p className="text-gray-500 text-sm mt-1">{tabSubtitles[activeTab] || ''}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setPreviewMode(!previewMode)} title="Preview the admin dashboard as your client sees it (read-only)" className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition ${previewMode ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'text-gray-400 hover:text-gray-600 border border-gray-200'}`}>
                {previewMode ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                {previewMode ? 'Exit Preview' : 'Client Preview'}
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 transition">
                View Site <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Preview Mode Banner */}
        {previewMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center gap-3">
            <Eye size={16} className="text-amber-600" aria-hidden="true" />
            <p className="text-sm text-amber-800 font-medium">Client Preview Mode — All editing is disabled. Share this view with your client during handoff.</p>
            <button onClick={() => setPreviewMode(false)} className="ml-auto text-sm text-amber-600 hover:text-amber-800 font-medium underline">Exit Preview</button>
          </div>
        )}

        {/* Tab Content */}
        <PreviewModeContext.Provider value={previewMode}>
          <div className={`p-8 ${previewMode ? 'pointer-events-none select-none opacity-90' : ''}`} style={previewMode ? { pointerEvents: 'none' } : undefined}>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400 text-sm">Loading...</div>
              </div>
            }>
              {activeTab === 'dashboard' && <DashboardHome />}
              {activeTab === 'content' && <ContentTab />}
              {activeTab === 'seo' && <SEOTab />}
              {activeTab === 'blog' && <BlogTab />}
              {activeTab === 'social' && <SocialTab />}
              {activeTab === 'testimonials' && <TestimonialsTab />}
              {activeTab === 'locations' && <LocationsTab />}
              {activeTab === 'reports' && <ReportsTab />}
              {activeTab === 'crm' && <CRMTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </Suspense>
          </div>
        </PreviewModeContext.Provider>
      </main>
    </div>
  )
}

function DashboardHome() {
  const { tenantId } = useTenant()
  const [leads, setLeads] = useState<{ id: string; name: string; status: string; created_at: string; services: string[] | null }[]>([])
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

  // Leads per month — last 6 months
  const monthlyLeads: { label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const count = leads.filter(l => { const c = new Date(l.created_at); return c >= d && c < nextMonth }).length
    monthlyLeads.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), count })
  }
  const maxMonthly = Math.max(...monthlyLeads.map(m => m.count), 1)

  const recentLeads = leads.slice(0, 5)

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

  if (loading) return <p className="text-gray-400 p-4">Loading dashboard...</p>

  return (
    <div>
      {/* Stats Cards */}
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
          {/* Leads Per Month Chart */}
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

          {/* Recent Leads */}
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

      {/* Quick Links */}
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
