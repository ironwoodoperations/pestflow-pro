import { usePlan } from '../../context/PlanContext'

/**
 * Returns Starter-tier social gating flags derived from the plan context.
 * isStarter: true when tier === 1
 * canSchedule: false for Starter, true for Growth+
 */
export function useSocialTier() {
  const { tier } = usePlan()
  const isStarter = tier === 1
  const canSchedule = !isStarter
  return { isStarter, canSchedule }
}
