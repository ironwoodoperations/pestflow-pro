import PageHelpBanner from './PageHelpBanner'
import CommonGate from '../common/FeatureGate'
import { FeatureGate } from './FeatureGate'
import { useSeoTab } from './seo/useSeoTab'
import SeoOverviewTab from './seo/SeoOverviewTab'
import SeoPagesTab from './seo/SeoPagesTab'
import SeoKeywordsTab from './seo/SeoKeywordsTab'
import SeoAioTab from './seo/SeoAioTab'
import SeoConnectTab from './seo/SeoConnectTab'
import type { SeoTabId } from './seo/seoTypes'

const TABS: { id: SeoTabId; label: string }[] = [
  { id: 'overview',  label: '📊 Overview'   },
  { id: 'pages',     label: '📄 Pages'      },
  { id: 'keywords',  label: '🔍 Keywords'   },
  { id: 'aio',       label: '✨ AI Optimize' },
  { id: 'connect',   label: '🔗 Connect'    },
]

export default function SEOTab() {
  const {
    activeTab, setActiveTab, loading, integrations, stats, coverage,
    openEditorSlug, editorForm, editorSaving, connectForm, connectSaving,
    lastAudit, auditLoading, auditMode, pages,
    handleOpenEditor, handleCloseEditor, handleEditorChange, handleSaveMeta,
    handleConnectChange, handleConnectSave, handleRunCheckNow,
    setAuditMode, runLighthouseAudit,
  } = useSeoTab()

  if (loading) return <div className="p-8 text-center text-gray-400">Loading SEO data…</div>

  return (
    <div>
      <PageHelpBanner tab="seo" title="🔍 SEO Dashboard"
        body="Optimize your search engine rankings. Use the Overview tab to see your site health, Pages to edit meta tags, Keywords for research, and Connect to link data sources." />

      <CommonGate tier={2}>
        <div className="flex border-b border-gray-200 mb-6 gap-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.label}
              {tab.id === 'pages' && stats.issuesFound > 0 && (
                <span className="ml-1.5 w-2 h-2 bg-red-500 rounded-full inline-block" />
              )}
              {tab.id === 'connect' && integrations.google_api_key && (
                <span className="ml-1.5 w-2 h-2 bg-emerald-500 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <SeoOverviewTab stats={stats} coverage={coverage} integrations={integrations}
            lastAudit={lastAudit} auditLoading={auditLoading} auditMode={auditMode}
            onSetAuditMode={setAuditMode} onRunAudit={runLighthouseAudit}
            onGoToConnect={() => setActiveTab('connect')} />
        )}
        {activeTab === 'pages' && (
          <SeoPagesTab stats={stats} pages={pages} openEditorSlug={openEditorSlug}
            editorForm={editorForm} editorSaving={editorSaving}
            onOpenEditor={handleOpenEditor} onCloseEditor={handleCloseEditor}
            onEditorChange={handleEditorChange} onSaveMeta={handleSaveMeta} />
        )}
        {activeTab === 'keywords' && (
          <FeatureGate minTier={3} featureName="AI Keyword Research">
            <SeoKeywordsTab />
          </FeatureGate>
        )}
        {activeTab === 'aio' && (
          <FeatureGate minTier={3} featureName="AIO Structured Data">
            <SeoAioTab />
          </FeatureGate>
        )}
        {activeTab === 'connect' && (
          <SeoConnectTab integrations={integrations} connectForm={connectForm}
            connectSaving={connectSaving} onChange={handleConnectChange}
            onSave={handleConnectSave} onRunCheckNow={handleRunCheckNow} />
        )}
      </CommonGate>
    </div>
  )
}
