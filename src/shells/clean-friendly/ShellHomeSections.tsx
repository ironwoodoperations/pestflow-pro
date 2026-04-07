import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import CleanFriendlyTrustBar from './CleanFriendlyTrustBar'
import CleanFriendlyServicesGrid from './CleanFriendlyServicesGrid'
import CleanFriendlyAboutStrip from './CleanFriendlyAboutStrip'
import CleanFriendlyWhyChooseUs from './CleanFriendlyWhyChooseUs'
import CleanFriendlyTestimonials from './CleanFriendlyTestimonials'
import CleanFriendlyFaqStrip from './CleanFriendlyFaqStrip'
import CleanFriendlyCtaBanner from './CleanFriendlyCtaBanner'

interface BizInfo {
  name?: string
  phone?: string
  founded_year?: string | number
  num_technicians?: number
}

interface State {
  biz: BizInfo
  ctaText: string
  aboutIntro: string
  aboutImage: string
}

export default function ShellHomeSections() {
  const [state, setState] = useState<State>({
    biz: {},
    ctaText: 'Get a Free Quote',
    aboutIntro: '',
    aboutImage: '',
  })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, brandRes, aboutRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('intro,image_url').eq('tenant_id', tenantId).eq('page_slug', 'about').maybeSingle(),
      ])
      setState({
        biz:        bizRes.data?.value   ?? {},
        ctaText:    brandRes.data?.value?.cta_text || 'Get a Free Quote',
        aboutIntro: aboutRes.data?.intro     || '',
        aboutImage: aboutRes.data?.image_url || '',
      })
    })
  }, [])

  const { biz, ctaText, aboutIntro, aboutImage } = state

  return (
    <>
      <CleanFriendlyTrustBar />
      <CleanFriendlyServicesGrid />
      <CleanFriendlyAboutStrip
        businessName={biz.name || ''}
        intro={aboutIntro}
        foundedYear={biz.founded_year ? String(biz.founded_year) : undefined}
        techCount={biz.num_technicians ? String(biz.num_technicians) : undefined}
        imageUrl={aboutImage || undefined}
      />
      <CleanFriendlyWhyChooseUs businessName={biz.name || ''} />
      <CleanFriendlyTestimonials />
      <CleanFriendlyFaqStrip />
      <CleanFriendlyCtaBanner phone={biz.phone || ''} ctaText={ctaText} />
    </>
  )
}
