import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'
import PreProvisionChecklist from './PreProvisionChecklist'

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

const TIER_PROVISION: Record<string, { tier: number; plan_name: string; monthly_price: number }> = {
  starter: { tier: 1, plan_name: 'Starter', monthly_price: 149 },
  growth:  { tier: 2, plan_name: 'Grow',    monthly_price: 249 },
  pro:     { tier: 3, plan_name: 'Pro',     monthly_price: 349 },
  elite:   { tier: 4, plan_name: 'Elite',   monthly_price: 499 },
}

interface Props {
  form: Partial<Prospect>
  prospectId: string | null
  onProvisioned: (updates: Partial<Prospect>) => void
}

export default function ProvisioningSection({ form, prospectId, onProvisioned }: Props) {
  const [confirming, setConfirming]         = useState(false)
  const [showChecklist, setShowChecklist]   = useState(false)
  const [provisioning, setProvisioning]     = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [sendingCreds, setSendingCreds]     = useState(false)
  const [sendingReveal, setSendingReveal]   = useState(false)
  const [zernioAccounts, setZernioAccounts] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (!form.tenant_id) return
    supabase.from('settings').select('value')
      .eq('tenant_id', form.tenant_id).eq('key', 'integrations').maybeSingle()
      .then(({ data }) => {
        if (data?.value?.zernio_accounts) setZernioAccounts(data.value.zernio_accounts)
      })
  }, [form.tenant_id])

  const resolvedAdminEmail =
    form.admin_email?.trim() ||
    form.email?.trim() ||
    (form.business_info as any)?.email?.trim() ||
    (form as any).intake_data?.business?.email?.trim() ||
    ''

  const canCreate = !!form.slug && !!resolvedAdminEmail && isValidEmail(resolvedAdminEmail)
  const canReveal = true

  const sendCredentialsEmail = async () => {
    const adminEmail = form.admin_email?.trim() || form.email?.trim() || ''
    if (!adminEmail || !form.slug) { toast.error('Admin email and slug are required.'); return }
    setSendingCreds(true)
    try {
      const firstName   = (form.contact_name || form.company_name || '').split(' ')[0] || 'there'
      const siteUrl     = `https://${form.slug}.pestflowpro.com`
      const adminUrl    = `https://${form.slug}.pestflowpro.com/admin`
      // Get a fresh session token at click time — never use a cached token.
      // Mirrors the pattern used by the provision flow elsewhere in this file.
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.refreshSession()
      if (!freshSession || sessionError) {
        toast.error('Your session has expired. Please sign out and sign back in.')
        return
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-credentials-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          to:            adminEmail,
          firstName,
          businessName:  form.company_name || '',
          siteUrl,
          adminUrl,
          adminEmail,
          adminPassword: form.admin_password || '',
        }),
      })
      const data = await res.json()
      if (data.success) toast.success(`Credentials sent to ${adminEmail}`)
      else toast.error(data.error || 'Failed to send credentials email')
    } catch (e: any) {
      toast.error(e.message || 'Network error')
    } finally {
      setSendingCreds(false)
    }
  }

  const sendRevealReadyEmail = async () => {
    const to = form.admin_email?.trim() || form.email?.trim() || ''
    if (!to || !form.slug) { toast.error('Admin email and slug are required.'); return }
    setSendingReveal(true)
    try {
      const firstName  = (form.contact_name || form.company_name || '').split(' ')[0] || 'there'
      const siteUrl    = `https://${form.slug}.pestflowpro.com`
      const adminUrl   = `https://${form.slug}.pestflowpro.com/admin`
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reveal-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ to, firstName, businessName: form.company_name || '', siteUrl, adminUrl }),
      })
      const data = await res.json()
      if (data.success) toast.success(`Reveal ready email sent to ${to}`)
      else toast.error(data.error || 'Failed to send reveal ready email')
    } catch (e: any) {
      toast.error(e.message || 'Network error')
    } finally {
      setSendingReveal(false)
    }
  }

  const handleReveal = async () => {
    if (!prospectId) return
    const now = new Date().toISOString()
    await supabase.from('prospects').update({ site_revealed_at: now, status: 'active' }).eq('id', prospectId)
    onProvisioned({ site_revealed_at: now, status: 'active' })
  }

  const doProvision = async () => {
    if (!resolvedAdminEmail) {
      setError('Admin email is required. Add it in Site Setup or import intake data first.')
      return
    }
    setConfirming(false)
    setProvisioning(true)
    setError(null)
    try {
      // SAFEGUARD: Check if slug already exists before submitting — never overwrite a live tenant
      if (form.slug) {
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', form.slug)
          .maybeSingle()
        if (existingTenant) {
          setError(`Slug "${form.slug}" is already in use. Try "${form.slug}2" instead.`)
          setProvisioning(false)
          return
        }
      }
      // Get a fresh session token at click time — never use a cached token
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.refreshSession()
      if (!freshSession || sessionError) {
        setError('Your session has expired. Please sign out and sign back in.')
        return
      }
      const accessToken = freshSession.access_token

      const bi = (form.business_info || {}) as Record<string, any>
      const br = (form.branding || {}) as Record<string, any>
      const cu = (form.customization || {}) as Record<string, any>

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ironwood-provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prospect_id:  prospectId,
          slug:         form.slug,
          admin_email:  resolvedAdminEmail,
          admin_password: form.admin_password,
          business_info: {
            name:    bi.name    || form.company_name || '',
            phone:   bi.phone   || form.phone        || '',
            email:   bi.email   || form.admin_email  || '',
            address: bi.address || '',
            tagline: bi.tagline || '',
            hours:   bi.hours   || '',
            industry:        bi.industry        || 'Pest Control',
            license:         bi.license         || '',
            certifications:  bi.certifications  || '',
            founded_year:    bi.founded_year    || '',
            num_technicians: bi.num_technicians || '',
          },
          branding: {
            primary_color: br.primary_color || '#E87800',
            accent_color:  br.accent_color  || '#1a1a1a',
            template:      br.template      || 'modern-pro',
            cta_text:      br.cta_text      || 'Get a Free Quote',
            logo_url:      br.logo_url      || null,
            favicon_url:   br.favicon_url   || null,
          },
          customization: {
            hero_headline:       cu.hero_headline       || form.company_name || '',
            show_license:        cu.show_license        ?? true,
            show_years:          cu.show_years          ?? true,
            show_technicians:    cu.show_technicians    ?? true,
            show_certifications: cu.show_certifications ?? true,
          },
          social: {
            facebook: form.social_facebook, instagram: form.social_instagram,
            google: form.social_google, youtube: form.social_youtube,
          },
          subscription: (() => {
            // Always derive subscription from form.tier (tier selector) — the source of truth.
            // form.plan_tier/plan_name/monthly_price may be stale from a prior plan selection.
            const td = TIER_PROVISION[form.tier || 'growth'] ?? TIER_PROVISION.growth
            return {
              tier:          td.tier,
              plan_name:     td.plan_name,
              monthly_price: td.monthly_price,
            }
          })(),
        }),
      })
      if (res.status === 401) {
        setError('Session expired — please refresh the page and try again.')
        return
      }
      const result = await res.json()
      if (!result.success) { setError(result.error || 'Provision failed'); return }
      const now = new Date().toISOString()
      onProvisioned({ tenant_id: result.tenant_id, provisioned_at: now, status: 'provisioned', pipeline_stage: 'it_in_progress' })
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setProvisioning(false)
    }
  }

  if (form.provisioned_at) {
    return (
      <div className="space-y-4">
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
        <button onClick={sendCredentialsEmail} disabled={sendingCreds}
          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
          {sendingCreds ? 'Sending…' : '📧 Send Login Credentials'}
        </button>

        {/* Reveal Call Checklist */}
        {!form.site_revealed_at && form.tenant_id && (
          <div className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-900/40">
            <h4 className="font-semibold text-amber-300 text-sm">Reveal Call Checklist</h4>

            {/* Zernio social connection status */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Social Media (via Zernio)</p>
              {zernioAccounts && Object.keys(zernioAccounts).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(zernioAccounts).map(([platform, info]: [string, any]) => (
                    <span key={platform} className="inline-flex items-center gap-1 text-xs bg-emerald-900/50 text-emerald-300 border border-emerald-700 px-2 py-1 rounded">
                      ✓ {platform.charAt(0).toUpperCase() + platform.slice(1)} connected
                      {info?.page_name ? ` — ${info.page_name}` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No social accounts connected via Zernio yet. Client connects during reveal call from their admin dashboard.</p>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-gray-600">☐</span>
                Site URL confirmed working
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-gray-600">☐</span>
                Admin login confirmed working
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={sendRevealReadyEmail}
                disabled={sendingReveal}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
              >
                {sendingReveal ? 'Sending…' : '📧 Send Reveal Ready Email'}
              </button>
              <button
                onClick={handleReveal}
                disabled={!canReveal}
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mark as Revealed →
              </button>
            </div>
          </div>
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
      {!canCreate && (
        <p className="text-xs text-yellow-400">
          {!form.slug ? 'Fill slug to enable. ' : ''}
          {!resolvedAdminEmail ? 'Fill admin email to enable (or import intake data).' : ''}
          {resolvedAdminEmail && !isValidEmail(resolvedAdminEmail) ? 'Admin email must be a valid address (e.g. admin@company.com)' : ''}
        </p>
      )}
      <button disabled={!canCreate || provisioning} onClick={() => setShowChecklist(true)}
        className="px-6 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed">
        {provisioning ? '⏳ Creating site…' : '🚀 Create Site'}
      </button>

      {showChecklist && (
        <PreProvisionChecklist
          prospect={form}
          onConfirm={() => { setShowChecklist(false); doProvision() }}
          onCancel={() => setShowChecklist(false)}
        />
      )}

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
