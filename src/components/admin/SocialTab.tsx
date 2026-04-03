import { useState } from 'react'
import { FeatureGate } from './FeatureGate'
import PageHelpBanner from './PageHelpBanner'
import { useSocialData } from './social/useSocialData'
import CampaignsTab from './social/CampaignsTab'
import ContentQueueTab from './social/ContentQueueTab'
import AnalyticsTab from './social/AnalyticsTab'
import ConnectionsModal from './social/ConnectionsModal'
import LegacyComposer from './social/LegacyComposer'

type TabId = 'campaigns' | 'queue' | 'analytics'

const TABS: { id: TabId; label: string }[] = [
  { id: 'campaigns', label: '📅 Campaigns' },
  { id: 'queue',     label: '📋 Content Queue' },
  { id: 'analytics', label: '📊 Analytics' },
]

export default function SocialTab() {
  const { posts, campaigns, integrations, loading, refresh } = useSocialData()
  const [activeTab, setActiveTab] = useState<TabId>('queue')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [showConnections, setShowConnections] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)

  const failedCount = posts.filter(p => p.status === 'failed').length

  if (loading) return <div className="p-8 text-center text-gray-400">Loading social data…</div>

  return (
    <div>
      <PageHelpBanner tab="social" title="📱 Social Media"
        body="Manage your social media campaigns, review and approve posts, and connect your preferred publishing platform." />

      <FeatureGate minTier={2} featureName="Social Media Scheduler">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Social Media</h2>
          <div className="flex gap-2">
            <FeatureGate minTier={3} featureName="AI Post Generation">
              <button onClick={() => setShowNewPost(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                + New Post
              </button>
            </FeatureGate>
            <FeatureGate minTier={3} featureName="Social Media Connections">
              <button onClick={() => setShowConnections(true)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Connections
              </button>
            </FeatureGate>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.id === 'queue' && failedCount > 0 && (
                <span className="ml-1.5 w-2 h-2 bg-red-500 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'campaigns' && (
          <FeatureGate minTier={3} featureName="Campaign Batch Posting">
            <CampaignsTab campaigns={campaigns} posts={posts}
              selectedCampaignId={selectedCampaignId}
              onCampaignSelect={id => { setSelectedCampaignId(id); if (id) setActiveTab('queue') }}
              onRefresh={refresh} />
          </FeatureGate>
        )}
        {activeTab === 'queue' && (
          <ContentQueueTab posts={posts} campaigns={campaigns}
            selectedCampaignId={selectedCampaignId} onRefresh={refresh} />
        )}
        {activeTab === 'analytics' && (
          <FeatureGate minTier={4} featureName="Social Analytics">
            <AnalyticsTab posts={posts} integrations={integrations}
              onOpenConnections={() => setShowConnections(true)} />
          </FeatureGate>
        )}

        {/* Modals */}
        {showConnections && (
          <ConnectionsModal integrations={integrations}
            onClose={() => setShowConnections(false)} onSaved={refresh} />
        )}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowNewPost(false)}>
            <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl p-6 my-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <LegacyComposer onClose={() => setShowNewPost(false)} onPosted={() => { refresh(); setShowNewPost(false) }} />
            </div>
          </div>
        )}
      </FeatureGate>
    </div>
  )
}
