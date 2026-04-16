import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { formatPhone } from '../../lib/formatPhone'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'
import { resolveHeroImage } from '../../lib/resolveHeroImage'

const FALLBACK_PHOTO = 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'

interface BizState { name?: string; phone?: string; tagline?: string }
interface HeroMedia { mode?: string; thumbnail_url?: string; image_url?: string; url?: string; youtube_id?: string }
interface HomeContent { hero_headline?: string; title?: string; subtitle?: string }

export default function ShellHero() {
  const cached = readHeroCache()
  const [biz, setBiz] = useState<BizState>({
    name: cached.bizName, phone: cached.phone, tagline: cached.tagline,
  })
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({ thumbnail_url: cached.thumbnailUrl })
  const [homeContent, setHomeContent] = useState<HomeContent>({
    hero_headline: cached.heroHeadline, subtitle: cached.subtitle,
  })
  const [customHeadline, setCustomHeadline] = useState(cached.customHeadline || '')
  const [ctaText, setCtaText] = useState(cached.ctaText || 'Get a Free Quote')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes, custRes, contentRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('page_content').select('hero_headline,title,subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      if (custRes.data?.value?.hero_headline) setCustomHeadline(custRes.data.value.hero_headline)
      if (contentRes.data) setHomeContent(contentRes.data as HomeContent)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)

      writeHeroCache({
        heroHeadline: contentRes.data?.hero_headline,
        subtitle: contentRes.data?.subtitle,
        customHeadline: custRes.data?.value?.hero_headline,
        bizName: bizRes.data?.value?.name,
        tagline: bizRes.data?.value?.tagline,
        phone: bizRes.data?.value?.phone,
        thumbnailUrl: mediaRes.data?.value?.thumbnail_url,
        imageUrl: resolveHeroImage(mediaRes.data?.value) ?? undefined,
        youtubeId: mediaRes.data?.value?.youtube_id,
        ctaText: brandRes.data?.value?.cta_text,
      })
    })
  }, [])

  const bgPhoto = resolveHeroImage(heroMedia) ?? FALLBACK_PHOTO

  const headline = homeContent.hero_headline?.trim()
    || homeContent.title?.trim()
    || customHeadline?.trim()
    || (biz.name ? `${biz.name} — Expert Pest Control` : 'Expert Pest Control You Can Count On')
  const subtitle = homeContent.subtitle || biz.tagline || 'Professional and personalized service for your home and business'

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: bgPhoto ? `url(${bgPhoto})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {bgPhoto && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 0, pointerEvents: 'none',
        }} />
      )}
      <div className="relative z-10 flex items-center justify-center px-4 w-full py-16">
        <div className="text-center w-full" style={{ background: 'rgba(0,0,0,0.72)', borderRadius: '16px', padding: '48px 40px', maxWidth: '640px' }}>
          <h1 className="font-bold text-white" style={{ fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.2, marginBottom: '16px' }}>
            {headline}
          </h1>
          <p style={{ color: 'white', opacity: 0.9, marginBottom: '32px', fontSize: '18px', lineHeight: 1.6 }}>
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/quote" className="font-bold rounded-full px-8 py-3 transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
              {ctaText}
            </a>
            {biz.phone && (
              <a href={`tel:${biz.phone.replace(/\D/g, '')}`}
                className="font-semibold rounded-full px-8 py-3 transition hover:bg-white hover:opacity-90"
                style={{ border: '2px solid white', color: 'white' }}>
                Call {formatPhone(biz.phone)}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
