import { FeatureGate } from '../../../common/FeatureGate'
import LockedSectionCard from '../../../common/LockedSectionCard'
import SitePerformanceTile from '../../reports/SitePerformanceTile'

export default function PerformanceSection() {
  return (
    <FeatureGate
      minTier={2}
      featureName="Site Performance"
      fallback={
        <LockedSectionCard
          title="Site Performance"
          bodyText="Site performance scores are available on the Grow plan and above."
          mailtoSubject="Upgrade Request - Site Performance"
        />
      }
    >
      <SitePerformanceTile />
    </FeatureGate>
  )
}
