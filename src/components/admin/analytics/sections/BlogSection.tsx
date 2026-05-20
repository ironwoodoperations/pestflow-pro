import { FeatureGate } from '../../../common/FeatureGate'
import BlogAnalyticsTile from '../../reports/BlogAnalyticsTile'

export default function BlogSection() {
  return (
    <FeatureGate minTier={3} featureName="Analytics">
      <BlogAnalyticsTile />
    </FeatureGate>
  )
}
