import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import MetroProHero from './ShellHero'
import MetroProIntroStrip from './MetroProIntroStrip'
import MetroProServicesGrid from './MetroProServicesGrid'
import MetroProWhyChooseUs from './MetroProWhyChooseUs'
import MetroProProcess from './MetroProProcess'
import MetroProFaqTabs from './MetroProFaqTabs'
import MetroProReviews from './MetroProReviews'
import MetroProCtaBanner from './MetroProCtaBanner'
import MetroProBlogCarousel from './MetroProBlogCarousel'

interface BizInfo { name?: string; phone?: string; address?: string }
interface FaqItem { question: string; answer: string }
interface Testimonial { id: string; name: string; review_text: string; rating?: number }
interface BlogPost { id: string; title: string; slug: string; published_at?: string; excerpt?: string }

interface State {
  biz: BizInfo
  city: string
  aboutIntro: string
  faqs: FaqItem[]
  testimonials: Testimonial[]
  blogPosts: BlogPost[]
}

export default function MetroProShellHomeSections() {
  const [state, setState] = useState<State>({
    biz: {},
    city: '',
    aboutIntro: '',
    faqs: [],
    testimonials: [],
    blogPosts: [],
  })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, aboutRes, faqRes, testimonialRes, blogRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('page_content').select('intro').eq('tenant_id', tenantId).eq('page_slug', 'about').maybeSingle(),
        supabase.from('page_content').select('faqs').eq('tenant_id', tenantId).eq('page_slug', 'faq').maybeSingle(),
        supabase.from('testimonials').select('id,name,review_text,rating').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(3),
        supabase.from('blog_posts').select('id,title,slug,published_at,excerpt').eq('tenant_id', tenantId).not('published_at', 'is', null).order('published_at', { ascending: false }).limit(3),
      ])

      const biz = bizRes.data?.value || {}
      const rawAddress: string = biz.address || ''
      const city = rawAddress.split(',')[0]?.trim() || ''

      setState({
        biz,
        city,
        aboutIntro: aboutRes.data?.intro || '',
        faqs: (faqRes.data?.faqs as FaqItem[] | null) || [],
        testimonials: (testimonialRes.data as Testimonial[] | null) || [],
        blogPosts: (blogRes.data as BlogPost[] | null) || [],
      })
    })
  }, [])

  const { biz, city, aboutIntro, faqs, testimonials, blogPosts } = state

  return (
    <>
      <MetroProHero />
      <MetroProIntroStrip
        businessName={biz.name || ''}
        city={city}
        aboutIntro={aboutIntro}
        phone={biz.phone || ''}
      />
      <MetroProServicesGrid />
      <MetroProWhyChooseUs businessName={biz.name || ''} />
      <MetroProProcess />
      <MetroProFaqTabs faqs={faqs.length ? faqs : undefined} />
      <MetroProReviews testimonials={testimonials.length ? testimonials : undefined} />
      <MetroProCtaBanner phone={biz.phone} businessName={biz.name} />
      <MetroProBlogCarousel posts={blogPosts.length ? blogPosts : undefined} />
    </>
  )
}
