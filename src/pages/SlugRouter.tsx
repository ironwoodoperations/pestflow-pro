import { useParams, Link } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import ServiceAreaPage from './LocationPage'
import CustomPage from './CustomPage'
import NotFound from './NotFound'
import SuspendedSite from '../components/SuspendedSite'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

function ServiceAreaNotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <section
        className="flex-1 flex items-center justify-center py-24 px-4"
        style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}
      >
        <div className="text-center max-w-lg">
          <div className="text-[10rem] font-black opacity-20 select-none leading-none" style={{ color: 'var(--color-primary)' }}>
            404
          </div>
          <div className="text-6xl -mt-8 mb-6">📍</div>
          <h1 className="text-3xl md:text-4xl font-bold -mt-2 mb-3" style={{ color: 'var(--color-nav-text)' }}>
            Service area not found
          </h1>
          <p className="mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.65 }}>
            We don't have a page for that city yet.{' '}
            <Link to="/service-area" style={{ color: 'var(--color-primary)' }} className="underline hover:opacity-80 transition">
              View all service areas
            </Link>{' '}
            to see where we operate.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/service-area" className="font-medium rounded-lg px-6 py-3 transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              View Service Areas
            </Link>
            <Link to="/quote" className="border font-medium rounded-lg px-6 py-3 transition hover:opacity-80" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              Get a Free Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const MarketingLanding = lazy(() => import('./MarketingLanding'))

const DARK_FALLBACK = <div style={{ background: '#0a0f1e', minHeight: '100vh' }} />

function checkRootDomain(): boolean {
  const h = window.location.hostname
  return (h === 'pestflowpro.com' || h === 'www.pestflowpro.com') &&
    !window.location.pathname.startsWith('/ironwood')
}

function isPlatformDomain(hostname: string): boolean {
  return hostname === 'pestflowpro.com'
    || hostname === 'www.pestflowpro.com'
    || hostname.endsWith('.pestflowpro.com')
    || hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.vercel.app')
}

export default function SlugRouter() {
  const { slug } = useParams<{ slug: string }>()
  const [type, setType] = useState<'service_area' | 'custom-page' | 'not-found' | 'loading' | 'suspended'>(() => slug ? 'loading' : 'not-found')
  const rootDomain = checkRootDomain()

  const hostname = window.location.hostname
  const onCustomDomain = !isPlatformDomain(hostname)

  useEffect(() => {
    if (rootDomain || !slug) return

    let tenantIdPromise: Promise<string>

    if (onCustomDomain) {
      // Look up tenant via tenant_domains table (verified domains only)
      tenantIdPromise = Promise.resolve(
        supabase
          .from('tenant_domains')
          .select('tenant_id')
          .eq('custom_domain', hostname)
          .eq('verified', true)
          .maybeSingle()
          .then(r => r.data?.tenant_id ?? '')
      )
    } else {
      tenantIdPromise = resolveTenantId()
    }

    tenantIdPromise.then(async (tenantId) => {
      if (!tenantId) { setType('not-found'); return }

      // Check if tenant is archived (suspended)
      const { data: tenant } = await supabase
        .from('tenants')
        .select('archived_at')
        .eq('id', tenantId)
        .maybeSingle()
      if (tenant?.archived_at) { setType('suspended'); return }

      const { data: locData } = await supabase
        .from('service_areas')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .eq('is_live', true)
        .maybeSingle()
      if (locData) { setType('service_area'); return }

      // Check for custom page in page_content
      const { data: pageData } = await supabase
        .from('page_content')
        .select('page_slug')
        .eq('tenant_id', tenantId)
        .eq('page_slug', slug)
        .maybeSingle()
      setType(pageData ? 'custom-page' : 'not-found')
    })
  }, [slug, rootDomain, onCustomDomain, hostname])

  // Root domain with unknown slug → show MarketingLanding
  if (rootDomain) {
    return (
      <Suspense fallback={DARK_FALLBACK}>
        <MarketingLanding />
      </Suspense>
    )
  }

  if (type === 'loading') return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(255,255,255,0.1)',
        borderTop: '3px solid #22c55e',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (type === 'suspended') return <SuspendedSite />
  if (type === 'service_area') return <ServiceAreaPage slug={slug!} />
  if (type === 'custom-page') return <CustomPage slug={slug!} />
  return <ServiceAreaNotFound />
}
