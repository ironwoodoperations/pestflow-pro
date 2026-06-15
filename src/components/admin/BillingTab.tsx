import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { usePlan } from '../../context/PlanContext'
import { tierInfo } from '../../lib/tierInfo'
import PageHelpBanner from './PageHelpBanner'
import UpgradeCards from './UpgradeCards'
import RemiAddonStrip from './RemiAddonStrip'
import { PLAN_CARD_TIERS, planChangeMailto, PLAN_CHANGE_PHONE } from '../../lib/planCardContent'
import { CreditCard, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'

interface PaymentRow {
  id: string
  created_at: string
  payment_type: string
  status: string
  setup_amount: number | null
  subscription_amount: number | null
  subscription_price_id: string | null
}

// S262 — the current tier comes from usePlan() (tenants.entitlement), the single
// source of truth. This component no longer reads settings.subscription, and the
// old string/number tierNum() coercion is gone.

const PLAN_PRICE_LABELS: Record<string, string> = {
  [import.meta.env.VITE_STRIPE_PRICE_SUB_STARTER || '']: 'Tier 1 — Starter',
  [import.meta.env.VITE_STRIPE_PRICE_SUB_GROWTH  || '']: 'Tier 2 — Growth',
  [import.meta.env.VITE_STRIPE_PRICE_SUB_PRO     || '']: 'Tier 3 — Pro',
  [import.meta.env.VITE_STRIPE_PRICE_SUB_ELITE   || '']: 'Tier 4 — Elite',
}

function statusBadge(status: string) {
  if (status === 'paid') return <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><CheckCircle size={11} /> Paid</span>
  if (status === 'pending') return <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><Clock size={11} /> Pending</span>
  if (status === 'cancelled') return <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><XCircle size={11} /> Cancelled</span>
  return <span className="text-xs text-gray-500">{status}</span>
}

function describePayment(row: PaymentRow): string {
  if (row.payment_type === 'setup_plus_subscription') {
    const plan = row.subscription_price_id ? (PLAN_PRICE_LABELS[row.subscription_price_id] || 'Subscription') : 'Subscription'
    return `Setup fee + ${plan}`
  }
  return row.payment_type || 'Payment'
}

function totalAmount(row: PaymentRow): string {
  const setup = row.setup_amount || 0
  const sub = row.subscription_amount || 0
  const total = setup + sub
  if (total === 0) return '—'
  return `$${(total / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function BillingTab() {
  const { id: tenantId } = useTenant()
  const { tier: currentTier } = usePlan()
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoTenant, setIsDemoTenant] = useState(false)
  const [businessName, setBusinessName] = useState('')

  // Slug from hostname: cypress-creek-pest-control.pestflowpro.ai → "cypress-creek-pest-control"
  const clientSlug = (() => {
    const parts = window.location.hostname.split('.')
    if (parts.length >= 3 && window.location.hostname.endsWith('.pestflowpro.ai')) return parts[0]
    return ''
  })()

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase
        .from('stripe_payments')
        .select('id, created_at, payment_type, status, setup_amount, subscription_amount, subscription_price_id')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'demo_mode').maybeSingle(),
    ]).then(([paymentsRes, bizRes, demoRes]) => {
      setPayments(paymentsRes.data || [])
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      const demoActive = demoRes.data?.value?.active === true || clientSlug === 'pestflow-pro' || clientSlug === ''
      setIsDemoTenant(demoActive)
      setLoading(false)
    })
  }, [tenantId, clientSlug])

  return (
    <div>
      <PageHelpBanner
        tab="billing"
        title="Billing & Subscription"
        body="View your current plan and full payment history. To upgrade, downgrade, or request a plan change, use the link below to contact support."
      />

      {/* Plan menu — concierge contact model, demo tenant only */}
      {isDemoTenant && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_CARD_TIERS.map(plan => {
              const isCurrent = currentTier === plan.tier
              return (
                <div key={plan.tier}
                  className={`relative bg-white rounded-xl border-2 p-5 flex flex-col ${isCurrent ? 'border-emerald-500 shadow-md' : plan.mostPopular ? 'border-purple-300' : 'border-gray-200'}`}>
                  {plan.mostPopular && !isCurrent && (
                    <span className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-bl-lg">Most popular</span>
                  )}
                  {isCurrent && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full self-start mb-2">Current Plan</span>}
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-1">${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <p className="text-xs text-gray-500 mb-3">{plan.tagline}</p>
                  {plan.headerLine && <p className="text-xs font-semibold text-gray-700 mb-1">{plan.headerLine}</p>}
                  <ul className="space-y-1 mb-4 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-emerald-500 mt-0.5 shrink-0">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button disabled className="w-full py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-600 cursor-default">Current Plan</button>
                  ) : (
                    <div>
                      <a
                        href={planChangeMailto(plan.name)}
                        className="block w-full py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition text-center"
                      >
                        Contact us to switch
                      </a>
                      <p className="text-center text-xs text-gray-500 mt-1.5">or call {PLAN_CHANGE_PHONE}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <RemiAddonStrip />
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Current Plan</h2>
            <p className="text-xs text-gray-500">Your active PestFlow Pro subscription</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="flex items-end gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tierInfo(currentTier).name}
                <span className="text-base font-normal text-gray-500 ml-1">
                  — ${tierInfo(currentTier).price}/mo
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">Tier {currentTier}</p>
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100">
          <a
            href="mailto:scott@homeflowpro.ai?subject=Plan Change Request"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition"
          >
            Need to upgrade or change your plan? Contact support →
          </a>
        </div>
      </div>

      {/* Self-serve upgrade cards — real (non-demo) clients. Reads current tier from
          usePlan() and calls create-upgrade-session; renders one card per tier. */}
      {!isDemoTenant && (
        <UpgradeCards businessName={businessName} />
      )}

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Calendar size={18} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Payment History</h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">No payment history yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map(row => (
              <div key={row.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{describePayment(row)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">{totalAmount(row)}</span>
                  {statusBadge(row.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
