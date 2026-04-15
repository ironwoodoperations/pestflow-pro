import { useEffect } from 'react'
import MarketingNav from './MarketingNav'
import MarketingFooter from './MarketingFooter'
import MarketingHero from './sections/MarketingHero'
import MarketingFeatures from './sections/MarketingFeatures'
import MarketingWebsiteShowcase from './sections/MarketingWebsiteShowcase'
import MarketingSEO from './sections/MarketingSEO'
import MarketingSocial from './sections/MarketingSocial'
import MarketingCRM from './sections/MarketingCRM'
import MarketingPricing from './sections/MarketingPricing'
import MarketingCTA from './sections/MarketingCTA'

export default function MarketingHome() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:wght@700;800&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', color: '#1e293b' }}>
      <MarketingNav />
      <MarketingHero />
      <MarketingFeatures />
      <MarketingWebsiteShowcase />
      <MarketingSEO />
      <MarketingSocial />
      <MarketingCRM />
      <MarketingPricing />
      <MarketingCTA />
      <MarketingFooter />
    </div>
  )
}
