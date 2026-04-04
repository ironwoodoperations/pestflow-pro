import { useState, useEffect } from 'react'
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
  'price_1TIZA1CZBM0TUusSJfld1aNT': 'Tier 2 — Grow',
  'price_1TIZE2CZBM0TUusSPFZZVDQk': 'Tier 3 — Pro',
  'price_1TIZF1CZBM0TUusSuoAbLJZT': 'Tier 4 — Elite',
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
  const { tenantId } = useTenant()
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [subscription, setSubscription] = useState<SubscriptionSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase
        .from('stripe_payments')
        .select('id, created_at, payment_type, status, setup_amount, subscription_amount, subscription_price_id')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'subscription')
        .maybeSingle(),
    ]).then(([paymentsRes, settingsRes]) => {
      setPayments(paymentsRes.data || [])
      if (settingsRes.data?.value) setSubscription(settingsRes.data.value as SubscriptionSettings)
      setLoading(false)
    })
  }, [tenantId])

  return (
    <div>
      <PageHelpBanner
        tab="billing"
        title="Billing & Subscription"
        body="View your current plan and full payment history. To upgrade, downgrade, or request a plan change, use the link below to contact support."
      />

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
