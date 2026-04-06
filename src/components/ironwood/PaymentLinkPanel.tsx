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

  const hasSetupFee = (prospect.setup_fee_amount || 0) > 0

  // SECTION 1 — Setup Invoice
  async function generateInvoice() {
    if (!prospect.email || !prospect.company_name || !prospect.id) return
    setLoadingInvoice(true); setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        console.error('No valid session', sessionError)
        setError('Authentication error — please refresh and try again.')
        setLoadingInvoice(false)
        return
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-setup-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          setupFeeAmount: prospect.setup_fee_amount,
          clientEmail:    prospect.email,
          companyName:    prospect.company_name,
          prospectId:     prospect.id,
        }),
      })
      const data = await res.json()
      if (!data.invoice_url) { setError(data.error || 'Failed to generate invoice'); return }
      const updates: Partial<Prospect> = {
        setup_invoice_url: data.invoice_url,
        setup_invoice_sent_at: new Date().toISOString(),
      }
      onUpdate(updates)
    } catch (e: any) { setError(e.message || 'Network error') }
    finally { setLoadingInvoice(false) }
  }

  async function markSetupPaid() {
    const now = new Date().toISOString()
    const updates: Partial<Prospect> = { payment_confirmed_at: now, status: 'paid' }
    if (prospect.id) await supabase.from('prospects').update(updates).eq('id', prospect.id)
    onUpdate(updates)
  }

  // SECTION 2 — Subscription Link
  async function generateSubscriptionLink() {
    if (!prospect.email || !prospect.plan_name) {
      setError('Email and plan are required.'); return
    }
    setLoadingLink(true); setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        console.error('No valid session', sessionError)
        setError('Authentication error — please refresh and try again.')
        setLoadingLink(false)
        return
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_email:          prospect.email,
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

      {/* SECTION 1 — Setup Fee (only if setup_fee_amount > 0) */}
      {hasSetupFee && (
        <div className="p-3 bg-gray-800/60 border border-gray-700 rounded">
          <p className="text-xs font-semibold text-amber-400 mb-2">Step 1 — Setup Fee (${prospect.setup_fee_amount?.toLocaleString()})</p>
          {!prospect.setup_invoice_url ? (
            <button onClick={generateInvoice} disabled={loadingInvoice}
              className="px-3 py-1.5 bg-amber-700 text-white text-xs rounded hover:bg-amber-600 disabled:opacity-50">
              {loadingInvoice ? 'Generating…' : '📄 Generate Setup Invoice'}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 truncate flex-1">{prospect.setup_invoice_url}</span>
                <button onClick={() => navigator.clipboard.writeText(prospect.setup_invoice_url!)}
                  className="text-xs text-emerald-400 hover:underline shrink-0">Copy</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a href={`mailto:${prospect.email}?subject=${mailSubjectInvoice}&body=${setupMailBody}`}
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
          )}
        </div>
      )}

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
              <a href={`mailto:${prospect.email}?subject=${mailSubjectSub}&body=${subMailBody}`}
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
