import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { PreviewModeContext } from '../../hooks/usePreviewMode'
import { usePlan } from '../../hooks/usePlan'
import {
  FileText, Search, BookOpen, Share2, Star,
  MapPin, BarChart3, Users, Settings, LogOut, ExternalLink, Eye, EyeOff,
  TrendingUp, Lock, CreditCard
} from 'lucide-react'
import TierToggle from '../../components/admin/TierToggle'
import NotificationBell from '../../components/admin/NotificationBell'
import DashboardHome from '../../components/admin/dashboard/DashboardHome'
import DemoBanner from '../../components/admin/DemoBanner'
import { resetDemoData } from '../../lib/demoSeed'

const ContentTab    = lazy(() => import('../../components/admin/ContentTab'))
const SEOTab        = lazy(() => import('../../components/admin/SEOTab'))
const BlogTab       = lazy(() => import('../../components/admin/BlogTab'))
const SocialTab     = lazy(() => import('../../components/admin/SocialTab'))
const TestimonialsTab = lazy(() => import('../../components/admin/TestimonialsTab'))
const LocationsTab  = lazy(() => import('../../components/admin/LocationsTab'))
const ReportsTab    = lazy(() => import('../../components/admin/ReportsTab'))
const CRMTab        = lazy(() => import('../../components/admin/CRMTab'))
const SettingsTab   = lazy(() => import('../../components/admin/settings/SettingsTab'))
const TeamTab          = lazy(() => import('../../components/admin/team/TeamTab'))
const BillingTab       = lazy(() => import('../../components/admin/BillingTab'))
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
  { key: 'team', label: 'Team', icon: Users },
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_SUBTITLES: Record<string, string> = {
  dashboard: 'Overview of your pest control business',
  content: 'Manage page content across your website',
  seo: 'Optimize your search engine rankings',
  blog: 'Create and manage blog posts',
  social: 'Schedule and manage social media',
  testimonials: 'Manage customer reviews and testimonials',
  locations: 'Manage service area locations',
  reports: 'Business analytics and reports',
  crm: 'Track leads and customer relationships',
  team: 'Manage your team members shown on your website',
  billing: 'Your current plan and payment history',
  settings: 'Configure your business settings',
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [businessName, setBusinessName] = useState('Your Business')
  const [accentColor, setAccentColor] = useState('#10b981')
  const [onboardingComplete] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [demoActive, setDemoActive] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#16a34a')
  const [template, setTemplate] = useState('')
  const { tenantId } = useTenant()
  const { canAccess } = usePlan()
  const navigate = useNavigate()

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'demo_mode').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
    ]).then(([bizRes, demoRes, brandRes]) => {
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      setDemoActive(demoRes.data?.value?.active === true)
      if (brandRes.data?.value?.accent_color) setAccentColor(brandRes.data.value.accent_color)
      if (brandRes.data?.value?.primary_color) setPrimaryColor(brandRes.data.value.primary_color)
      if (brandRes.data?.value?.logo_url) setLogoUrl(brandRes.data.value.logo_url)
      if (brandRes.data?.value?.template) setTemplate(brandRes.data.value.template)
    })
  }, [tenantId])

  const handleGoLive = async () => {
    if (!tenantId) return
    if (!window.confirm('This will delete all demo data. Are you sure you want to go live?')) return
    await resetDemoData(tenantId, supabase)
    setDemoActive(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ '--admin-accent': accentColor } as React.CSSProperties}>
      {demoActive && <DemoBanner onGoLive={handleGoLive} />}
      <div className="flex flex-1">
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: template === 'dang' ? '#0a0a0a' : '#1a1f2e', '--brand-primary': primaryColor, '--brand-accent': accentColor } as React.CSSProperties}>
        <div className="px-6 py-5" style={{ background: template === 'dang' ? '#0a0a0a' : '#141922', borderBottom: template === 'dang' ? '1px solid #1a1a1a' : undefined }}>
          <h1 className="font-oswald text-xl text-white tracking-wide">PestFlow Pro</h1>
          <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: template === 'dang' ? '#e5e7eb' : undefined }}>Operations Platform</p>
          {logoUrl && (
            <img src={logoUrl} alt="logo" style={{ maxHeight: '40px', maxWidth: '120px', objectFit: 'contain', marginTop: '8px' }} />
          )}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => {
            const gatedTabs: Record<string, number> = { blog: 2, seo: 2, social: 2, reports: 2 }
            const locked = gatedTabs[key] ? !canAccess(gatedTabs[key]) : false
            const isDangActive = template === 'dang' && activeTab === key
            const isDangInactive = template === 'dang' && activeTab !== key
            return (
              <button key={key} onClick={() => setActiveTab(key)} aria-current={activeTab === key ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 mx-0 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeTab === key
                    ? 'text-white border-l-4'
                    : template === 'dang'
                      ? 'border-l-4 border-transparent'
                      : 'text-gray-300 hover:bg-[#22304a] hover:text-white border-l-4 border-transparent'
                } ${locked ? 'opacity-50' : ''}`}
                style={isDangActive
                  ? { borderLeftColor: '#F97316', backgroundColor: '#F97316', color: '#ffffff' }
                  : isDangInactive
                    ? { color: '#e5e7eb' }
                    : activeTab === key
                      ? { borderLeftColor: primaryColor, backgroundColor: primaryColor + '26' }
                      : undefined
                }>
                <Icon size={20} aria-hidden="true" />
                <span className="flex-1 text-left">{label}</span>
                {locked && <span title="Upgrade to Grow to unlock"><Lock className="w-3.5 h-3.5 shrink-0" style={{ color: template === 'dang' ? '#fbbf24' : undefined }} /></span>}
              </button>
            )
          })}
        </nav>
        <TierToggle />
        <div className="px-2 py-4" style={{ borderTop: template === 'dang' ? '1px solid #1a1a1a' : '1px solid rgba(255,255,255,0.1)' }}>
          <p className="px-4 py-1 text-xs truncate mb-1" style={{ color: template === 'dang' ? '#e5e7eb' : undefined, opacity: template === 'dang' ? 0.6 : undefined }}>{businessName}</p>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen bg-[#f1f5f9]">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{TABS.find(t => t.key === activeTab)?.label}</h1>
              <p className="text-gray-500 text-sm mt-1">{TAB_SUBTITLES[activeTab] || ''}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell onNavigateToLeads={() => setActiveTab('crm')} />
              <button onClick={() => setPreviewMode(!previewMode)} title="Preview the admin dashboard as your client sees it (read-only)"
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition ${previewMode ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'text-gray-400 hover:text-gray-600 border border-gray-200'}`}>
                {previewMode ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                {previewMode ? 'Exit Preview' : 'Client Preview'}
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 transition">
                View Site <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        {previewMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center gap-3">
            <Eye size={16} className="text-amber-600" aria-hidden="true" />
            <p className="text-sm text-amber-800 font-medium">Client Preview Mode — All editing is disabled. Share this view with your client during handoff.</p>
            <button onClick={() => setPreviewMode(false)} className="ml-auto text-sm text-amber-600 hover:text-amber-800 font-medium underline">Exit Preview</button>
          </div>
        )}

        <PreviewModeContext.Provider value={previewMode}>
          <div className={`p-8 ${previewMode ? 'pointer-events-none select-none opacity-90' : ''}`} style={previewMode ? { pointerEvents: 'none' } : undefined}>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-gray-400 text-sm">Loading...</div></div>}>
              {activeTab === 'dashboard' && <DashboardHome onboardingComplete={onboardingComplete} demoActive={demoActive} onDemoSeeded={() => setDemoActive(true)} onNavigate={(tab) => setActiveTab(tab as TabKey)} />}
              {activeTab === 'content' && <ContentTab />}
              {activeTab === 'seo' && <SEOTab />}
              {activeTab === 'blog' && <BlogTab />}
              {activeTab === 'social' && <SocialTab onNavigate={(t) => setActiveTab(t as TabKey)} />}
              {activeTab === 'testimonials' && <TestimonialsTab />}
              {activeTab === 'locations' && <LocationsTab />}
              {activeTab === 'reports' && <ReportsTab />}
              {activeTab === 'crm' && <CRMTab />}
              {activeTab === 'team' && <TeamTab />}
              {activeTab === 'billing' && <BillingTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </Suspense>
          </div>
        </PreviewModeContext.Provider>
      </main>
      </div>
    </div>
  )
}
