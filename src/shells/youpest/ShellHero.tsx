import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

const BG    = '#1a1a1a'
const ACCENT = '#22c55e'

export default function ShellHero() {
  const [headline, setHeadline] = useState('Your Home. Protected.')
  const [sub] = useState('Fast, effective pest control you can trust.')
  const [cta, setCta] = useState('Get a Free Quote')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      const [contentRes, brandingRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (contentRes.data?.value?.hero_headline) setHeadline(contentRes.data.value.hero_headline)
      if (brandingRes.data?.value?.cta_text) setCta(brandingRes.data.value.cta_text)
    })
  }, [])

  return (
    <section style={{ background: 'var(--color-bg-hero)' }} className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <span style={{ background: ACCENT + '22', color: ACCENT }}
          className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
          Licensed &amp; Insured
        </span>
        <h1 className="text-white font-black text-5xl md:text-6xl leading-tight mb-6">
          {headline}
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">{sub}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contact" style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            className="px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg">
            {cta}
          </Link>
          <Link to="/pest-control"
            className="px-8 py-4 rounded-xl border-2 border-gray-600 text-gray-300 font-bold text-lg hover:border-gray-400 transition">
            Our Services
          </Link>
        </div>
      </div>
    </section>
  )
}
