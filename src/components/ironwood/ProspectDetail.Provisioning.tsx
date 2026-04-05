import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

interface Props {
  form: Partial<Prospect>
  prospectId: string | null
  onProvisioned: (updates: Partial<Prospect>) => void
}

export default function ProvisioningSection({ form, prospectId, onProvisioned }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canCreate = !!form.slug && !!form.admin_email

  const handleReveal = async () => {
    if (!prospectId) return
    const now = new Date().toISOString()
    await supabase.from('prospects').update({ site_revealed_at: now, status: 'active' }).eq('id', prospectId)
    onProvisioned({ site_revealed_at: now, status: 'active' })
  }

  const doProvision = async () => {
    setConfirming(false)
    setProvisioning(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const bi = form.business_info || {}
      const br = form.branding || {}
      const cu = form.customization || {}

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ironwood-provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prospect_id: prospectId,
          slug: form.slug,
          admin_email: form.admin_email,
          admin_password: form.admin_password,
          business_info: bi,
          branding: br,
          customization: cu,
          social: {
            facebook: form.social_facebook, instagram: form.social_instagram,
            google: form.social_google, youtube: form.social_youtube,
          },
          subscription: { tier: form.plan_tier || 1, plan_name: form.plan_name || 'Starter', monthly_price: form.monthly_price || 149 },
        }),
      })
      const result = await res.json()
      if (!result.success) { setError(result.error || 'Provision failed'); return }
      const now = new Date().toISOString()
      onProvisioned({ tenant_id: result.tenant_id, provisioned_at: now, status: 'provisioned' })
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setProvisioning(false)
    }
  }

  if (form.provisioned_at) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1">Provisioning</h3>
        <span className="inline-flex items-center gap-1 text-xs bg-green-800/60 text-green-300 px-2 py-1 rounded">
          ✓ Provisioned {new Date(form.provisioned_at).toLocaleDateString()}
        </span>
        <div className="space-y-1">
          <a href={`https://${form.slug}.pestflowpro.com`} target="_blank" rel="noreferrer" className="block text-emerald-400 hover:underline text-sm">
            🌐 {form.slug}.pestflowpro.com
          </a>
          <a href={`https://${form.slug}.pestflowpro.com/admin`} target="_blank" rel="noreferrer" className="block text-emerald-400 hover:underline text-sm">
            🔑 {form.slug}.pestflowpro.com/admin
          </a>
        </div>
        {!form.site_revealed_at && (
          <button onClick={handleReveal} className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-500">
            Mark as Revealed →
          </button>
        )}
        {form.site_revealed_at && (
          <p className="text-xs text-gray-500">Revealed {new Date(form.site_revealed_at).toLocaleDateString()}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1">Provisioning</h3>
      {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>}
      {!canCreate && <p className="text-xs text-yellow-400">Fill slug and admin email (Site Setup section) to enable.</p>}
      <button disabled={!canCreate || provisioning} onClick={() => setConfirming(true)}
        className="px-6 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed">
        {provisioning ? '⏳ Creating site…' : '🚀 Create Site'}
      </button>

      {confirming && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full space-y-4">
            <h4 className="font-bold text-white">Confirm Site Creation</h4>
            <p className="text-sm text-gray-300">
              Create <strong>{form.company_name || 'this client'}</strong>'s site at{' '}
              <strong className="text-emerald-400">{form.slug}.pestflowpro.com</strong>?
            </p>
            <p className="text-xs text-gray-500">The client will not be notified automatically.</p>
            <div className="flex gap-3">
              <button onClick={doProvision} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500">Confirm</button>
              <button onClick={() => setConfirming(false)} className="px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
