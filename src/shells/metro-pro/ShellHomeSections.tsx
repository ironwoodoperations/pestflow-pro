import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { usePageContent } from '../../hooks/usePageContent'
import MetroProHero from './ShellHero'
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

export default function MetroProShellHomeSections() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [biz, setBiz] = useState<BizInfo>({})
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])

  const { content: faqContent } = usePageContent(tenantId, 'faq')
  const faqs = (faqContent?.faqs as FaqItem[] | null) || []

  useEffect(() => {
    resolveTenantId().then(async (id) => {
      if (!id) return
      setTenantId(id)
      const [bizRes, testimonialRes, blogRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'business_info').maybeSingle(),
        supabase.from('testimonials').select('id,name,review_text,rating').eq('tenant_id', id).order('created_at', { ascending: false }).limit(3),
        supabase.from('blog_posts').select('id,title,slug,published_at,excerpt').eq('tenant_id', id).not('published_at', 'is', null).order('published_at', { ascending: false }).limit(3),
      ])
      setBiz(bizRes.data?.value || {})
      setTestimonials((testimonialRes.data as Testimonial[] | null) || [])
      setBlogPosts((blogRes.data as BlogPost[] | null) || [])
    })
  }, [])

  return (
    <>
      <MetroProHero />
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
