import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'

interface BusinessInfo {
  name?: string
  tagline?: string
  phone?: string
  address?: string
  founded_year?: string | number
  num_technicians?: number
}
interface Customization { hero_headline?: string }
interface HeroMedia { youtube_id?: string; thumbnail_url?: string }
interface HomeContent { hero_headline?: string; subtitle?: string; intro?: string }

export default function ShellHero() {
  // Seed state synchronously from localStorage so the first paint matches the
  // tenant's real hero content instead of the generic fallback. See heroCache.ts.
  const cached = readHeroCache()
  const [biz, setBiz] = useState<BusinessInfo>({
    name: cached.bizName,
    tagline: cached.tagline,
    phone: cached.phone,
    address: cached.address,
    founded_year: cached.foundedYear,
    num_technicians: cached.numTechnicians,
  })
  const [custom, setCustom] = useState<Customization>({ hero_headline: cached.customHeadline })
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({
    thumbnail_url: cached.thumbnailUrl,
    youtube_id: cached.youtubeId,
  })
  const [ctaText, setCtaText] = useState(cached.ctaText || 'Get a Free Quote')
  const [homeContent, setHomeContent] = useState<HomeContent>({
    hero_headline: cached.heroHeadline,
    subtitle: cached.subtitle,
    intro: cached.intro,
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

  const headline = homeContent.hero_headline?.trim()
    || custom.hero_headline?.trim()
    || (biz.name ? `${biz.name} — Professional Pest Control` : 'Professional Pest Control You Can Trust')

  // Subtext: use page_content intro, then subtitle, then city-based fallback
  const city = biz.address ? biz.address.split(',')[0].trim() : null
  const fallbackSubtext = city
    ? `Serving ${city} and surrounding areas. Licensed, insured, and ready to help.`
    : 'Licensed, insured, and ready to protect your home.'
  const subtext = homeContent.intro || homeContent.subtitle || fallbackSubtext

  // Trust line — only render fields that exist
  const trustParts: string[] = []
  trustParts.push('Licensed & Insured')
  if (biz.num_technicians) trustParts.push(`${biz.num_technicians}+ Technicians`)
  if (biz.founded_year) trustParts.push(`Est. ${biz.founded_year}`)

  // Background image: prefer thumbnail_url, then construct from youtube_id
  const bgImage = heroMedia.thumbnail_url
    || (heroMedia.youtube_id ? `https://img.youtube.com/vi/${heroMedia.youtube_id}/maxresdefault.jpg` : null)

  const sectionStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <section
      className="relative text-white min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)', ...sectionStyle }}
    >
      {bgImage && <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-bg-cta)', opacity: 0.85 }} />}

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Tagline badge */}
        {biz.tagline && (
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {biz.tagline}
          </span>
        )}

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
          {headline}
        </h1>

        {/* Subtext */}
        <p className="text-lg mt-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {subtext}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Link
            to="/quote"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            className="font-semibold px-8 py-3 rounded-lg transition"
          >
            {ctaText}
          </Link>
          {biz.phone && (
            <a
              href={`tel:${biz.phone.replace(/\D/g, '')}`}
              className="border border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition"
            >
              Call Now
            </a>
          )}
        </div>

        {/* Trust line */}
        <p className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {trustParts.join(' · ')}
        </p>
      </div>
    </section>
  )
}
