import { useParams } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import LocationPage from './LocationPage'
import NotFound from './NotFound'
import SuspendedSite from '../components/SuspendedSite'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

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
  const [type, setType] = useState<'location' | 'not-found' | 'loading' | 'suspended'>(() => slug ? 'loading' : 'not-found')
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

      const { data } = await supabase
        .from('location_data')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .eq('is_live', true)
        .maybeSingle()
      setType(data ? 'location' : 'not-found')
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
  if (type === 'location') return <LocationPage slug={slug!} />
  return <NotFound />
}
