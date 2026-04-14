import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'

interface BusinessInfo { name?: string; phone?: string; tagline?: string; address?: string; founded_year?: string | number; num_technicians?: number }
interface Customization { hero_headline?: string }
interface HeroMedia { youtube_id?: string; thumbnail_url?: string }
interface HomeContent { hero_headline?: string; subtitle?: string; intro?: string }

const STRIPE = 'repeating-linear-gradient(15deg, transparent, transparent 30px, rgba(255,255,255,0.025) 30px, rgba(255,255,255,0.025) 60px)'

export default function MetroProHero() {
  // Seed from localStorage to prevent fallback→real headline flash.
  const cached = readHeroCache()
  const [biz, setBiz] = useState<BusinessInfo>({
    name: cached.bizName, phone: cached.phone, tagline: cached.tagline,
    address: cached.address, founded_year: cached.foundedYear, num_technicians: cached.numTechnicians,
  })
  const [custom, setCustom] = useState<Customization>({ hero_headline: cached.customHeadline })
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({
    thumbnail_url: cached.thumbnailUrl, youtube_id: cached.youtubeId,
  })
  const [ctaText, setCtaText] = useState(cached.ctaText || 'Get Free Quote')
  const [homeContent, setHomeContent] = useState<HomeContent>({
    hero_headline: cached.heroHeadline, subtitle: cached.subtitle, intro: cached.intro,
  })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes, custRes, brandRes, contentRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('hero_headline,subtitle,intro').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      if (custRes.data?.value) setCustom(custRes.data.value)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      if (contentRes.data) setHomeContent(contentRes.data)

      writeHeroCache({
        heroHeadline: contentRes.data?.hero_headline,
        subtitle: contentRes.data?.subtitle,
        intro: contentRes.data?.intro,
        customHeadline: custRes.data?.value?.hero_headline,
        bizName: bizRes.data?.value?.name,
        tagline: bizRes.data?.value?.tagline,
        phone: bizRes.data?.value?.phone,
        address: bizRes.data?.value?.address,
        foundedYear: bizRes.data?.value?.founded_year,
        numTechnicians: bizRes.data?.value?.num_technicians,
        ctaText: brandRes.data?.value?.cta_text,
        thumbnailUrl: mediaRes.data?.value?.thumbnail_url,
        youtubeId: mediaRes.data?.value?.youtube_id,
      })
    })
  }, [])

  // Priority: page_content.hero_headline → customization.hero_headline → generic fallback
  const headline = homeContent.hero_headline?.trim()
    || custom.hero_headline?.trim()
    || (biz.name ? `${biz.name} — Professional Pest Control` : 'Professional Pest Control You Can Trust')

  const city = biz.address ? biz.address.split(',')[0].trim() : null
  const fallbackSubtext = city
    ? `Serving ${city} and surrounding areas. Licensed, insured, and ready to help.`
    : 'Licensed, insured, and ready to protect your home and business.'
  const subtext = homeContent.intro || homeContent.subtitle || fallbackSubtext

  const bgImage = heroMedia.thumbnail_url
    || (heroMedia.youtube_id ? `https://img.youtube.com/vi/${heroMedia.youtube_id}/maxresdefault.jpg` : null)

  return (
    <section
      id="main-content"
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{
        background: `${STRIPE}, linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)`,
        ...(bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
      }}
    >
      {/* Dark overlay when bg image is present */}
      {bgImage && <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />}
      {/* Stripe pattern over image */}
      {bgImage && <div className="absolute inset-0 pointer-events-none" style={{ background: STRIPE }} />}

      <div className="relative z-10 max-w-4xl mx-auto text-center py-20">
        {/* H1 */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-4">
          {headline}
        </h1>

        {/* Accent divider — 4px tall, 60px wide */}
        <div className="w-16 h-1 mx-auto mb-6" style={{ backgroundColor: 'var(--color-accent)' }} />

        {/* Subtitle */}
        <p className="text-xl max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {subtext}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/quote"
            className="font-bold px-10 py-4 text-white text-sm uppercase tracking-widest transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {ctaText}
          </Link>
          {biz.phone && (
            <a
              href={`tel:${biz.phone.replace(/\D/g, '')}`}
              className="font-bold px-10 py-4 text-sm uppercase tracking-widest border border-white/40 text-white hover:bg-white/10 transition"
            >
              Call Now
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
