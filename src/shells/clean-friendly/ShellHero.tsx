import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { formatPhone } from '../../lib/formatPhone'
import { readHeroCache, writeHeroCache } from '../../lib/heroCache'

interface Biz { name?: string; phone?: string }
interface HomeContent { hero_headline?: string; subtitle?: string }

const HERO_IMAGE = '/images/pests/tech_1.jpg'

const STRIPS = [
  { icon: '🏠', title: 'Residential', sub: 'Protecting your home and family', href: '/pest-control' },
  { icon: '🏢', title: 'Commercial', sub: 'Keeping your business pest-free', href: '/pest-control' },
  { icon: '🪲', title: 'Termites', sub: 'Full termite inspection & treatment', href: '/termite-control' },
]

export default function ShellHero() {
  // Seed from localStorage so the first paint matches the tenant's saved
  // headline/phone/name instead of the generic fallback.
  const cached = readHeroCache()
  const [biz, setBiz] = useState<Biz>({ name: cached.bizName, phone: cached.phone })
  const [homeContent, setHomeContent] = useState<HomeContent>({
    hero_headline: cached.heroHeadline,
    subtitle: cached.subtitle,
  })
  const [customHeadline, setCustomHeadline] = useState(cached.customHeadline || '')
  const [ctaText, setCtaText] = useState(cached.ctaText || 'Get a Free Quote')
  const [heroSubtext, setHeroSubtext] = useState(cached.subtitle || 'Call for Same-Day Service')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, custRes, brandRes, contentRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('hero_headline,subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz({ name: bizRes.data.value.name, phone: bizRes.data.value.phone })
      if (custRes.data?.value?.hero_headline) setCustomHeadline(custRes.data.value.hero_headline)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      if (contentRes.data) setHomeContent(contentRes.data as HomeContent)
      if (contentRes.data?.subtitle) setHeroSubtext(contentRes.data.subtitle)

      writeHeroCache({
        heroHeadline: contentRes.data?.hero_headline,
        subtitle: contentRes.data?.subtitle,
        customHeadline: custRes.data?.value?.hero_headline,
        bizName: bizRes.data?.value?.name,
        phone: bizRes.data?.value?.phone,
        ctaText: brandRes.data?.value?.cta_text,
      })
    })
  }, [])

  const headline = homeContent.hero_headline?.trim()
    || customHeadline?.trim()
    || (biz.name ? `${biz.name} — Professional Pest Control` : 'Professional Pest Control You Can Trust')

  const dialPhone = biz.phone ? `tel:${biz.phone.replace(/\D/g, '')}` : '#'

  return (
    <>
      {/* Hero section */}
      <section
        className="relative flex items-center justify-center min-h-[65vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      >
        {/* Overlay — tinted with palette primary */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 40%, #000), color-mix(in srgb, var(--color-primary) 30%, #000))' }} />

        <div className="relative z-10 text-center px-4 py-16">
          {biz.name && (
            <p className="text-xl font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {biz.name}
            </p>
          )}
          {biz.phone ? (
            <a
              href={dialPhone}
              className="block text-6xl md:text-8xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-lg hover:text-sky-100 transition"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
            >
              {formatPhone(biz.phone)}
            </a>
          ) : (
            <h1
              className="block text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-lg"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
            >
              {headline}
            </h1>
          )}
          <p className="text-xl mt-2 mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>{heroSubtext}</p>
          <Link
            to="/quote"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="inline-block font-bold px-8 py-4 rounded-full transition shadow-lg text-lg"
          >
            {ctaText}
          </Link>
        </div>
      </section>

      {/* Service strips */}
      <div className="bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-700">
          {STRIPS.map((s, i) => (
            <Link
              key={i}
              to={s.href}
              className="flex flex-col items-start py-6 px-8 cursor-pointer hover:bg-gray-800 transition group"
            >
              <span className="text-3xl mb-2" aria-hidden="true">{s.icon}</span>
              <span className="text-white font-bold text-lg transition group-hover:text-[color:var(--color-primary)]">{s.title}</span>
              <span className="text-gray-400 text-sm mt-1">{s.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
