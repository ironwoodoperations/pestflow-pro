import { FeatureGate } from '../../../common/FeatureGate'
import LockedSectionCard from '../../../common/LockedSectionCard'
import SitePerformanceTile from '../../reports/SitePerformanceTile'
import SeoAnalyticsTile from '../../reports/SeoAnalyticsTile'
import GscAnalyticsTile from '../../seo/GscAnalyticsTile'
import Ga4AnalyticsTile from '../../seo/Ga4AnalyticsTile'
import SeoCoverageTile from '../../reports/SeoCoverageTile'

export default function SEOSection() {
  return (
    <div className="space-y-4">
      <FeatureGate
        minTier={2}
        featureName="Site Performance"
        fallback={
          <LockedSectionCard
            title="Site Performance"
            bodyText="Site performance scores are available on the Growth plan and above."
            mailtoSubject="Upgrade Request - Site Performance"
          />
        }
      >
        <SitePerformanceTile />
      </FeatureGate>
      <FeatureGate
        minTier={3}
        featureName="SEO Analytics"
        fallback={
          <LockedSectionCard
            title="SEO Analytics"
            bodyText="SEO keyword rankings, Google Search Console data, and GA4 traffic are available on the Pro plan and above."
            mailtoSubject="Upgrade Request - SEO Analytics"
          />
        }
      >
        <SeoAnalyticsTile />
        <GscAnalyticsTile />
        <Ga4AnalyticsTile />
        <SeoCoverageTile />
      </FeatureGate>
    </div>
  )
}
