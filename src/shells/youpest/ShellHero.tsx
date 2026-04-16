import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'
import { resolveHeroImage } from '../../lib/resolveHeroImage'
import { usePageContent } from '../../hooks/usePageContent'

interface HeroMedia { mode?: string; image_url?: string; url?: string; thumbnail_url?: string }

export default function ShellHero() {
  const cached = readHeroCache()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [headline, setHeadline] = useState(cached.heroHeadline || cached.customHeadline || 'Your Home. Protected.')
  const [sub, setSub] = useState(cached.subtitle || 'Fast, effective pest control you can trust.')
  const [cta, setCta] = useState(cached.ctaText || 'Get a Free Quote')
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({ image_url: cached.imageUrl })

  const { content } = usePageContent(tenantId, 'home')

  useEffect(() => {
    resolveTenantId().then(async (id) => {
      if (!id) return
      setTenantId(id)
      const [contentRes, brandingRes, mediaRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'branding').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'hero_media').maybeSingle(),
      ])
      if (contentRes.data?.value?.hero_headline) setHeadline(contentRes.data.value.hero_headline)
      if (brandingRes.data?.value?.cta_text) setCta(brandingRes.data.value.cta_text)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      writeHeroCache({
        customHeadline: contentRes.data?.value?.hero_headline,
        ctaText: brandingRes.data?.value?.cta_text,
        imageUrl: resolveHeroImage(mediaRes.data?.value) ?? undefined,
      })
    })
  }, [])

  useEffect(() => {
    if (!content) return
    const resolvedH = content.hero_headline?.trim() || content.title?.trim()
    if (resolvedH) setHeadline(resolvedH)
    if (content.subtitle) setSub(content.subtitle)
    writeHeroCache({ heroHeadline: content.hero_headline || undefined, subtitle: content.subtitle || undefined })
  }, [content])

  const bgImage = resolveHeroImage(heroMedia)

  return (
    <section
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'relative' }
        : { background: 'var(--color-bg-hero)', position: 'relative' }}
      className="py-24 px-4"
    >
      {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <span style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}
          className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
          Licensed &amp; Insured
        </span>
        <h1 className="text-white font-black text-5xl md:text-6xl leading-tight mb-6">{headline}</h1>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">{sub}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contact" style={{ background: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            className="px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg">{cta}</Link>
          <Link to="/pest-control" className="px-8 py-4 rounded-xl border-2 border-gray-600 text-gray-300 font-bold text-lg hover:border-gray-400 transition">
            Our Services
          </Link>
        </div>
      </div>
    </section>
  )
}
