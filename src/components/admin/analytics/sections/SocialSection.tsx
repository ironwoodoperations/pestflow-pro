import { FeatureGate } from '../../../common/FeatureGate'
import LockedSectionCard from '../../../common/LockedSectionCard'
import SocialPostsTile from '../../reports/SocialPostsTile'
import SocialAnalyticsTile from '../../reports/SocialAnalyticsTile'

export default function SocialSection() {
  return (
    <FeatureGate
      minTier={4}
      featureName="Social Analytics"
      fallback={
        <LockedSectionCard
          title="Social Analytics"
          bodyText="Social engagement metrics and post performance are available on the Elite plan."
          mailtoSubject="Upgrade Request - Social Analytics"
        />
      }
    >
      <div className="space-y-4">
        <SocialPostsTile />
        <SocialAnalyticsTile />
      </div>
    </FeatureGate>
  )
}
