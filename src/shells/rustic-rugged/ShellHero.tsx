import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { formatPhone } from '../../lib/formatPhone'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'
import { resolveHeroImage } from '../../lib/resolveHeroImage'
import { usePageContent } from '../../hooks/usePageContent'

const PHOTOS = [
  'https://images.pexels.com/photos/4252163/pexels-photo-4252163.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/7127718/pexels-photo-7127718.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3669638/pexels-photo-3669638.jpeg?auto=compress&cs=tinysrgb&w=400',
]

interface Biz { name?: string; phone?: string; tagline?: string; address?: string }
interface HeroMedia { mode?: string; thumbnail_url?: string; image_url?: string; url?: string }
interface HomeContent { hero_headline?: string; title?: string; subtitle?: string }

const DOT_BG: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
  backgroundSize: '22px 22px',
  backgroundColor: '#ffffff',
}

const Circle = ({ src, alt, style }: { src: string; alt: string; style: React.CSSProperties }) => (
  <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', border: '5px solid var(--color-primary)', ...style }}>
    <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
  </div>
)

export default function ShellHero() {
  const cached = readHeroCache()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [biz, setBiz] = useState<Biz>({ name: cached.bizName, phone: cached.phone, tagline: cached.tagline, address: cached.address })
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({ thumbnail_url: cached.thumbnailUrl })
  const [homeContent, setHomeContent] = useState<HomeContent>({ hero_headline: cached.heroHeadline, subtitle: cached.subtitle })
  const [customHeadline, setCustomHeadline] = useState(cached.customHeadline || '')
  const [ctaText, setCtaText] = useState(cached.ctaText || 'Get a Free Quote')

  const { content } = usePageContent(tenantId, 'home')

  useEffect(() => {
    resolveTenantId().then(async (id) => {
      if (!id) return
      setTenantId(id)
      const [bizRes, mediaRes, custRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'hero_media').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      if (custRes.data?.value?.hero_headline) setCustomHeadline(custRes.data.value.hero_headline)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      writeHeroCache({
        customHeadline: custRes.data?.value?.hero_headline,
        bizName: bizRes.data?.value?.name,
        tagline: bizRes.data?.value?.tagline,
        phone: bizRes.data?.value?.phone,
        address: bizRes.data?.value?.address,
        thumbnailUrl: mediaRes.data?.value?.thumbnail_url,
        imageUrl: resolveHeroImage(mediaRes.data?.value) ?? undefined,
        ctaText: brandRes.data?.value?.cta_text,
      })
    })
  }, [])

  useEffect(() => {
    if (!content) return
    const c = content as HomeContent
    setHomeContent(c)
    writeHeroCache({ heroHeadline: c.hero_headline || undefined, subtitle: c.subtitle || undefined })
  }, [content])

  const city = biz.address ? biz.address.split(',')[0].trim() : null
  const heroPhoto = resolveHeroImage(heroMedia)
  const photos = heroPhoto ? [heroPhoto, PHOTOS[1], PHOTOS[2]] : PHOTOS

  return (
    <section className="relative flex flex-col md:flex-row min-h-[520px]"
      style={{ backgroundImage: heroPhoto ? `url(${heroPhoto})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {heroPhoto && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
      <div className="md:w-[60%] flex flex-col justify-center px-8 md:px-14 py-16" style={{ ...DOT_BG, position: 'relative', zIndex: 1 }}>
        <h1 className="font-bold leading-tight mb-2" style={{ fontSize: 'clamp(32px,4.5vw,52px)', color: '#1a1a1a' }}>
          {homeContent.hero_headline?.trim() || customHeadline?.trim() || biz.name?.trim() || 'Expert Pest Control'}
        </h1>
        <p className="font-bold italic mb-4" style={{ fontSize: 'clamp(28px,3.5vw,44px)', color: 'var(--color-primary)', lineHeight: 1.1 }}>
          {homeContent.subtitle || biz.tagline || 'Pest Control'}
        </p>
        {city && <p className="text-gray-500 mb-2 text-sm">Serving {city} and the Surrounding Area</p>}
        {biz.phone && (
          <a href={`tel:${biz.phone.replace(/\D/g,'')}`} className="font-bold uppercase tracking-widest mb-6 text-sm inline-block" style={{ color: 'var(--color-primary)' }}>
            📞 CALL TODAY: {formatPhone(biz.phone)}
          </a>
        )}
        <div className="flex gap-3 flex-wrap">
          <a href="/quote" className="font-bold rounded px-7 py-3 text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>{ctaText}</a>
          <a href="/pest-control" className="font-bold rounded px-7 py-3 text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', opacity: 0.8, border: '2px solid var(--color-primary)' }}>Our Services</a>
        </div>
      </div>
      <div className="md:w-[40%] flex items-center justify-center py-10 px-6" style={{ backgroundColor: '#f8f5f0', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'relative', width: '380px', height: '440px', maxWidth: '100%' }}>
          <Circle src={photos[0]} alt="Pest control service" style={{ top: 0, left: 0 }} />
          <Circle src={photos[1]} alt="Home protection" style={{ top: '40px', right: 0 }} />
          <Circle src={photos[2]} alt="Pest control team" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
        </div>
      </div>
    </section>
  )
}
