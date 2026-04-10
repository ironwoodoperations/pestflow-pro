import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

interface Props {
  prospectId: string
  form: Partial<Prospect>
  layout: Record<string, any>
}

export default function ApplyProSiteButton({ prospectId, form, layout }: Props) {
  const [applying, setApplying] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState(false)

  const isEmpty = !layout || Object.keys(layout).length === 0

  const handleApply = async () => {
    if (isEmpty) { setError('Generate a layout first'); return }
    setApplying(true)
    setError(null)
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.refreshSession()
      if (!session || sessErr) { setError('Session expired — refresh and try again'); return }

      // SAFEGUARD: Check if slug already exists before submitting — never overwrite a live tenant
      if (form.slug) {
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', form.slug)
          .maybeSingle()
        if (existingTenant) {
          setError(`Slug "${form.slug}" is already in use. Try "${form.slug}2" instead.`)
          setApplying(false)
          return
        }
      }

      const bi = (form.business_info || {}) as Record<string, any>
      const br = (form.branding    || {}) as Record<string, any>
      const cu = (form.customization || {}) as Record<string, any>

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ironwood-provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prospect_id:   prospectId,
          slug:          form.slug,
          admin_email:   form.admin_email || form.email || bi.email || '',
          admin_password: form.admin_password,
          business_info: {
            name:            bi.name            || form.company_name || '',
            phone:           bi.phone           || form.phone        || '',
            email:           bi.email           || form.admin_email  || '',
            address:         bi.address         || '',
            tagline:         bi.tagline         || '',
            hours:           bi.hours           || '',
            industry:        bi.industry        || 'Pest Control',
            license:         bi.license         || '',
            certifications:  bi.certifications  || '',
            founded_year:    bi.founded_year    || '',
            num_technicians: bi.num_technicians || '',
          },
          branding: {
            primary_color: br.primary_color || '#E87800',
            accent_color:  br.accent_color  || '#1a1a1a',
            template:      'youpest',
            cta_text:      br.cta_text      || 'Get a Free Quote',
            logo_url:      br.logo_url      || null,
            favicon_url:   br.favicon_url   || null,
          },
          customization: {
            hero_headline:       cu.hero_headline       || (form.company_name ? `${form.company_name} — Professional Pest Control` : ''),
            show_license:        cu.show_license        ?? true,
            show_years:          cu.show_years          ?? true,
            show_technicians:    cu.show_technicians    ?? true,
            show_certifications: cu.show_certifications ?? true,
          },
          social: {
            facebook:  form.social_facebook,
            instagram: form.social_instagram,
            google:    form.social_google,
            youtube:   form.social_youtube,
          },
          subscription: {
            tier:          form.plan_tier    || 3,
            plan_name:     form.plan_name    || 'Pro',
            monthly_price: form.monthly_price || 349,
          },
        }),
      })
      if (res.status === 401) { setError('Session expired — refresh and try again'); return }
      const result = await res.json()
      if (!result.success) { setError(result.error || 'Provision failed'); return }
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setApplying(false)
    }
  }

  if (done) {
    return (
      <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3">
        <p className="text-emerald-400 text-sm font-semibold">✓ Pro site created</p>
        <a href={`https://${form.slug}.pestflowpro.com`} target="_blank" rel="noreferrer"
          className="text-emerald-300 hover:underline text-xs mt-1 block">
          {form.slug}.pestflowpro.com →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleApply}
        disabled={applying || isEmpty}
        className="w-full px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {applying && (
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {applying ? 'Creating Pro site…' : '🚀 Apply & Create Site'}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
