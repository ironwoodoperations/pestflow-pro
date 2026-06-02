import { useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { usePlan } from '../../hooks/usePlan'

// Tier catalog — names/prices match the server (create-upgrade-session + stripe-webhook).
// TODO(Scott): replace placeholder feature bullets with final marketing copy.
const TIERS = [
  { tier: 1, name: 'Starter', price: 149, features: ['Website + hosting', 'Lead capture form', 'Content editor', 'Basic SEO'] },
  { tier: 2, name: 'Growth',  price: 249, features: ['Everything in Starter', 'Social media posting', 'Review requests', 'Advanced SEO'] },
  { tier: 3, name: 'Pro',     price: 349, features: ['Everything in Growth', 'Campaign manager', 'SMS notifications', 'Analytics dashboard'] },
  { tier: 4, name: 'Elite',   price: 499, features: ['Everything in Pro', 'White-glove onboarding', 'Dedicated support line', 'Monthly strategy call'] },
]

interface Props {
  // Optional — used only to give the downgrade mailto some context.
  businessName?: string
}

async function unwrapFnError(error: unknown): Promise<{ status: number; message: string }> {
  if (error instanceof FunctionsHttpError) {
    let message = 'Something went wrong. Please try again.'
    try {
      const body = await error.context.json()
      if (body?.error) message = typeof body.error === 'string' ? body.error : (body.error.message ?? message)
    } catch { /* non-JSON body — keep fallback */ }
    return { status: error.context.status, message }
  }
  return { status: 0, message: error instanceof Error ? error.message : 'Network error' }
}

export default function UpgradeCards({ businessName = '' }: Props) {
  const { id: tenantId } = useTenant()
  const { tier: currentTier } = usePlan()
  const [busyTier, setBusyTier] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // A 409 means there's no usable self-serve managed subscription (no row, mismatch,
  // inactive, or manually-managed). In that case we hide upgrade buttons entirely.
  const [managedManually, setManagedManually] = useState(false)

  async function handleUpgrade(targetTier: number) {
    if (!tenantId) return
    setNotice(null)
    setBusyTier(targetTier)
    try {
      // Refresh the JWT so functions.invoke sends a valid Authorization bearer (authed client).
      await supabase.auth.refreshSession()
      const { data, error } = await supabase.functions.invoke('create-upgrade-session', {
        body: { tenant_id: tenantId, target_tier: targetTier },
      })
      if (error) {
        const { status, message } = await unwrapFnError(error)
        if (status === 409) setManagedManually(true) // hide self-serve buttons
        setNotice(message)
        return
      }
      if (data?.url) { window.location.href = data.url; return }
      setNotice('Could not start the upgrade. Please try again.')
    } catch (e: any) {
      setNotice(e?.message || 'Network error')
    } finally {
      setBusyTier(null)
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Plans</h2>

      {managedManually ? (
        <div className="mb-3 p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
          {notice || 'Contact us to change your plan.'}
        </div>
      ) : notice ? (
        <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">{notice}</div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map(t => {
          const isCurrent = t.tier === currentTier
          const isUpgrade = t.tier > currentTier
          return (
            <div key={t.tier}
              className={`bg-white rounded-xl border-2 p-5 flex flex-col ${isCurrent ? 'border-emerald-500 shadow-md' : 'border-gray-200'}`}>
              {isCurrent && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full self-start mb-2">Your plan</span>}
              <h3 className="font-bold text-gray-900 text-lg">{t.name}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-3">${t.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-1 mb-4 flex-1">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? null
                : isUpgrade ? (
                  managedManually ? null : (
                    <button
                      onClick={() => handleUpgrade(t.tier)}
                      disabled={busyTier !== null}
                      className="w-full py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                      {busyTier === t.tier ? 'Redirecting…' : `Upgrade to ${t.name}`}
                    </button>
                  )
                ) : (
                  <a
                    href={`mailto:support@pestflowpro.ai?subject=${encodeURIComponent(`Downgrade request${businessName ? ' — ' + businessName : ''}`)}`}
                    className="text-center text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    To downgrade, contact us
                  </a>
                )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
