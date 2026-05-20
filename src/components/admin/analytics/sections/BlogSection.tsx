import { FeatureGate } from '../../../common/FeatureGate'
import LockedSectionCard from '../../../common/LockedSectionCard'
import BlogAnalyticsTile from '../../reports/BlogAnalyticsTile'

export default function BlogSection() {
  return (
    <FeatureGate
      minTier={3}
      featureName="Blog Analytics"
      fallback={
        <LockedSectionCard
          title="Blog Analytics"
          bodyText="Blog post analytics and publishing trends are available on the Pro plan and above."
          mailtoSubject="Upgrade Request - Blog Analytics"
        />
      }
    >
      <BlogAnalyticsTile />
    </FeatureGate>
  )
}
