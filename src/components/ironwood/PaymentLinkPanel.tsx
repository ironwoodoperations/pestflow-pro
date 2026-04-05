import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

const PKG_TYPE: Record<string, string> = {
  'template-launch': 'template-launch',
  'growth-setup':    'growth-setup',
  'site-migration':  'site-migration',
  'custom-rebuild':  'custom-rebuild',
}

interface Props {
  prospect: Partial<Prospect>
  onUpdate: (updates: Partial<Prospect>) => void
}

export default function PaymentLinkPanel({ prospect, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const generate = async () => {
    if (!prospect.email || !prospect.plan_name) {
      setError('Email and plan are required to generate a payment link.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          client_email:          prospect.email,
          client_name:           prospect.contact_name || prospect.company_name || '',
          setup_amount_override: (prospect.setup_fee_amount || 0) * 100,
          plan:                  prospect.plan_name!.toLowerCase(),
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
      if (prospect.id) {
        await supabase.from('prospects').update(updates).eq('id', prospect.id)
      }
      onUpdate(updates)
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (prospect.payment_link_url) navigator.clipboard.writeText(prospect.payment_link_url)
  }

  const markPaid = async () => {
    const now = new Date().toISOString()
    const updates: Partial<Prospect> = { payment_confirmed_at: now, status: 'paid' }
    if (prospect.id) await supabase.from('prospects').update(updates).eq('id', prospect.id)
    onUpdate(updates)
  }

  const mailBody = encodeURIComponent(
    `Hi ${prospect.contact_name || ''},\n\nHere is your secure payment link for the ${prospect.plan_name || ''} plan:\n\n${prospect.payment_link_url}\n\nLet me know if you have any questions!\n\nScott`
  )
  const mailSubject = encodeURIComponent('Your PestFlow Pro Payment Link')

  if (!prospect.payment_link_url) {
    return (
      <div className="mt-3">
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <button onClick={generate} disabled={loading}
          className="px-4 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50">
          {loading ? 'Generating…' : '🔗 Generate Payment Link'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 p-3 bg-gray-800/60 border border-gray-700 rounded space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 truncate flex-1">{prospect.payment_link_url}</span>
        <button onClick={copy} className="text-xs text-emerald-400 hover:underline shrink-0">Copy</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <a href={`mailto:${prospect.email}?subject=${mailSubject}&body=${mailBody}`}
          className="px-3 py-1.5 bg-indigo-700 text-white text-xs rounded hover:bg-indigo-600">
          ✉ Send Link
        </a>
        {!prospect.payment_confirmed_at && (
          <button onClick={markPaid} className="px-3 py-1.5 bg-green-700 text-white text-xs rounded hover:bg-green-600">
            ✓ Mark as Paid
          </button>
        )}
        {prospect.payment_confirmed_at && (
          <span className="text-xs text-green-400 self-center">✓ Paid {new Date(prospect.payment_confirmed_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  )
}
