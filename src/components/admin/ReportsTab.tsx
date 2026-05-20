import { FeatureGate } from '../common/FeatureGate'
import PageHelpBanner from './PageHelpBanner'
import AnalyticsHub from './analytics/AnalyticsHub'

export default function ReportsTab() {
  return (
    <div>
      <PageHelpBanner
        tab="reports"
        title="📊 Analytics"
        body="One place for SEO, social, performance, and blog analytics. Sections expand or collapse, and your layout is remembered."
      />

      <FeatureGate minTier={2} featureName="Analytics">
        <AnalyticsHub />
      </FeatureGate>
    </div>
  )
}
