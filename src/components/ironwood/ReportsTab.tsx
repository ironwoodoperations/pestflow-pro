import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect, Salesperson } from './types'
import { Stat, fmt } from './ReportsStat'

interface MrrData {
  totalMRR: number; newMRR: number; churnedMRR: number; netChange: number; activeCount: number; monthLabel: string
}
interface CommRow {
  sp: Salesperson; deals: number; setupRev: number; mrr: number; setupComm: number; recurComm: number
}

export default function ReportsTab() {
  const [prospects, setProspects]   = useState<Prospect[]>([])
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [mrr, setMrr]               = useState<MrrData | null>(null)
  const [mrrLoading, setMrrLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('prospects').select('*'),
      supabase.from('salespeople').select('*'),
    ]).then(([{ data: p }, { data: s }]) => {
      if (p) setProspects(p)
      if (s) setSalespeople(s)
    })
    // Fetch Stripe MRR
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ironwood-stripe-report`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        })
        const data = await res.json()
        if (!data.error) setMrr(data)
      } catch { /* Stripe not configured — skip */ }
      setMrrLoading(false)
    })
  }, [])

  // Pipeline stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth  = (p: Prospect) => new Date(p.created_at) >= monthStart

  const totalProspects = prospects.filter(thisMonth).length
  const quoted  = prospects.filter(p => p.status === 'quoted')
  const paid    = prospects.filter(p => p.payment_confirmed_at && new Date(p.payment_confirmed_at) >= monthStart)
  const active  = prospects.filter(p => p.status === 'active')
  const churned = prospects.filter(p => p.status === 'churned' && new Date(p.updated_at) >= monthStart)

  const quotedValue = quoted.reduce((s, p) => s + (p.setup_fee_amount || 0) + (p.monthly_price || 0), 0)
  const paidSetup   = paid.reduce((s, p) => s + (p.setup_fee_amount || 0), 0)
  const activeMRR   = active.reduce((s, p) => s + (p.monthly_price || 0), 0)

  // Setup commission: prospects paid this month (payment_confirmed_at in current month)
  const paidThisMonth = prospects.filter(p =>
    p.payment_confirmed_at && new Date(p.payment_confirmed_at) >= monthStart
  )
  // Commission table
  const commRows: CommRow[] = salespeople.map(sp => {
    const setupDeals  = paidThisMonth.filter(p => p.salesperson_id === sp.id)
    const activeDeals = active.filter(p => p.salesperson_id === sp.id)
    const setupRev  = setupDeals.reduce((s, p) => s + (p.setup_fee_amount || 0), 0)
    const recurring = activeDeals.reduce((s, p) => s + (p.monthly_price || 0), 0)
    return {
      sp, deals: activeDeals.length, setupRev, mrr: recurring,
      setupComm:  Math.round(setupRev  * sp.commission_setup_pct     / 100 * 100) / 100,
      recurComm:  Math.round(recurring * sp.commission_recurring_pct / 100 * 100) / 100,
    }
  }).filter(r => r.deals > 0 || r.setupRev > 0)

  // Onboarding payouts — $100 per completed onboarding provisioned this month
  const provisionedThisMonth = prospects.filter(p =>
    p.provisioned_at && new Date(p.provisioned_at) >= monthStart
  )
  const onboardingRows = salespeople.map(sp => {
    const count = provisionedThisMonth.filter(p =>
      (p as any).onboarding_rep_id === sp.id
    ).length
    return { sp, count, payout: count * 100 }
  }).filter(r => r.count > 0)

  // Total Payroll this month
  const totalSetupComm    = commRows.reduce((s, r) => s + r.setupComm, 0)
  const totalRecurComm    = commRows.reduce((s, r) => s + r.recurComm, 0)
  const totalOnboarding   = onboardingRows.reduce((s, r) => s + r.payout, 0)
  const totalPayroll      = totalSetupComm + totalRecurComm + totalOnboarding

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-bold text-white">Reports</h2>

      {/* Pipeline Summary */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Pipeline — This Month</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="New Prospects" value={String(totalProspects)} />
          <Stat label="Quoted" value={String(quoted.length)} sub={fmt(quotedValue) + ' value'} />
          <Stat label="Paid" value={String(paid.length)} sub={fmt(paidSetup) + ' setup'} />
          <Stat label="Active" value={String(active.length)} sub={fmt(activeMRR) + '/mo MRR'} />
          <Stat label="Churned" value={String(churned.length)} />
        </div>
      </section>

      {/* Stripe MRR */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Stripe Revenue {mrr?.monthLabel ? `— ${mrr.monthLabel}` : ''}
        </h3>
        {mrrLoading ? <p className="text-gray-600 text-sm">Loading Stripe data…</p> : !mrr
          ? <p className="text-gray-600 text-sm">Stripe report unavailable.</p>
          : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Total MRR" value={fmt(mrr.totalMRR)} sub={`${mrr.activeCount} subscriptions`} />
              <Stat label="New MRR" value={fmt(mrr.newMRR)} />
              <Stat label="Churned MRR" value={fmt(mrr.churnedMRR)} />
              <Stat label="Net Change" value={(mrr.netChange >= 0 ? '+' : '') + fmt(mrr.netChange)} />
            </div>
          )}
      </section>

      {/* Commission */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Commission — Active Clients</h3>
        {commRows.length === 0
          ? <p className="text-gray-600 text-sm">No active deals with assigned reps.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="pb-2">Rep</th><th className="pb-2">Deals</th>
                    <th className="pb-2">Setup Rev</th><th className="pb-2">MRR</th>
                    <th className="pb-2">Setup Commission</th><th className="pb-2">Monthly Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {commRows.map(r => (
                    <tr key={r.sp.id} className="border-b border-gray-800/50">
                      <td className="py-2 font-medium text-white">{r.sp.name}</td>
                      <td className="py-2 text-gray-300">{r.deals}</td>
                      <td className="py-2 text-gray-300">{fmt(r.setupRev)}</td>
                      <td className="py-2 text-gray-300">{fmt(r.mrr)}/mo</td>
                      <td className="py-2 text-emerald-400">{fmt(r.setupComm)}</td>
                      <td className="py-2 text-emerald-400">{fmt(r.recurComm)}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {/* Onboarding Payouts */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Onboarding Payouts</h3>
        <p className="text-xs text-gray-600 mb-3">$100 flat per completed onboarding (provisioned this month).</p>
        {onboardingRows.length === 0
          ? <p className="text-gray-600 text-sm">No onboardings provisioned this month.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="pb-2">Rep</th><th className="pb-2">Onboardings</th><th className="pb-2">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {onboardingRows.map(r => (
                    <tr key={r.sp.id} className="border-b border-gray-800/50">
                      <td className="py-2 font-medium text-white">{r.sp.name}</td>
                      <td className="py-2 text-gray-300">{r.count}</td>
                      <td className="py-2 text-emerald-400">{fmt(r.payout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {/* Total Payroll */}
      <section className="bg-gray-800 border border-emerald-700/50 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Total Payroll — This Month</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><div className="text-xs text-gray-500 mb-1">Setup Commissions</div><div className="text-lg font-semibold text-white">{fmt(totalSetupComm)}</div></div>
          <div><div className="text-xs text-gray-500 mb-1">Monthly Residuals</div><div className="text-lg font-semibold text-white">{fmt(totalRecurComm)}/mo</div></div>
          <div><div className="text-xs text-gray-500 mb-1">Onboarding Payouts</div><div className="text-lg font-semibold text-white">{fmt(totalOnboarding)}</div></div>
        </div>
        <div className="border-t border-gray-700 pt-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">Total to pay out this month</span>
          <span className="text-2xl font-bold text-emerald-400">{fmt(totalPayroll)}</span>
        </div>
      </section>
    </div>
  )
}
