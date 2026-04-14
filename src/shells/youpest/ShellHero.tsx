import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'

export default function ShellHero() {
  // Seed from localStorage so first paint already shows the real hero.
  const cached = readHeroCache()
  const [headline, setHeadline] = useState(cached.heroHeadline || cached.customHeadline || 'Your Home. Protected.')
  const [sub, setSub] = useState(cached.subtitle || 'Fast, effective pest control you can trust.')
  const [cta, setCta] = useState(cached.ctaText || 'Get a Free Quote')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [contentRes, brandingRes, pageRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('hero_headline,subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
      ])
      // Priority: page_content.hero_headline → customization.hero_headline → keep current state
      const resolvedHeadline = pageRes.data?.hero_headline?.trim()
        || contentRes.data?.value?.hero_headline?.trim()
      if (resolvedHeadline) setHeadline(resolvedHeadline)
      if (brandingRes.data?.value?.cta_text) setCta(brandingRes.data.value.cta_text)
      if (pageRes.data?.subtitle) setSub(pageRes.data.subtitle)

      writeHeroCache({
        heroHeadline: pageRes.data?.hero_headline,
        customHeadline: contentRes.data?.value?.hero_headline,
        subtitle: pageRes.data?.subtitle,
        ctaText: brandingRes.data?.value?.cta_text,
      })
    })
  }, [])

  return (
    <section style={{ background: 'var(--color-bg-hero)' }} className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <span style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}
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
