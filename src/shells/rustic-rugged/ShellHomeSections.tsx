import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { usePageContent } from '../../hooks/usePageContent'
import RusticRuggedServiceStrips from './RusticRuggedServiceStrips'
import RusticRuggedAboutTimeline from './RusticRuggedAboutTimeline'
import RusticRuggedServicesGrid from './RusticRuggedServicesGrid'
import RusticRuggedStatsBanner from './RusticRuggedStatsBanner'
import RusticRuggedResComFac from './RusticRuggedResComFac'
import RusticRuggedTestimonials from './RusticRuggedTestimonials'
import RusticRuggedCtaBanner from './RusticRuggedCtaBanner'

interface Biz { name?: string; phone?: string; address?: string; founded_year?: string | number }
interface Testimonial { id: string; author_name: string; review_text: string; rating: number }

export default function ShellHomeSections() {
  const { content } = usePageContent('home')
  const [biz, setBiz] = useState<Biz>({})
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, testRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('testimonials').select('id,author_name,review_text,rating').eq('tenant_id', tenantId).eq('featured', true).limit(1),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (testRes.data?.length) setTestimonial(testRes.data[0])
    })
  }, [])

  const city = biz.address ? biz.address.split(',')[0].trim() : undefined

  return (
    <>
      <RusticRuggedServiceStrips />
      <RusticRuggedAboutTimeline intro={content?.intro ?? undefined} />
      <RusticRuggedServicesGrid />
      <RusticRuggedStatsBanner foundedYear={biz.founded_year} city={city} />
      <RusticRuggedResComFac />
      <RusticRuggedTestimonials testimonial={testimonial} />
      <RusticRuggedCtaBanner phone={biz.phone} />
    </>
  )
}
