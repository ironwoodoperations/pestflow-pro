import { useEffect } from 'react'
import {
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateWebsiteSchema,
  generateRatingSchema,
  generateAboutSchema,
  type BusinessInfo,
  type SeoSettings,
  type SchemaConfig,
  type SocialLinks,
} from '../../lib/seoSchema'

export type { BusinessInfo, SeoSettings, SchemaConfig, SocialLinks }

export type PageType = 'home' | 'service' | 'about' | 'faq' | 'contact' | 'blog' | 'location' | 'custom'

interface SEOHeadProps {
  title: string
  description?: string
  canonicalUrl: string
  pageType: PageType
  serviceName?: string
  serviceDescription?: string
  faqs?: Array<{ question: string; answer: string }>
  breadcrumbs?: Array<{ name: string; url: string }>
  businessInfo: BusinessInfo
  seoSettings: SeoSettings
  schemaConfig: SchemaConfig
  socialLinks: SocialLinks
  tenantSlug: string
  tagline?: string
  googleSearchConsoleVerification?: string
}

function injectScript(id: string, content: object) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(content)
}

function removeScript(id: string) {
  document.getElementById(id)?.remove()
}

function setMeta(name: string, content: string, isProp = false) {
  const attr = isProp ? 'property' : 'name'
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

export default function SEOHead({
  title,
  description,
  canonicalUrl,
  pageType,
  serviceName,
  serviceDescription,
  faqs,
  breadcrumbs,
  businessInfo,
  seoSettings,
  schemaConfig,
  socialLinks,
  tenantSlug,
  tagline,
  googleSearchConsoleVerification,
}: SEOHeadProps) {
  const baseUrl = `https://${tenantSlug}.pestflowpro.com`
  const resolvedUrl = canonicalUrl || baseUrl

  // Build page title
  const fullTitle = pageType === 'home'
    ? `${businessInfo.name}${tagline ? ` — ${tagline}` : ''} | Pest Control in ${businessInfo.city || ''}, ${businessInfo.state || ''}`
    : `${title} | ${businessInfo.name}`

  const resolvedDescription = description || seoSettings.meta_description || `Professional pest control services by ${businessInfo.name}.`

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Meta description
    setMeta('description', resolvedDescription)

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', resolvedDescription, true)
    setMeta('og:url', resolvedUrl, true)
    setMeta('og:type', pageType === 'blog' ? 'article' : 'website', true)
    setMeta('og:site_name', businessInfo.name, true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', resolvedDescription)

    // Google Search Console verification
    if (googleSearchConsoleVerification) {
      setMeta('google-site-verification', googleSearchConsoleVerification)
    }

    // Canonical
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = resolvedUrl
  }, [fullTitle, resolvedDescription, resolvedUrl, pageType, businessInfo.name, googleSearchConsoleVerification])

  // JSON-LD schemas
  useEffect(() => {
    // LocalBusiness — on every page
    injectScript('ld-local-business', generateLocalBusinessSchema(
      businessInfo, seoSettings, schemaConfig, socialLinks, baseUrl
    ))

    // Breadcrumbs — on every page
    if (breadcrumbs?.length) {
      injectScript('ld-breadcrumbs', generateBreadcrumbSchema(baseUrl, breadcrumbs))
    }

    // Page-type-specific schemas
    if (pageType === 'home') {
      injectScript('ld-website', generateWebsiteSchema(businessInfo.name, baseUrl))
      injectScript('ld-rating', generateRatingSchema(
        businessInfo.name,
        schemaConfig.aggregate_rating.value,
        schemaConfig.aggregate_rating.count
      ))
    }

    if (pageType === 'service' && serviceName && serviceDescription) {
      injectScript('ld-service', generateServiceSchema(
        businessInfo, serviceName, serviceDescription, resolvedUrl
      ))
    }

    if (pageType === 'faq' && faqs?.length) {
      injectScript('ld-faq', generateFAQSchema(faqs))
    }

    if (pageType === 'about') {
      injectScript('ld-about', generateAboutSchema(businessInfo, seoSettings, baseUrl))
      injectScript('ld-rating', generateRatingSchema(
        businessInfo.name,
        schemaConfig.aggregate_rating.value,
        schemaConfig.aggregate_rating.count
      ))
    }

    return () => {
      // Only remove page-type-specific schemas on unmount, not the global ones
      if (pageType === 'home') {
        removeScript('ld-website')
        removeScript('ld-rating')
      }
      if (pageType === 'service') removeScript('ld-service')
      if (pageType === 'faq') removeScript('ld-faq')
      if (pageType === 'about') {
        removeScript('ld-about')
        removeScript('ld-rating')
      }
    }
  }, [
    pageType, businessInfo, seoSettings, schemaConfig, socialLinks,
    baseUrl, resolvedUrl, serviceName, serviceDescription, faqs, breadcrumbs,
  ])

  return null
}
