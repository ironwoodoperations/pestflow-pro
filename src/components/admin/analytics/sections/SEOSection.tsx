import { FeatureGate } from '../../../common/FeatureGate'
import SeoAnalyticsTile from '../../reports/SeoAnalyticsTile'
import GscAnalyticsTile from '../../seo/GscAnalyticsTile'
import Ga4AnalyticsTile from '../../seo/Ga4AnalyticsTile'
import SeoCoverageTile from '../../reports/SeoCoverageTile'

export default function SEOSection() {
  return (
    <div className="space-y-4">
      <FeatureGate minTier={3} featureName="Analytics">
        <SeoAnalyticsTile />
        <GscAnalyticsTile />
        <Ga4AnalyticsTile />
      </FeatureGate>
      <FeatureGate minTier={3} featureName="SEO Coverage">
        <SeoCoverageTile />
      </FeatureGate>
    </div>
  )
}
