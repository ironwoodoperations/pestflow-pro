// S67 - force rebuild
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

interface Props {
  prospect: Partial<Prospect>
  onUpdate: (updates: Partial<Prospect>) => void
}

export default function PaymentLinkPanel({ prospect, onUpdate }: Props) {
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [loadingLink, setLoadingLink]       = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmWaive, setConfirmWaive]     = useState(false)

  const setupFeeAmount = prospect.setup_fee_amount || 0
  const hasSetupFee    = setupFeeAmount > 0
  const resolvedEmail  =
    prospect.email?.trim() ||
    (prospect as any).business_info?.email?.trim() ||
    (prospect as any).intake_data?.business?.email?.trim() ||
    ''

  // SECTION 1 — Setup Invoice
  async function generateInvoice() {
    if (!prospect.company_name || !prospect.id) return

    if (!resolvedEmail) {
      setError('No email address found. Add an email in the Contact section or import intake data first.')
      return
    }

    // $0 fee: show waive confirmation instead of calling Stripe
    if (!hasSetupFee) {
      setConfirmWaive(true)
      return
    }

    setLoadingInvoice(true); setError(null)
    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        session = refreshData.session
      }
      if (!session) {
        setError('Unable to authenticate. Please sign out and sign back in.')
        return
      }
      const accessToken = session.access_token
      const amountCents = Math.round(setupFeeAmount * 100)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-setup-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          amountCents,
          clientEmail: resolvedEmail,
          companyName: prospect.company_name,
          prospectId:  prospect.id,
        }),
      })
      const data = await res.json()
      if (data.skipped) {
        // Edge function handled zero case — update local state
        onUpdate({ status: 'paid', payment_confirmed_at: new Date().toISOString() })
        return
      }
      if (!data.invoice_url) { setError(data.error || 'Failed to generate invoice'); return }
      onUpdate({
        setup_invoice_url: data.invoice_url,
        setup_invoice_sent_at: new Date().toISOString(),
      })
    } catch (e: any) { setError(e.message || 'Network error') }
    finally { setLoadingInvoice(false) }
  }

  async function waiveSetupFee() {
    setConfirmWaive(false)
    const now = new Date().toISOString()
    if (prospect.id) {
      await supabase.from('prospects').update({ status: 'paid', payment_confirmed_at: now }).eq('id', prospect.id)
    }
    onUpdate({ status: 'paid', payment_confirmed_at: now })
  }

  async function markSetupPaid() {
    const now = new Date().toISOString()
    const updates: Partial<Prospect> = { payment_confirmed_at: now, status: 'paid' }
    if (prospect.id) await supabase.from('prospects').update(updates).eq('id', prospect.id)
    onUpdate(updates)
  }

  // SECTION 2 — Subscription Link
  async function generateSubscriptionLink() {
    if (!resolvedEmail || !prospect.plan_name) {
      setError(resolvedEmail ? 'Plan is required.' : 'Email and plan are required.'); return
    }
    setLoadingLink(true); setError(null)
    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        session = refreshData.session
      }
      if (!session) {
        setError('Unable to authenticate. Please sign out and sign back in.')
        return
      }
      const accessToken = session.access_token
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          client_email:          resolvedEmail,
          client_name:           prospect.contact_name || prospect.company_name || '',
          setup_amount_override: 0, // Setup fee handled separately via invoice
          plan:                  prospect.plan_name.toLowerCase(),
          slug:                  prospect.slug || 'placeholder',
          prospect_id:           prospect.id || '',
          tenant_id:             prospect.tenant_id || '',
        }),
      })
      const data = await res.json()
      if (!data.url) { setError(data.error || 'Failed to create checkout session'); return }
      const now = new Date().toISOString()
      const updates: Partial<Prospect> = {
        payment_link_url: data.url,
        payment_sent_at: now,
        ...(prospect.status === 'prospect' ? { status: 'quoted' as const } : {}),
      }
      if (prospect.id) await supabase.from('prospects').update(updates).eq('id', prospect.id)
      onUpdate(updates)
    } catch (e: any) { setError(e.message || 'Network error') }
    finally { setLoadingLink(false) }
  }

  async function markSubscriptionActive() {
    const updates: Partial<Prospect> = { status: 'active' }
    if (prospect.id) await supabase.from('prospects').update(updates).eq('id', prospect.id)
    onUpdate(updates)
  }

  const setupMailBody = encodeURIComponent(
    `Hi ${prospect.contact_name || ''},\n\nHere is your setup fee invoice:\n\n${prospect.setup_invoice_url}\n\nPlease pay within 24 hours to get started.\n\nScott`
  )
  const subMailBody = encodeURIComponent(
    `Hi ${prospect.contact_name || ''},\n\nHere is your subscription payment link for the ${prospect.plan_name || ''} plan:\n\n${prospect.payment_link_url}\n\nLet me know if you have any questions!\n\nScott`
  )
  const mailSubjectInvoice = encodeURIComponent('Your Setup Fee Invoice — PestFlow Pro')
  const mailSubjectSub     = encodeURIComponent('Your Monthly Subscription Link — PestFlow Pro')

  return (
    <div className="space-y-4 mt-3">
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* SECTION 1 — Setup Fee */}
      <div className="p-3 bg-gray-800/60 border border-gray-700 rounded">
        <p className="text-xs font-semibold text-amber-400 mb-2">
          Step 1 — Setup Fee {hasSetupFee ? `($${setupFeeAmount.toLocaleString()})` : '($0 — waived)'}
        </p>

        {/* $0 waive confirmation */}
        {confirmWaive && (
          <div className="mb-2 p-2 bg-amber-900/40 border border-amber-700 rounded text-xs text-amber-200">
            Setup fee is $0 — skip invoice and mark as waived?
            <div className="flex gap-2 mt-2">
              <button onClick={waiveSetupFee} className="px-2 py-1 bg-green-700 text-white rounded hover:bg-green-600">Yes, waive</button>
              <button onClick={() => setConfirmWaive(false)} className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        )}

        {prospect.payment_confirmed_at && !prospect.setup_invoice_url && (
          <span className="text-xs text-green-400">✓ Setup fee waived {new Date(prospect.payment_confirmed_at).toLocaleDateString()}</span>
        )}

        {!prospect.setup_invoice_url && !prospect.payment_confirmed_at ? (
          <button onClick={generateInvoice} disabled={loadingInvoice}
            className="px-3 py-1.5 bg-amber-700 text-white text-xs rounded hover:bg-amber-600 disabled:opacity-50">
            {loadingInvoice ? 'Generating…' : hasSetupFee ? '📄 Generate Setup Invoice' : '📄 Waive Setup Fee'}
          </button>
        ) : prospect.setup_invoice_url ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 truncate flex-1">{prospect.setup_invoice_url}</span>
                <button onClick={() => navigator.clipboard.writeText(prospect.setup_invoice_url!)}
                  className="text-xs text-emerald-400 hover:underline shrink-0">Copy</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a href={`mailto:${resolvedEmail}?subject=${mailSubjectInvoice}&body=${setupMailBody}`}
                  className="px-3 py-1.5 bg-indigo-700 text-white text-xs rounded hover:bg-indigo-600">✉ Send Invoice</a>
                {!prospect.payment_confirmed_at && (
                  <button onClick={markSetupPaid}
                    className="px-3 py-1.5 bg-green-700 text-white text-xs rounded hover:bg-green-600">
                    ✓ Mark Setup Paid
                  </button>
                )}
                {prospect.payment_confirmed_at && (
                  <span className="text-xs text-green-400 self-center">✓ Setup paid {new Date(prospect.payment_confirmed_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ) : null}
        </div>

      {/* SECTION 2 — Monthly Subscription */}
      <div className="p-3 bg-gray-800/60 border border-gray-700 rounded">
        <p className="text-xs font-semibold text-blue-400 mb-2">
          {hasSetupFee ? 'Step 2 — Monthly Subscription' : 'Monthly Subscription'}
          {prospect.plan_name && <span className="text-gray-400 font-normal"> · {prospect.plan_name}</span>}
        </p>
        {!prospect.payment_link_url ? (
          <button onClick={generateSubscriptionLink} disabled={loadingLink}
            className="px-3 py-1.5 bg-blue-700 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50">
            {loadingLink ? 'Generating…' : '🔗 Generate Subscription Link'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 truncate flex-1">{prospect.payment_link_url}</span>
              <button onClick={() => navigator.clipboard.writeText(prospect.payment_link_url!)}
                className="text-xs text-emerald-400 hover:underline shrink-0">Copy</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a href={`mailto:${resolvedEmail}?subject=${mailSubjectSub}&body=${subMailBody}`}
                className="px-3 py-1.5 bg-indigo-700 text-white text-xs rounded hover:bg-indigo-600">✉ Send Link</a>
              {prospect.status !== 'active' && (
                <button onClick={markSubscriptionActive}
                  className="px-3 py-1.5 bg-green-700 text-white text-xs rounded hover:bg-green-600">
                  ✓ Mark Subscription Active
                </button>
              )}
              {prospect.status === 'active' && (
                <span className="text-xs text-green-400 self-center">✓ Subscription active</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
