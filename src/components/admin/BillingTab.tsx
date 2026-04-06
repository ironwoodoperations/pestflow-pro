import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
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

interface SubscriptionSettings {
  tier: number
  plan_name: string
  monthly_price: number
}

const PLAN_PRICE_LABELS: Record<string, string> = {
  'price_1TIZ6DCZBM0TUusSaC2UdcYG': 'Tier 1 — Starter',
  'price_1TIrvGCZBM0TUusSNBntvS6l': 'Tier 2 — Grow',
  'price_1TIrvcCZBM0TUusS4BJt8oQi': 'Tier 3 — Pro',
  'price_1TIrw3CZBM0TUusSomA1hsT4': 'Tier 4 — Elite',
}

const TIERS = [
  { tier: 1, name: 'Starter', price: 149, priceId: 'price_1TIZ6DCZBM0TUusSaC2UdcYG',
    features: ['Website + hosting', 'Lead capture form', 'Content editor', 'SEO tools', 'Blog'] },
  { tier: 2, name: 'Grow', price: 249, priceId: 'price_1TIrvGCZBM0TUusSNBntvS6l',
    features: ['Everything in Starter', 'Social media posts', 'Review requests', 'CRM tools', 'Priority support'] },
  { tier: 3, name: 'Pro', price: 349, priceId: 'price_1TIrvcCZBM0TUusS4BJt8oQi',
    features: ['Everything in Grow', 'SMS notifications', 'Advanced analytics', 'Google Business sync', 'Team accounts'] },
  { tier: 4, name: 'Elite', price: 499, priceId: 'price_1TIrw3CZBM0TUusSomA1hsT4',
    features: ['Everything in Pro', 'White-glove onboarding', 'Custom integrations', 'Dedicated support line', 'Monthly strategy call'] },
]

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
  const { tenantId } = useTenant()
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [subscription, setSubscription] = useState<SubscriptionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<number | null>(null)
  const [clientEmail, setClientEmail] = useState('')
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  // Slug from hostname: cypress-creek-pest-control.pestflowpro.com → "cypress-creek-pest-control"
  const clientSlug = (() => {
    const parts = window.location.hostname.split('.')
    if (parts.length >= 3 && window.location.hostname.endsWith('.pestflowpro.com')) return parts[0]
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
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'notifications').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
    ]).then(([paymentsRes, subRes, notifRes, bizRes]) => {
      setPayments(paymentsRes.data || [])
      if (subRes.data?.value) setSubscription(subRes.data.value as SubscriptionSettings)
      const email =
        notifRes.data?.value?.lead_email ||
        bizRes.data?.value?.email ||
        ''
      setClientEmail(email)
      setLoading(false)
    })
  }, [tenantId])

  async function handleUpgrade(tier: typeof TIERS[number]) {
    if (!tenantId) return
    setUpgradeError(null)

    if (!clientEmail) {
      setUpgradeError('Could not find your email address — please update it in Settings → Business Info.')
      return
    }

    setUpgrading(tier.tier)
    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        session = refreshData.session
      }
      if (!session) { setUpgradeError('Session expired. Please refresh the page.'); return }
      const accessToken = session.access_token

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          plan:         tier.name.toLowerCase(),
          tenant_id:    tenantId,
          client_email: clientEmail,
          client_name:  '',
          slug:         clientSlug,
          setup_amount_override: 0,
          prospect_id:  '',
        }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setUpgradeError(data.error || 'Failed to start checkout') }
    } catch (e: any) { setUpgradeError(e.message || 'Network error') }
    finally { setUpgrading(null) }
  }

  return (
    <div>
      <PageHelpBanner
        tab="billing"
        title="Billing & Subscription"
        body="View your current plan and full payment history. To upgrade, downgrade, or request a plan change, use the link below to contact support."
      />

      {upgradeError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{upgradeError}</div>
      )}

      {/* Tier upgrade cards */}
      {subscription && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map(tier => {
              const isCurrent = subscription.tier === tier.tier
              const isUpgrade = tier.tier > subscription.tier
              const isDowngrade = tier.tier < subscription.tier
              return (
                <div key={tier.tier}
                  className={`bg-white rounded-xl border-2 p-5 flex flex-col ${isCurrent ? 'border-emerald-500 shadow-md' : 'border-gray-200'}`}>
                  {isCurrent && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full self-start mb-2">Current Plan</span>}
                  <h3 className="font-bold text-gray-900 text-lg">{tier.name}</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-3">${tier.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <ul className="space-y-1 mb-4 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-emerald-500 mt-0.5 shrink-0">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button disabled className="w-full py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-600 cursor-default">Current Plan</button>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleUpgrade(tier)}
                      disabled={upgrading === tier.tier}
                      className="w-full py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition"
                    >
                      {upgrading === tier.tier ? 'Redirecting...' : 'Upgrade'}
                    </button>
                  ) : isDowngrade ? (
                    <a
                      href="mailto:support@pestflowpro.com?subject=Downgrade Request"
                      className="w-full py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-center block"
                    >
                      Contact us to downgrade
                    </a>
                  ) : null}
                </div>
              )
            })}
          </div>
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

        {subscription ? (
          <div className="flex items-end gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {subscription.plan_name}
                <span className="text-base font-normal text-gray-500 ml-1">
                  — ${subscription.monthly_price}/mo
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">Tier {subscription.tier}</p>
            </div>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <p className="text-sm text-gray-500">No subscription data found.</p>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100">
          <a
            href="mailto:scott@ironwoodoperationsgroup.com?subject=Plan Change Request"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition"
          >
            Need to upgrade or change your plan? Contact support →
          </a>
        </div>
      </div>

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
