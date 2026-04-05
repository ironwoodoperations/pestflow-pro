import { useState } from 'react'
import { FileText, LayoutGrid } from 'lucide-react'
import { usePlan } from '../../hooks/usePlan'
import { FeatureGate } from '../common/FeatureGate'
import PageHelpBanner from './PageHelpBanner'
import { useSocialData } from './social/useSocialData'
import CampaignsTab from './social/CampaignsTab'
import ContentQueueTab from './social/ContentQueueTab'
import SocialAnalyticsTab from './social/SocialAnalyticsTab'
import ConnectionsModal from './social/ConnectionsModal'
import LegacyComposer from './social/LegacyComposer'
import NewCampaignModal from './social/NewCampaignModal'
import SocialUpgradeNudge from './social/SocialUpgradeNudge'

interface Props {
  onNavigate?: (tab: string) => void
}

type TabId = 'campaigns' | 'queue' | 'analytics'
const TABS: { id: TabId; label: string }[] = [
  { id: 'campaigns', label: '📅 Campaigns' },
  { id: 'queue',     label: '📋 Content Queue' },
  { id: 'analytics', label: '📊 Analytics' },
]

type PostFlow = 'none' | 'choice' | 'single' | 'campaign'

export default function SocialTab({ onNavigate }: Props) {
  const { posts, campaigns, integrations, loading, refresh } = useSocialData()
  const { canAccess } = usePlan()
  const [activeTab, setActiveTab] = useState<TabId>('queue')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [showConnections, setShowConnections] = useState(false)
  const [postFlow, setPostFlow] = useState<PostFlow>('none')

  const failedCount = posts.filter(p => p.status === 'failed').length

  if (loading) return <div className="p-8 text-center text-gray-400">Loading social data…</div>

  return (
    <div>
      <PageHelpBanner tab="social" title="📱 Social Media"
        body="Plan campaigns, queue posts for approval, and track your social media performance — all in one place." />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Social Media</h2>
        <div className="flex gap-2">
          {/* + New Post: available to all tiers (Hands On) */}
          <button onClick={() => setPostFlow('choice')}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            + New Post
          </button>
          {/* Connections: DIY — Grow and above (tier 2+) */}
          <FeatureGate minTier={2} featureName="Social Connections">
            <button onClick={() => setShowConnections(true)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Connections
            </button>
          </FeatureGate>
        </div>
      </div>

      {/* Tab bar — labels always visible */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
            {tab.id === 'queue' && failedCount > 0 && <span className="ml-1.5 w-2 h-2 bg-red-500 rounded-full inline-block" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'campaigns' && (
        /* Semi-Auto — Pro and above (tier 3+) */
        canAccess(3) ? (
          <CampaignsTab campaigns={campaigns} posts={posts}
            selectedCampaignId={selectedCampaignId}
            onCampaignSelect={id => { setSelectedCampaignId(id); if (id) setActiveTab('queue') }}
            onRefresh={refresh} />
        ) : (
          <SocialUpgradeNudge planName="Pro" price="$349" onNavigate={onNavigate} />
        )
      )}

      {/* Content Queue — no gate, all tiers */}
      {activeTab === 'queue' && (
        <ContentQueueTab posts={posts} campaigns={campaigns}
          selectedCampaignId={selectedCampaignId} onRefresh={refresh} />
      )}

      {activeTab === 'analytics' && (
        /* Full Autopilot — Elite only (tier 4) */
        canAccess(4) ? (
          <SocialAnalyticsTab />
        ) : (
          <SocialUpgradeNudge planName="Elite" price="$499" onNavigate={onNavigate} />
        )
      )}

      {/* Choice modal */}
      {postFlow === 'choice' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPostFlow('none')}>
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">What would you like to create?</h3>
            <p className="text-sm text-gray-500 mb-5">Choose a post type to get started.</p>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <button onClick={() => setPostFlow('single')}
                className="border-2 border-gray-200 rounded-xl p-5 text-left hover:border-emerald-500 hover:bg-emerald-50 transition group">
                <FileText className="w-8 h-8 text-gray-400 group-hover:text-emerald-500 mb-3 transition" />
                <p className="font-semibold text-gray-900 text-sm">Single Post</p>
                <p className="text-xs text-gray-500 mt-1">Create and schedule one post for a specific date.</p>
                <span className="mt-3 inline-block text-xs font-medium text-emerald-600">Create Single Post →</span>
              </button>
              <button onClick={() => setPostFlow('campaign')}
                className="border-2 border-gray-200 rounded-xl p-5 text-left hover:border-emerald-500 hover:bg-emerald-50 transition group">
                <LayoutGrid className="w-8 h-8 text-gray-400 group-hover:text-emerald-500 mb-3 transition" />
                <p className="font-semibold text-gray-900 text-sm">Campaign</p>
                <p className="text-xs text-gray-500 mt-1">Plan a series of posts around a theme or promotion.</p>
                <span className="mt-3 inline-block text-xs font-medium text-emerald-600">Start a Campaign →</span>
              </button>
            </div>
            <button onClick={() => setPostFlow('none')} className="text-sm text-gray-400 hover:text-gray-600 w-full text-center">Cancel</button>
          </div>
        </div>
      )}

      {/* Single post composer */}
      {postFlow === 'single' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPostFlow('none')}>
          <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl p-6 my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <LegacyComposer onClose={() => setPostFlow('none')} onPosted={() => { refresh(); setPostFlow('none') }} />
          </div>
        </div>
      )}

      {/* Campaign creation */}
      {postFlow === 'campaign' && (
        <NewCampaignModal onClose={() => setPostFlow('none')} onCreated={() => { refresh(); setPostFlow('none'); setActiveTab('campaigns') }} />
      )}

      {/* Connections modal */}
      {showConnections && (
        <ConnectionsModal integrations={integrations} onClose={() => setShowConnections(false)} onSaved={refresh} />
      )}
    </div>
  )
}
