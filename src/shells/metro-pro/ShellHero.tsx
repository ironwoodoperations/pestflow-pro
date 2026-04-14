import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'

interface BizInfo { name?: string; phone?: string; tagline?: string; address?: string }
interface SeoSettings { service_areas?: string[] }
interface Customization { hero_headline?: string }
interface HeroMedia { youtube_id?: string; thumbnail_url?: string }

export default function MetroProHero() {
  // Seed from localStorage to prevent the fallback→real headline flash.
  const cached = readHeroCache()
  const [biz, setBiz] = useState<BizInfo>({
    name: cached.bizName,
    phone: cached.phone,
    tagline: cached.tagline,
    address: cached.address,
  })
  const [seo, setSeo] = useState<SeoSettings>({})
  const [custom, setCustom] = useState<Customization>({ hero_headline: cached.customHeadline })
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({
    thumbnail_url: cached.thumbnailUrl,
    youtube_id: cached.youtubeId,
  })
  const [ctaText, setCtaText] = useState(cached.ctaText || 'Schedule Inspection')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, seoRes, custRes, brandRes, mediaRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'seo').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (seoRes.data?.value) setSeo(seoRes.data.value)
      if (custRes.data?.value) setCustom(custRes.data.value)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)

      writeHeroCache({
        customHeadline: custRes.data?.value?.hero_headline,
        bizName: bizRes.data?.value?.name,
        tagline: bizRes.data?.value?.tagline,
        phone: bizRes.data?.value?.phone,
        address: bizRes.data?.value?.address,
        ctaText: brandRes.data?.value?.cta_text,
        thumbnailUrl: mediaRes.data?.value?.thumbnail_url,
        youtubeId: mediaRes.data?.value?.youtube_id,
      })
    })
  }, [])

  const headline = custom.hero_headline
    || (biz.name ? `${biz.name} Pest Control Services` : 'Professional Pest Control Services')

  const subtext = biz.tagline
    || 'Licensed, insured, and ready to protect your home and business.'

  const firstArea = seo.service_areas?.[0]

  const bgImage = heroMedia.thumbnail_url
    || (heroMedia.youtube_id ? `https://img.youtube.com/vi/${heroMedia.youtube_id}/maxresdefault.jpg` : null)

  return (
    <section
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)`,
        ...(bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* City/region pill badge */}
        {firstArea && (
          <span className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/30 text-white/90 bg-white/10 backdrop-blur-sm">
            Serving {firstArea} &amp; Surrounding Areas
          </span>
        )}

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
          {headline}
        </h1>

        {/* Subtext */}
        <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
          {subtext}
        </p>

        {/* 3 CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            {ctaText}
          </Link>
          <Link to="/quote" className="font-semibold px-8 py-3.5 rounded-lg transition hover:bg-gray-100" style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}>
            Start Service
          </Link>
          {biz.phone && (
            <a href={`tel:${biz.phone.replace(/\D/g, '')}`} className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)' }}>
              Call Now
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
