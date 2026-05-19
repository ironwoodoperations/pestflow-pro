import { PageSpeedPanel } from './SeoConnectPreviews'
import { FeatureGate } from '../../common/FeatureGate'
import SeoAnalyticsTile from '../reports/SeoAnalyticsTile'
import GscAnalyticsTile from './GscAnalyticsTile'

function DataSourceCard({ icon, title, description, status, statusLabel, children, actionLabel, actionUrl }: {
  icon: string; title: string; description: string
  status: 'connected' | 'active' | 'not-connected'
  statusLabel?: string; children?: React.ReactNode
  actionLabel?: string; actionUrl?: string
}) {
  const badgeStyles = {
    connected: 'bg-emerald-100 text-emerald-700',
    active: 'bg-emerald-100 text-emerald-700',
    'not-connected': 'bg-gray-100 text-gray-500',
  }
  const defaultLabels = { connected: '● Connected', active: '● Active', 'not-connected': 'Not Connected' }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[status]}`}>
          {statusLabel ?? defaultLabels[status]}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      {children}
      {actionLabel && actionUrl && (
        <button onClick={() => window.open(actionUrl, '_blank')}
          className={`mt-3 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
            status !== 'not-connected'
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}>
          {actionLabel} →
        </button>
      )}
    </div>
  )
}

// S228 Phase 4b: pruned to the data sources that actually deliver value here —
// PageSpeed (live), S227 SEO Analytics (live). Vercel Analytics link-out removed
// S231 Phase 0 (orphan, no usage path). GSC/GA4 OAuth tiles added S230/S231.
export default function SeoConnectTab() {
  return (
    <div>
      <div className="mb-5">
        <h3 className="font-semibold text-gray-800">Connect Data Sources</h3>
        <p className="text-sm text-gray-500 mt-0.5">Each connection unlocks more insight into how your site is performing.</p>
      </div>

      <DataSourceCard icon="⚡" title="Google PageSpeed Insights"
        description="Performance scores, Lighthouse audit, accessibility and SEO scores. Powers the Overview tab."
        status="active" statusLabel="Active — No Setup Required">
        <PageSpeedPanel />
      </DataSourceCard>

      <FeatureGate minTier={3} featureName="SEO Analytics">
        <div className="mt-6">
          <SeoAnalyticsTile />
        </div>
      </FeatureGate>

      <div className="mt-6">
        <GscAnalyticsTile />
      </div>
    </div>
  )
}
