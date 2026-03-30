import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import {
  FileText, Search, BookOpen, Share2, Star,
  MapPin, BarChart3, Users, Settings, LogOut, ExternalLink,
  DollarSign, Calendar, Wrench, ClipboardList, AlertTriangle, TrendingUp
} from 'lucide-react'
import ContentTab from '../../components/admin/ContentTab'
import SEOTab from '../../components/admin/SEOTab'
import BlogTab from '../../components/admin/BlogTab'
import SocialTab from '../../components/admin/SocialTab'
import TestimonialsTab from '../../components/admin/TestimonialsTab'
import LocationsTab from '../../components/admin/LocationsTab'
import ReportsTab from '../../components/admin/ReportsTab'
import CRMTab from '../../components/admin/CRMTab'
import SettingsTab from '../../components/admin/settings/SettingsTab'

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
          <h1 className="font-bangers text-xl text-white tracking-wide">PestFlow Pro</h1>
          <p className="text-gray-400 text-xs uppercase tracking-widest mt-0.5">Operations Platform</p>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 mx-0 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-[#1a3d2b] text-white border-l-4 border-emerald-500'
                  : 'text-gray-300 hover:bg-[#22304a] hover:text-white border-l-4 border-transparent'
              }`}
            >
              <Icon size={20} />
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
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 transition">
              View Site <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
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
        </div>
      </main>
    </div>
  )
}

function DashboardHome() {
  const stats = [
    { label: 'Revenue', value: '$12,450', trend: '+12.5%', trendUp: true, icon: DollarSign, color: '#10b981' },
    { label: 'Active Customers', value: '248', trend: '+8 this month', trendUp: true, icon: Users, color: '#3b82f6' },
    { label: "Today's Jobs", value: '6', trend: '2 remaining', trendUp: true, icon: Calendar, color: '#f97316' },
    { label: 'Technicians', value: '4', trend: 'All active', trendUp: true, icon: Wrench, color: '#a855f7' },
    { label: 'Pending Quotes', value: '12', trend: '3 new today', trendUp: true, icon: ClipboardList, color: '#475569' },
    { label: 'Overdue Invoices', value: '2', trend: '$1,200 total', trendUp: false, icon: AlertTriangle, color: '#ef4444' },
  ]

  const recentJobs = [
    { customer: 'Johnson Residence', service: 'Quarterly Pest Control', date: 'Today, 2:00 PM', status: 'scheduled' },
    { customer: 'Smith Family Home', service: 'Termite Inspection', date: 'Today, 10:30 AM', status: 'completed' },
    { customer: 'Davis Commercial', service: 'Mosquito Treatment', date: 'Yesterday, 3:00 PM', status: 'completed' },
    { customer: 'Wilson Apartments', service: 'Roach Control', date: 'Yesterday, 11:00 AM', status: 'in_progress' },
    { customer: 'Brown Residence', service: 'Spider Treatment', date: 'Mar 28, 9:00 AM', status: 'completed' },
  ]

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      in_progress: 'bg-amber-100 text-amber-700',
      overdue: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      scheduled: 'Scheduled', completed: 'Completed', in_progress: 'In Progress', overdue: 'Overdue',
    }
    const dots: Record<string, string> = {
      scheduled: 'bg-blue-500', completed: 'bg-emerald-500', in_progress: 'bg-amber-500', overdue: 'bg-red-500',
    }
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dots[status] || 'bg-gray-400'}`} />
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
          {labels[status] || status}
        </span>
      </div>
    )
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className={`text-sm font-medium mt-1 ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>{stat.trend}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: stat.color }}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-48 flex items-end gap-2 px-4">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: `rgba(16, 185, 129, ${0.3 + (h / 150)})` }} />
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs text-gray-400 px-4">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h3>
          <div className="space-y-0">
            {recentJobs.map((job, i) => (
              <div key={i} className={`flex items-center justify-between py-3 ${i < recentJobs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{job.customer}</p>
                  <p className="text-xs text-gray-400">{job.service} · {job.date}</p>
                </div>
                {statusBadge(job.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
