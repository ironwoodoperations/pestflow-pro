import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import ModernProTrustBar from './ModernProTrustBar'
import ModernProServicesGrid from './ModernProServicesGrid'
import ModernProAboutStrip from './ModernProAboutStrip'
import ModernProWhyChooseUs from './ModernProWhyChooseUs'
import ModernProTestimonials from './ModernProTestimonials'
import ModernProCtaBanner from './ModernProCtaBanner'

const DEFAULT_SERVICES = [
  { name: 'Pest Control',          slug: 'pest-control'        },
  { name: 'Termite Control',       slug: 'termite-control'     },
  { name: 'Termite Inspections',   slug: 'termite-inspections' },
  { name: 'Mosquito Control',      slug: 'mosquito-control'    },
  { name: 'Roach Control',         slug: 'roach-control'       },
  { name: 'Ant Control',           slug: 'ant-control'         },
  { name: 'Spider Control',        slug: 'spider-control'      },
  { name: 'Scorpion Control',      slug: 'scorpion-control'    },
  { name: 'Rodent Control',        slug: 'rodent-control'      },
  { name: 'Flea & Tick Control',   slug: 'flea-tick-control'   },
  { name: 'Bed Bug Control',       slug: 'bed-bug-control'     },
  { name: 'Wasp & Hornet Control', slug: 'wasp-hornet-control' },
]

interface BizInfo {
  name?: string
  phone?: string
  founded_year?: string | number
  num_technicians?: number
  license?: string
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
        biz: bizRes.data?.value ?? {},
        ctaText: brandRes.data?.value?.cta_text || 'Get a Free Quote',
        aboutIntro: aboutRes.data?.intro || '',
        aboutImage: aboutRes.data?.image_url || '',
      })
    })
  }, [])

  const { biz, ctaText, aboutIntro, aboutImage } = state

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
