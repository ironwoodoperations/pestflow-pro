import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import {
  FileText, Search, BookOpen, Share2, Star,
  MapPin, BarChart3, Users, Settings, LogOut, ExternalLink
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
import PageHelpBanner from '../../components/admin/PageHelpBanner'

const TABS = [
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'seo', label: 'SEO', icon: Search },
  { key: 'blog', label: 'Blog', icon: BookOpen },
  { key: 'social', label: 'Social', icon: Share2 },
  { key: 'testimonials', label: 'Testimonials', icon: Star },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'crm', label: 'CRM', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_COMPONENTS: Record<TabKey, React.FC> = {
  content: ContentTab,
  seo: SEOTab,
  blog: BlogTab,
  social: SocialTab,
  testimonials: TestimonialsTab,
  locations: LocationsTab,
  reports: ReportsTab,
  crm: CRMTab,
  settings: SettingsTab,
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('content')
  const [businessName, setBusinessName] = useState('Your Business')
  const { tenantId } = useTenant()
  const navigate = useNavigate()

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'business_info')
      .single()
      .then(({ data }) => {
        if (data?.value?.name) setBusinessName(data.value.name)
      })
  }, [tenantId])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab]
  const activeLabel = TABS.find(t => t.key === activeTab)?.label || ''

  return (
    <div className="flex min-h-screen bg-[var(--admin-bg)]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-[var(--admin-sidebar-border)] flex flex-col">
        <div className="p-6">
          <h1 className="font-bangers text-2xl text-orange-500 tracking-wide">PestFlow Pro</h1>
          <p className="text-gray-400 text-sm mt-1 truncate">{businessName}</p>
        </div>

        <nav className="flex-1 px-3">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-1 ${
                activeTab === key
                  ? 'text-orange-500 bg-orange-500/10 border-l-[3px] border-orange-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--admin-sidebar-border)]">
          <h2 className="text-lg font-semibold text-white">{activeLabel}</h2>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition"
          >
            View Site <ExternalLink size={14} />
          </a>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <PageHelpBanner tab={activeTab} />
          <ActiveComponent />
        </div>
      </main>
    </div>
  )
}
