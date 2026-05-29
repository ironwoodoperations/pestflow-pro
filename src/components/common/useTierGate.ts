import { useState } from 'react'
import { usePlan } from '../../context/PlanContext'

// s247 — reusable action-level tier gate. At a call site:
//   const gate = useTierGate(3)
//   if (!gate.allowed) { gate.openPrompt(); return }   // before any network call
//   ...render <UpgradePrompt open={gate.open} requiredTier={3} ... onClose={gate.closePrompt}/>
export function useTierGate(requiredTier: number) {
  const { canAccess } = usePlan()
  const [open, setOpen] = useState(false)
  return {
    allowed: canAccess(requiredTier),
    open,
    openPrompt: () => setOpen(true),
    closePrompt: () => setOpen(false),
  }
}
