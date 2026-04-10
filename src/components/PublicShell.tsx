import type { ReactNode } from 'react'
import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTemplate } from '../context/TemplateContext'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import HolidayBanner from './HolidayBanner'
import ModernProNavbar from '../shells/modern-pro/ShellNavbar'
import ModernProFooter from '../shells/modern-pro/ShellFooter'
import ModernProSections from '../shells/modern-pro/ShellHomeSections'

// Non-default shells — lazy to reduce main bundle
const BoldLocalNavbar      = lazy(() => import('../shells/bold-local/ShellNavbar'))
const BoldLocalFooter      = lazy(() => import('../shells/bold-local/ShellFooter'))
const BoldLocalSections    = lazy(() => import('../shells/bold-local/ShellHomeSections'))
const CleanFriendlyNavbar  = lazy(() => import('../shells/clean-friendly/ShellNavbar'))
const CleanFriendlyFooter  = lazy(() => import('../shells/clean-friendly/ShellFooter'))
const CleanFriendlySections = lazy(() => import('../shells/clean-friendly/ShellHomeSections'))
const RusticRuggedNavbar   = lazy(() => import('../shells/rustic-rugged/ShellNavbar'))
const RusticRuggedFooter   = lazy(() => import('../shells/rustic-rugged/ShellFooter'))
const RusticRuggedSections = lazy(() => import('../shells/rustic-rugged/ShellHomeSections'))
const YouPestNavbar        = lazy(() => import('../shells/youpest/ShellNavbar'))
const YouPestFooter        = lazy(() => import('../shells/youpest/ShellFooter'))
const YouPestSections      = lazy(() => import('../shells/youpest/ShellHomeSections'))
const DangNavbar           = lazy(() => import('../shells/dang/ShellNavbar'))
const DangFooter           = lazy(() => import('../shells/dang/ShellFooter'))
const DangSections         = lazy(() => import('../shells/dang/ShellHomeSections'))

// Injects canonical <link> tag and redirects subdomain → custom domain when verified.
function CanonicalManager() {
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    async function run() {
      const hostname = window.location.hostname
      const isLocal = hostname === 'localhost'
        || hostname.endsWith('.localhost')
        || hostname.endsWith('.vercel.app')

      // Extract subdomain slug (e.g. "dang" from dang.pestflowpro.com)
      let subdomainSlug: string | null = null
      if (hostname.endsWith('.pestflowpro.com')) {
        const parts = hostname.split('.')
        if (parts.length === 3) subdomainSlug = parts[0]
      }

      const tenantId = await resolveTenantId()
      if (cancelled || !tenantId) return

      // Query verified custom domain for this tenant
      let customDomain: string | null = null
      try {
        const { data } = await supabase
          .from('tenant_domains')
          .select('custom_domain')
          .eq('tenant_id', tenantId)
          .eq('verified', true)
          .maybeSingle()
        customDomain = data?.custom_domain ?? null
      } catch { /* non-fatal */ }

      if (cancelled) return

      const path = location.pathname + location.search

      // Determine canonical URL
      let canonicalUrl: string | null = null
      if (customDomain) {
        canonicalUrl = `https://${customDomain}${path}`
      } else if (subdomainSlug) {
        canonicalUrl = `https://${subdomainSlug}.pestflowpro.com${path}`
      }

      if (canonicalUrl) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
        if (!link) {
          link = document.createElement('link')
          link.rel = 'canonical'
          document.head.appendChild(link)
        }
        link.href = canonicalUrl
      }

      // Redirect: subdomain → verified custom domain (skip on local/dev)
      if (customDomain && subdomainSlug && !isLocal) {
        window.location.replace(`https://${customDomain}${path}`)
      }
    }

    run()
    return () => { cancelled = true }
  }, [location.pathname, location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function ShellSectionsRenderer() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalSections /></Suspense>
    case 'clean-friendly': return <Suspense fallback={null}><CleanFriendlySections /></Suspense>
    case 'rustic-rugged': return <Suspense fallback={null}><RusticRuggedSections /></Suspense>
    case 'youpest':       return <Suspense fallback={null}><YouPestSections /></Suspense>
    case 'dang':          return <Suspense fallback={null}><DangSections /></Suspense>
    default:              return <ModernProSections />
  }
}

interface Props {
  children: ReactNode
}

function ShellNav() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalNavbar /></Suspense>
    case 'clean-friendly': return <Suspense fallback={null}><CleanFriendlyNavbar /></Suspense>
    case 'rustic-rugged': return <Suspense fallback={null}><RusticRuggedNavbar /></Suspense>
    case 'youpest':       return <Suspense fallback={null}><YouPestNavbar /></Suspense>
    case 'dang':          return <Suspense fallback={null}><DangNavbar /></Suspense>
    default:              return <ModernProNavbar />
  }
}

function ShellFooterComp() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalFooter /></Suspense>
    case 'clean-friendly': return <Suspense fallback={null}><CleanFriendlyFooter /></Suspense>
    case 'rustic-rugged': return <Suspense fallback={null}><RusticRuggedFooter /></Suspense>
    case 'youpest':       return <Suspense fallback={null}><YouPestFooter /></Suspense>
    case 'dang':          return <Suspense fallback={null}><DangFooter /></Suspense>
    default:              return <ModernProFooter />
  }
}

export default function PublicShell({ children }: Props) {
  const { loading } = useTemplate()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-hero)' }}
      >
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <CanonicalManager />
      <HolidayBanner />
      <ShellNav />
      <main id="main-content">{children}</main>
      <ShellFooterComp />
    </>
  )
}
