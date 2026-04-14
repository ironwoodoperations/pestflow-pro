import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { formatPhone } from '../../lib/formatPhone'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'

const PHOTOS = [
  'https://images.pexels.com/photos/4252163/pexels-photo-4252163.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/7127718/pexels-photo-7127718.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3669638/pexels-photo-3669638.jpeg?auto=compress&cs=tinysrgb&w=400',
]

interface Biz { name?: string; phone?: string; tagline?: string; address?: string }
interface HeroMedia { thumbnail_url?: string }
interface HomeContent { hero_headline?: string; subtitle?: string }

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
  // Seed from localStorage so the first paint already shows the real headline.
  const cached = readHeroCache()
  const [biz, setBiz] = useState<Biz>({
    name: cached.bizName,
    phone: cached.phone,
    tagline: cached.tagline,
    address: cached.address,
  })
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({ thumbnail_url: cached.thumbnailUrl })
  const [homeContent, setHomeContent] = useState<HomeContent>({
    hero_headline: cached.headline,
    subtitle: cached.subtitle,
  })
  const [customHeadline, setCustomHeadline] = useState(cached.customHeadline || '')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes, custRes, contentRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('page_content').select('hero_headline,subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      if (custRes.data?.value?.hero_headline) setCustomHeadline(custRes.data.value.hero_headline)
      if (contentRes.data) setHomeContent(contentRes.data as HomeContent)

      writeHeroCache({
        headline: contentRes.data?.hero_headline,
        subtitle: contentRes.data?.subtitle,
        customHeadline: custRes.data?.value?.hero_headline,
        bizName: bizRes.data?.value?.name,
        tagline: bizRes.data?.value?.tagline,
        phone: bizRes.data?.value?.phone,
        address: bizRes.data?.value?.address,
        thumbnailUrl: mediaRes.data?.value?.thumbnail_url,
      })
    })
  }, [])

  const city = biz.address ? biz.address.split(',')[0].trim() : null
  const heroPhoto = heroMedia.thumbnail_url
  const photos = heroPhoto ? [heroPhoto, PHOTOS[1], PHOTOS[2]] : PHOTOS

  return (
    <section className="flex flex-col md:flex-row min-h-[520px]">
      {/* Left — text on textured bg */}
      <div className="md:w-[60%] flex flex-col justify-center px-8 md:px-14 py-16" style={DOT_BG}>
        <h1 className="font-bold leading-tight mb-2" style={{ fontSize: 'clamp(32px,4.5vw,52px)', color: '#1a1a1a' }}>
          {homeContent.hero_headline?.trim() || customHeadline?.trim() || (biz.name ? `${biz.name} — Expert Pest Control` : 'Expert Pest Control')}
        </h1>
        <p className="font-bold italic mb-4" style={{ fontSize: 'clamp(28px,3.5vw,44px)', color: 'var(--color-primary)', lineHeight: 1.1 }}>
          {homeContent.subtitle || biz.tagline || 'Pest Control'}
        </p>
        {city && (
          <p className="text-gray-500 mb-2 text-sm">Serving {city} and the Surrounding Area</p>
        )}
        {biz.phone && (
          <a href={`tel:${biz.phone.replace(/\D/g,'')}`} className="font-bold uppercase tracking-widest mb-6 text-sm inline-block" style={{ color: 'var(--color-primary)' }}>
            📞 CALL TODAY: {formatPhone(biz.phone)}
          </a>
        )}
        <div className="flex gap-3 flex-wrap">
          <a href="/quote" className="font-bold rounded px-7 py-3 text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            Free Estimate
          </a>
          <a href="/pest-control" className="font-bold rounded px-7 py-3 text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', opacity: 0.8, border: '2px solid var(--color-primary)' }}>
            Our Services
          </a>
        </div>
      </div>

      {/* Right — staggered circles */}
      <div className="md:w-[40%] flex items-center justify-center py-10 px-6" style={{ backgroundColor: '#f8f5f0' }}>
        <div style={{ position: 'relative', width: '380px', height: '440px', maxWidth: '100%' }}>
          <Circle src={photos[0]} alt="Pest control service" style={{ top: 0, left: 0 }} />
          <Circle src={photos[1]} alt="Home protection" style={{ top: '40px', right: 0 }} />
          <Circle src={photos[2]} alt="Pest control team" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
        </div>
      </div>
    </section>
  )
}
