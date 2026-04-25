import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

const SETUP_OPTIONS: { value: string; label: string; amount: number }[] = [
  { value: '0',    label: 'Waived (No Setup Fee)',  amount: 0 },
  { value: '500',  label: 'Starter Setup 1',        amount: 500 },
  { value: '750',  label: 'Starter Setup 2',        amount: 750 },
  { value: '1000', label: 'Growth Setup 1',         amount: 1000 },
  { value: '1250', label: 'Growth Setup 2',         amount: 1250 },
  { value: '1500', label: 'Custom Setup 1',         amount: 1500 },
  { value: '2000', label: 'Custom Setup 2',         amount: 2000 },
  { value: '2500', label: 'Premium Setup 1',        amount: 2500 },
  { value: '3500', label: 'Premium Setup 2',        amount: 3500 },
  { value: '5000', label: 'Elite Setup',            amount: 5000 },
]

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  prospect: Prospect
  onUpdate: (patch: Partial<Prospect>) => void
}

export default function PaymentLinkPanel({ prospect, onUpdate }: Props) {
  const [selectedOptionValue, setSelectedOptionValue] = useState<string>(() => {
    const found = SETUP_OPTIONS.find(o => o.amount === prospect.setup_fee_amount)
    return found ? found.value : ''
  })
  const [saving, setSaving] = useState<'invoice_sent' | 'setup_paid' | 'sub_active' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const amountKnown = useMemo(() => prospect.setup_fee_amount != null, [prospect.setup_fee_amount])

  async function markInvoiceSent() {
    if (!prospect.id) return
    setSaving('invoice_sent'); setError(null)
    try {
      const patch = { setup_invoice_sent_at: new Date().toISOString() }
      const { error: e } = await supabase.from('prospects').update(patch).eq('id', prospect.id)
      if (e) throw e
      onUpdate(patch)
    } catch (e: any) { setError(e.message || 'Save failed') }
    finally { setSaving(null) }
  }

  async function undoInvoiceSent() {
    if (!confirm('Undo "Invoice sent"? This will clear the sent date.')) return
    if (!prospect.id) return
    setSaving('invoice_sent'); setError(null)
    try {
      const patch = { setup_invoice_sent_at: null }
      const { error: e } = await supabase.from('prospects').update(patch).eq('id', prospect.id)
      if (e) throw e
      onUpdate(patch)
    } catch (e: any) { setError(e.message || 'Save failed') }
    finally { setSaving(null) }
  }

  async function markSetupPaid() {
    if (!prospect.id) return
    setSaving('setup_paid'); setError(null)
    try {
      const patch = { payment_confirmed_at: new Date().toISOString(), status: 'paid' as const }
      const { error: e } = await supabase.from('prospects').update(patch).eq('id', prospect.id)
      if (e) throw e
      onUpdate(patch)
    } catch (e: any) { setError(e.message || 'Save failed') }
    finally { setSaving(null) }
  }

  async function undoSetupPaid() {
    if (!confirm('Undo "Setup fee paid"? Status will revert to prospect.')) return
    if (!prospect.id) return
    setSaving('setup_paid'); setError(null)
    try {
      const patch = { payment_confirmed_at: null, status: 'prospect' as const }
      const { error: e } = await supabase.from('prospects').update(patch).eq('id', prospect.id)
      if (e) throw e
      onUpdate(patch)
    } catch (e: any) { setError(e.message || 'Save failed') }
    finally { setSaving(null) }
  }

  async function markSubscriptionActive() {
    if (!prospect.id) return
    setSaving('sub_active'); setError(null)
    try {
      const patch = { status: 'active' as const }
      const { error: e } = await supabase.from('prospects').update(patch).eq('id', prospect.id)
      if (e) throw e
      onUpdate(patch)
    } catch (e: any) { setError(e.message || 'Save failed') }
    finally { setSaving(null) }
  }

  async function undoSubscriptionActive() {
    if (!confirm('Undo "Subscription active"? Status will revert to paid.')) return
    if (!prospect.id) return
    setSaving('sub_active'); setError(null)
    try {
      const patch = { status: 'paid' as const }
      const { error: e } = await supabase.from('prospects').update(patch).eq('id', prospect.id)
      if (e) throw e
      onUpdate(patch)
    } catch (e: any) { setError(e.message || 'Save failed') }
    finally { setSaving(null) }
  }

  async function handleSetupFeeChange(value: string) {
    setSelectedOptionValue(value)
    const opt = SETUP_OPTIONS.find(o => o.value === value)
    if (!opt || !prospect.id) return
    const { error: e } = await supabase.from('prospects').update({ setup_fee_amount: opt.amount }).eq('id', prospect.id)
    if (!e) onUpdate({ setup_fee_amount: opt.amount })
  }

  return (
    <div className="space-y-4 mt-3">
      <div className="p-2 bg-gray-800/40 border border-gray-700 rounded text-xs text-gray-400">
        💡 Manual workflow — create the invoice and set up the subscription in Stripe dashboard. Track progress here as you complete each step.
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div>
        <label className="text-xs text-gray-400 block mb-1">Setup Fee</label>
        <select
          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
          value={selectedOptionValue}
          onChange={e => handleSetupFeeChange(e.target.value)}
        >
          <option value="">— Pick setup fee —</option>
          {SETUP_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.amount === 0 ? opt.label : `${opt.label} — $${opt.amount.toLocaleString()}`}
            </option>
          ))}
        </select>
      </div>

      {!amountKnown && (
        <p className="text-xs text-gray-500">Pick a setup fee to begin tracking.</p>
      )}

      {amountKnown && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-800/60 border border-gray-700 rounded">
            <span className="text-xs text-gray-300">Invoice sent</span>
            {!prospect.setup_invoice_sent_at ? (
              <button onClick={markInvoiceSent} disabled={saving === 'invoice_sent'}
                className="px-3 py-1 bg-amber-700 text-white text-xs rounded hover:bg-amber-600 disabled:opacity-50">
                {saving === 'invoice_sent' ? 'Saving…' : 'Mark Invoice Sent'}
              </button>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-2">
                ✓ Invoice sent — {fmtDate(prospect.setup_invoice_sent_at)}
                <button onClick={undoInvoiceSent} className="text-gray-500 hover:text-gray-300 underline">undo</button>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-800/60 border border-gray-700 rounded">
            <span className="text-xs text-gray-300">Setup fee paid</span>
            {!prospect.payment_confirmed_at ? (
              <button onClick={markSetupPaid} disabled={saving === 'setup_paid'}
                className="px-3 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50">
                {saving === 'setup_paid' ? 'Saving…' : 'Mark Setup Paid'}
              </button>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-2">
                ✓ Setup fee paid — {fmtDate(prospect.payment_confirmed_at)}
                <button onClick={undoSetupPaid} className="text-gray-500 hover:text-gray-300 underline">undo</button>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-800/60 border border-gray-700 rounded">
            <span className="text-xs text-gray-300">Subscription active</span>
            {prospect.status !== 'active' ? (
              <button onClick={markSubscriptionActive} disabled={saving === 'sub_active'}
                className="px-3 py-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50">
                {saving === 'sub_active' ? 'Saving…' : 'Mark Subscription Active'}
              </button>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-2">
                ✓ Subscription active
                <button onClick={undoSubscriptionActive} className="text-gray-500 hover:text-gray-300 underline">undo</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
