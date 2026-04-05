// Re-exports from PlanContext so that existing imports (TierToggle, FeatureGate, Dashboard)
// all share the single PlanProvider instance instead of each fetching independently.
export { usePlan } from '../context/PlanContext'
