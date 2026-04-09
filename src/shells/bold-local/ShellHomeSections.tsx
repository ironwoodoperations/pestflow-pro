import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { usePageContent } from '../../hooks/usePageContent'
import BoldLocalTrustBar from './BoldLocalTrustBar'
import BoldLocalWhyUs from './BoldLocalWhyUs'
import BoldLocalServicesGrid from './BoldLocalServicesGrid'
import BoldLocalHowItWorks from './BoldLocalHowItWorks'
import BoldLocalAboutStrip from './BoldLocalAboutStrip'
import BoldLocalTrustCards from './BoldLocalTrustCards'
import BoldLocalTestimonials from './BoldLocalTestimonials'
import BoldLocalCtaBanner from './BoldLocalCtaBanner'

interface Biz { name?: string; phone?: string; tagline?: string; founded_year?: string | number; certifications?: string }
interface HeroMedia { thumbnail_url?: string }
interface Testimonial { id: string; author_name: string; review_text: string; rating: number }

export default function ShellHomeSections() {
  const { content } = usePageContent('home')
  const [biz, setBiz] = useState<Biz>({})
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({})
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes, testRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
        supabase.from('testimonials').select('id,author_name,review_text,rating')
          .eq('tenant_id', tenantId).eq('featured', true).limit(3),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      if (testRes.data?.length) setTestimonials(testRes.data)
    })
  }, [])

  const name = biz.name || 'Your Pest Pro'
  const photoUrl = heroMedia.thumbnail_url

  return (
    <>
      <BoldLocalTrustBar certifications={biz.certifications} tagline={biz.tagline} />
      <BoldLocalWhyUs businessName={name} intro={content?.intro ?? undefined} />
      <BoldLocalServicesGrid />
      <BoldLocalHowItWorks />
      <BoldLocalAboutStrip businessName={name} intro={content?.intro ?? undefined} photoUrl={photoUrl} />
      <BoldLocalTrustCards foundedYear={biz.founded_year} tagline={biz.tagline} certifications={biz.certifications} />
      <BoldLocalTestimonials testimonials={testimonials} />
      <BoldLocalCtaBanner phone={biz.phone} />
    </>
  )
}
