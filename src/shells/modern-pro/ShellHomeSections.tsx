import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { usePageContent } from '../../hooks/usePageContent'
import ModernProTrustBar from './ModernProTrustBar'
import ModernProServicesGrid from './ModernProServicesGrid'
import ModernProAboutStrip from './ModernProAboutStrip'
import ModernProWhyChooseUs from './ModernProWhyChooseUs'
import ModernProTestimonials from './ModernProTestimonials'
import ModernProCtaBanner from './ModernProCtaBanner'

const DEFAULT_SERVICES = [
  { name: 'Pest Control', slug: 'pest-control' }, { name: 'Termite Control', slug: 'termite-control' },
  { name: 'Termite Inspections', slug: 'termite-inspections' }, { name: 'Mosquito Control', slug: 'mosquito-control' },
  { name: 'Roach Control', slug: 'roach-control' }, { name: 'Ant Control', slug: 'ant-control' },
  { name: 'Spider Control', slug: 'spider-control' }, { name: 'Scorpion Control', slug: 'scorpion-control' },
  { name: 'Rodent Control', slug: 'rodent-control' }, { name: 'Flea & Tick Control', slug: 'flea-tick-control' },
  { name: 'Bed Bug Control', slug: 'bed-bug-control' }, { name: 'Wasp & Hornet Control', slug: 'wasp-hornet-control' },
]

interface BizInfo { name?: string; phone?: string; founded_year?: string | number; num_technicians?: number; license?: string }

export default function ShellHomeSections() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [biz, setBiz] = useState<BizInfo>({})
  const [ctaText, setCtaText] = useState('Get a Free Quote')

  const { content: aboutContent } = usePageContent(tenantId, 'about')

  useEffect(() => {
    resolveTenantId().then(async (id) => {
      if (!id) return
      setTenantId(id)
      const [bizRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', id).eq('key', 'branding').maybeSingle(),
      ])
      setBiz(bizRes.data?.value ?? {})
      setCtaText(brandRes.data?.value?.cta_text || 'Get a Free Quote')
    })
  }, [])

  const aboutIntro = aboutContent?.intro || ''
  const aboutImage = aboutContent?.image_url || ''

  return (
    <>
      <ModernProTrustBar />
      <ModernProServicesGrid services={DEFAULT_SERVICES} />
      <ModernProAboutStrip
        businessName={biz.name || ''}
        intro={aboutIntro}
        foundedYear={biz.founded_year ? String(biz.founded_year) : undefined}
        techCount={biz.num_technicians ? String(biz.num_technicians) : undefined}
        licenseNumber={biz.license || undefined}
        imageUrl={aboutImage || undefined}
      />
      <ModernProWhyChooseUs businessName={biz.name || ''} />
      <ModernProTestimonials />
      <ModernProCtaBanner phone={biz.phone || ''} ctaText={ctaText} />
    </>
  )
}
