import { useState, useEffect } from 'react'
import { usePageContent } from '../../hooks/usePageContent'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { formatPhone } from '../../lib/formatPhone'

const FALLBACK_PHOTO = 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'

interface BizState { name?: string; phone?: string; tagline?: string }
interface HeroMedia { thumbnail_url?: string; youtube_id?: string }

export default function ShellHero() {
  const { content } = usePageContent('home')
  const [biz, setBiz] = useState<BizState>({})
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({})

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
    })
  }, [])

  const bgPhoto = heroMedia.thumbnail_url
    || (heroMedia.youtube_id ? `https://img.youtube.com/vi/${heroMedia.youtube_id}/maxresdefault.jpg` : null)
    || FALLBACK_PHOTO

  const title = content?.title || biz.name || 'Expert Pest Control You Can Count On'
  const subtitle = content?.subtitle || biz.tagline || 'Professional and personalized service for your home and business'

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img src={bgPhoto} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <div className="relative z-10 flex items-center justify-center px-4 w-full py-16">
        <div className="text-center w-full" style={{ background: 'rgba(0,0,0,0.72)', borderRadius: '16px', padding: '48px 40px', maxWidth: '640px' }}>
          <h1 className="font-bold text-white" style={{ fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.2, marginBottom: '16px' }}>
            {title}
          </h1>
          <p style={{ color: 'white', opacity: 0.9, marginBottom: '32px', fontSize: '18px', lineHeight: 1.6 }}>
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/quote" className="font-bold rounded-full px-8 py-3 transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>
              Get a Quote
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
