import { FeatureGate } from '../../../common/FeatureGate'
import SocialPostsTile from '../../reports/SocialPostsTile'
import SocialAnalyticsTile from '../../reports/SocialAnalyticsTile'

export default function SocialSection() {
  return (
    <FeatureGate minTier={3} featureName="Analytics">
      <div className="space-y-4">
        <SocialPostsTile />
        <SocialAnalyticsTile />
      </div>
    </FeatureGate>
  )
}
