import type { ReactNode } from 'react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTemplate } from '../context/TemplateContext'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import HolidayBanner from './HolidayBanner'
import SEOHead, { type BusinessInfo, type SeoSettings, type SchemaConfig, type SocialLinks, type PageType } from './seo/SEOHead'
import ModernProNavbar from '../shells/modern-pro/ShellNavbar'
import ModernProFooter from '../shells/modern-pro/ShellFooter'
import ModernProSections from '../shells/modern-pro/ShellHomeSections'

// Non-default shells — lazy to reduce main bundle
const BoldLocalNavbar      = lazy(() => import('../shells/bold-local/ShellNavbar'))
const BoldLocalFooter      = lazy(() => import('../shells/bold-local/ShellFooter'))
const BoldLocalSections    = lazy(() => import('../shells/bold-local/ShellHomeSections'))
// Maps route pathnames to SEO page type + title
function resolvePageMeta(pathname: string): { pageType: PageType; title: string } {
  if (pathname === '/') return { pageType: 'home', title: 'Home' }
  if (pathname === '/about') return { pageType: 'about', title: 'About Us' }
  if (pathname === '/faq') return { pageType: 'faq', title: 'FAQ' }
  if (pathname === '/contact') return { pageType: 'contact', title: 'Contact Us' }
  if (pathname === '/quote') return { pageType: 'contact', title: 'Get a Free Quote' }
  if (pathname.startsWith('/blog/')) return { pageType: 'blog', title: 'Blog' }
  if (pathname === '/blog') return { pageType: 'blog', title: 'Blog' }
  if (pathname.includes('pest-control')) return { pageType: 'service', title: 'Pest Control' }
  if (pathname.includes('termite')) return { pageType: 'service', title: 'Termite Control' }
  if (pathname.includes('mosquito')) return { pageType: 'service', title: 'Mosquito Control' }
  if (pathname.includes('rodent')) return { pageType: 'service', title: 'Rodent Control' }
  if (pathname.includes('ant-control')) return { pageType: 'service', title: 'Ant Control' }
  if (pathname.includes('spider')) return { pageType: 'service', title: 'Spider Control' }
  if (pathname.includes('roach')) return { pageType: 'service', title: 'Roach Control' }
  if (pathname.includes('bed-bug')) return { pageType: 'service', title: 'Bed Bug Control' }
  if (pathname.includes('flea') || pathname.includes('tick')) return { pageType: 'service', title: 'Flea & Tick Control' }
  if (pathname.includes('wasp') || pathname.includes('hornet')) return { pageType: 'service', title: 'Wasp & Hornet Control' }
  if (pathname.includes('scorpion')) return { pageType: 'service', title: 'Scorpion Control' }
  return { pageType: 'custom', title: 'Pest Control Services' }
}

const EMPTY_SEO: SeoSettings = { meta_description: '', service_areas: [], certifications: [], founded_year: '', owner_name: '' }
const EMPTY_SCHEMA: SchemaConfig = { aggregate_rating: { value: 5.0, count: 47 }, service_radius_miles: 30 }
const EMPTY_SOCIAL: SocialLinks = {}
const EMPTY_BIZ: BusinessInfo = { name: '', phone: '', email: '', address: '' }

function SEOManager() {
  const location = useLocation()
  const { businessName } = useTemplate()
  const { id: tenantId, slug: tenantSlug } = useTenant()
  const [bizInfo, setBizInfo] = useState<BusinessInfo>(EMPTY_BIZ)
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(EMPTY_SEO)
  const [schemaConfig, setSchemaConfig] = useState<SchemaConfig>(EMPTY_SCHEMA)
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(EMPTY_SOCIAL)
  const [tagline, setTagline] = useState('')
  const [googleSearchConsoleVerification, setGoogleSearchConsoleVerification] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [bizRes, seoRes, schemaRes, socialRes, brandRes, gscRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'seo').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'schema_config').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'social_links').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('settings').select('google_search_console_verification').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
      ])
      if (bizRes.data?.value) setBizInfo(bizRes.data.value as BusinessInfo)
      if (seoRes.data?.value) {
        const raw = seoRes.data.value as Partial<SeoSettings>
        setSeoSettings({
          ...EMPTY_SEO,
          ...raw,
          service_areas: Array.isArray(raw.service_areas) ? raw.service_areas : [],
          certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
        })
      }
      if (schemaRes.data?.value) setSchemaConfig(schemaRes.data.value as SchemaConfig)
      if (socialRes.data?.value) setSocialLinks(socialRes.data.value as SocialLinks)
      if (brandRes.data?.value?.tagline) setTagline(brandRes.data.value.tagline)
      if (gscRes.data?.google_search_console_verification) setGoogleSearchConsoleVerification(gscRes.data.google_search_console_verification)
      setLoaded(true)
    })()
  }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || !bizInfo.name) return null

  const { pageType, title } = resolvePageMeta(location.pathname)
  const origin = window.location.origin
  const canonicalUrl = `${origin}${location.pathname}`

  return (
    <SEOHead
      title={title}
      canonicalUrl={canonicalUrl}
      pageType={pageType}
      breadcrumbs={[
        { name: bizInfo.name || businessName, url: '/' },
        ...(location.pathname !== '/' ? [{ name: title, url: location.pathname }] : []),
      ]}
      businessInfo={bizInfo}
      seoSettings={seoSettings}
      schemaConfig={schemaConfig}
      socialLinks={socialLinks}
      tenantSlug={tenantSlug}
      tagline={tagline}
      googleSearchConsoleVerification={googleSearchConsoleVerification || undefined}
    />
  )
}

// Injects canonical <link> tag and redirects subdomain → custom domain when verified.
function CanonicalManager() {
  const location = useLocation()
  const { id: tenantId } = useTenant()

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

      if (cancelled) return

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
  }, [tenantId, location.pathname, location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function ShellSectionsRenderer() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalSections /></Suspense>
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
    default:              return <ModernProNavbar />
  }
}

function ShellFooterComp() {
  const { template } = useTemplate()
  switch (template) {
    case 'bold-local':    return <Suspense fallback={null}><BoldLocalFooter /></Suspense>
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
      <SEOManager />
      <CanonicalManager />
      <HolidayBanner />
      <ShellNav />
      <main id="main-content">{children}</main>
      <ShellFooterComp />
    </>
  )
}
