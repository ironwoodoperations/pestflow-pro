import { FeatureGate } from '../../../common/FeatureGate'
import SitePerformanceTile from '../../reports/SitePerformanceTile'

export default function PerformanceSection() {
  return (
    <FeatureGate minTier={2} featureName="Site Performance">
      <SitePerformanceTile />
    </FeatureGate>
  )
}
