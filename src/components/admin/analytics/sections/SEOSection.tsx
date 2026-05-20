import { FeatureGate } from '../../../common/FeatureGate'
import LockedSectionCard from '../../../common/LockedSectionCard'
import SeoAnalyticsTile from '../../reports/SeoAnalyticsTile'
import GscAnalyticsTile from '../../seo/GscAnalyticsTile'
import Ga4AnalyticsTile from '../../seo/Ga4AnalyticsTile'
import SeoCoverageTile from '../../reports/SeoCoverageTile'

export default function SEOSection() {
  return (
    <div className="space-y-4">
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
