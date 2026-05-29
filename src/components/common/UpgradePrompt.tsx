import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, Loader2 } from 'lucide-react'
import { usePlan } from '../../context/PlanContext'
import { useTenant } from '../../context/TenantBootProvider'
import { tierInfo } from '../../lib/tierInfo'
import { requestUpgrade } from '../../lib/requestUpgrade'

interface Props {
  open: boolean
  requiredTier: number
  featureName: string
  onClose: () => void
}

// s247 — pre-emptive in-UI upgrade prompt shown BEFORE a tier-gated action fires
// a request. Names the correct target tier from tierInfo (never a literal), and
// the CTA routes a real sales signal via notify-upgrade. It never calls the
// gated feature — the backend 403 remains the source of truth / fallback.
export default function UpgradePrompt({ open, requiredTier, featureName, onClose }: Props) {
  const { tier } = usePlan()
  const { id: tenantId } = useTenant()
  const [submitting, setSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)

  if (!open) return null

  const target = tierInfo(requiredTier)

  async function handleRequest() {
    if (!tenantId || submitting) return
    setSubmitting(true)
    try {
      await requestUpgrade(tenantId, tier, requiredTier, featureName)
      setRequested(true)
      toast.success(`Thanks — we'll reach out about upgrading you to ${target.name}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send upgrade request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Upgrade to {target.name}</h3>
        <p className="text-sm text-gray-500 mb-4">
          {featureName} is available on the {target.name} plan
          <span className="whitespace-nowrap"> (${target.price}/mo)</span> and above.
        </p>

        {requested ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 mb-2">
            Request sent — our team will reach out to get you on {target.name}.
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Sending…' : `Request upgrade to ${target.name}`}
          </button>
        )}

        <button onClick={onClose} className="mt-3 text-sm text-gray-500 hover:text-gray-700">
          {requested ? 'Close' : 'Maybe later'}
        </button>
      </div>
    </div>
  )
}
