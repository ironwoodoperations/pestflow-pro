import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface BusinessInfo {
  tagline?: string
  phone?: string
  address?: string
  founded_year?: string | number
  num_technicians?: number
}
interface Customization { hero_headline?: string }
interface HeroMedia { youtube_id?: string; thumbnail_url?: string }

export default function ShellHero() {
  const [biz, setBiz] = useState<BusinessInfo>({})
  const [custom, setCustom] = useState<Customization>({})
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({})
  const [ctaText, setCtaText] = useState('Get a Free Quote')
  const [heroSubtext, setHeroSubtext] = useState('')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes, custRes, brandRes, contentRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      if (custRes.data?.value) setCustom(custRes.data.value)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      if (contentRes.data?.subtitle) setHeroSubtext(contentRes.data.subtitle)
    })
  }, [])

  const headline = custom.hero_headline || 'Professional Pest Control You Can Trust'

  // Subtitle: use page_content.home.subtitle, fall back to city-based text
  const city = biz.address ? biz.address.split(',')[0].trim() : null
  const fallbackSubtext = city
    ? `Serving ${city} and surrounding areas. Licensed, insured, and ready to help.`
    : 'Licensed, insured, and ready to protect your home.'
  const subtext = heroSubtext || fallbackSubtext

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
      style={{ background: 'var(--color-bg-hero)', ...sectionStyle }}
    >
      {bgImage && <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-bg-cta)', opacity: 0.85 }} />}

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Tagline badge */}
        {biz.tagline && (
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ color: 'var(--color-primary)', border: '1px solid var(--color-primary-dark)' }}>
            {biz.tagline}
          </span>
        )}

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
          {headline}
        </h1>

        {/* Subtext */}
        <p className="text-lg text-gray-300 mt-4 max-w-xl mx-auto">
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
        <p className="mt-6 text-sm text-gray-400">
          {trustParts.join(' · ')}
        </p>
      </div>
    </section>
  )
}
