import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { usePageContent } from '../../hooks/usePageContent'
import CleanFriendlyTrustBar from './CleanFriendlyTrustBar'
import CleanFriendlyServicesGrid from './CleanFriendlyServicesGrid'
import CleanFriendlyAboutStrip from './CleanFriendlyAboutStrip'
import CleanFriendlyWhyChooseUs from './CleanFriendlyWhyChooseUs'
import CleanFriendlyTestimonials from './CleanFriendlyTestimonials'
import CleanFriendlyFaqStrip from './CleanFriendlyFaqStrip'
import CleanFriendlyCtaBanner from './CleanFriendlyCtaBanner'

interface BizInfo { name?: string; phone?: string; founded_year?: string | number; num_technicians?: number }

export default function ShellHomeSections() {
  const { id: tenantId } = useTenant()
  const [biz, setBiz] = useState<BizInfo>({})
  const [ctaText, setCtaText] = useState('Get a Free Quote')

  const { content: aboutContent } = usePageContent(tenantId, 'about')

  useEffect(() => {
    ;(async () => {
      const [bizRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      setBiz(bizRes.data?.value ?? {})
      setCtaText(brandRes.data?.value?.cta_text || 'Get a Free Quote')
    })()
  }, [tenantId])

  return (
    <>
      <CleanFriendlyTrustBar />
      <CleanFriendlyServicesGrid />
      <CleanFriendlyAboutStrip
        businessName={biz.name || ''}
        intro={aboutContent?.intro || ''}
        foundedYear={biz.founded_year ? String(biz.founded_year) : undefined}
        techCount={biz.num_technicians ? String(biz.num_technicians) : undefined}
        imageUrl={aboutContent?.image_url || undefined}
      />
      <CleanFriendlyWhyChooseUs businessName={biz.name || ''} />
      <CleanFriendlyTestimonials />
      <CleanFriendlyFaqStrip />
      <CleanFriendlyCtaBanner phone={biz.phone || ''} ctaText={ctaText} />
    </>
  )
}
