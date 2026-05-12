import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TeamTab         = lazy(() => import('../components/ironwood/TeamTab'))
const PipelineBoard   = lazy(() => import('../components/ironwood/PipelineBoard'))
const ReportsTab      = lazy(() => import('../components/ironwood/ReportsTab'))
const ProspectList    = lazy(() => import('../components/ironwood/ProspectList'))
const IntegrationsTab = lazy(() => import('../components/ironwood/IntegrationsTab'))
const SupportPanel    = lazy(() => import('../components/ironwood/SupportPanel'))
const RevealQueue     = lazy(() => import('../components/ironwood/RevealQueue'))
const AllClients      = lazy(() => import('../components/ironwood/AllClients'))
const TrainingManual  = lazy(() => import('../components/ironwood/TrainingManual'))
const IronwoodSEO     = lazy(() => import('../components/ironwood/IronwoodSEO'))
const IronwoodSocial  = lazy(() => import('../components/ironwood/IronwoodSocial'))

type Tab = 'pipeline' | 'prospects' | 'reveal_queue' | 'all_clients' | 'reports' | 'integrations' | 'team' | 'support' | 'training' | 'seo' | 'social'

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'pipeline',     label: 'Pipeline',         icon: '📋' },
  { id: 'prospects',    label: 'Prospects',        icon: '👤' },
  { id: 'reveal_queue', label: 'Reveal Queue',     icon: '✅' },
  { id: 'all_clients',  label: 'All Clients',      icon: '🌐' },
  { id: 'reports',      label: 'Reports',          icon: '📊' },
  { id: 'integrations', label: 'Integrations',     icon: '🔑' },
  { id: 'team',         label: 'Team',             icon: '👥' },
  { id: 'support',      label: 'Support',          icon: '🎟️' },
  { id: 'training',     label: 'Training Manual',  icon: '📖' },
  { id: 'seo',          label: 'SEO',              icon: '🔍' },
  { id: 'social',       label: 'Social',           icon: '📣' },
]

const SPIN = <div className="p-8 text-gray-500 text-sm">Loading...</div>

export default function IronwoodOps() {
  const [tab, setTab] = useState<Tab>('pipeline')
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const IRONWOOD_ALLOWED = ['admin@pestflowpro.com', 'murphygurl92@gmail.com']
      if (!IRONWOOD_ALLOWED.includes(data.user?.email ?? '')) {
        navigate('/ironwood/login', { replace: true })
      } else {
        setChecking(false)
      }
    })
  }, [navigate])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-gray-400 text-sm">Verifying access…</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="text-sm font-bold text-emerald-400 tracking-wide">IRONWOOD OPS</div>
          <div className="text-xs text-gray-500 mt-0.5">PestFlow Pro CRM</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                tab === id
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-800 space-y-0.5">
          <a
            href="/sales-deck.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <span>🎯</span>Sales Deck
          </a>
        </div>
        <div className="px-4 py-3 border-t border-gray-800">
          <div className="text-xs text-gray-600">admin@pestflowpro.com</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        <Suspense fallback={SPIN}>
          {tab === 'pipeline'     && <PipelineBoard />}
          {tab === 'prospects'    && <ProspectList />}
          {tab === 'reveal_queue' && <RevealQueue />}
          {tab === 'all_clients'  && <AllClients />}
          {tab === 'reports'      && <ReportsTab />}
          {tab === 'integrations' && <IntegrationsTab />}
          {tab === 'team'         && <TeamTab />}
          {tab === 'support'      && <SupportPanel />}
          {tab === 'training'     && <TrainingManual />}
          {tab === 'seo'          && <IronwoodSEO />}
          {tab === 'social'       && <IronwoodSocial />}
        </Suspense>
      </main>
    </div>
  )
}
