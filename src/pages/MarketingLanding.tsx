import { useEffect } from 'react'
import MarketingNav from './marketing/MarketingNav'
import MarketingHero from './marketing/MarketingHero'
import MarketingFeatures from './marketing/MarketingFeatures'
import MarketingPricing from './marketing/MarketingPricing'
import MarketingCTA from './marketing/MarketingCTA'

export default function MarketingLanding() {
  useEffect(() => {
    // Load custom fonts
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:wght@700;800&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  return (
    <div style={{ background: '#0a0f1e', minHeight: '100vh', color: '#f1f5f9' }}>
      <MarketingNav />
      <MarketingHero />
      <MarketingFeatures />
      <MarketingPricing />
      <MarketingCTA />
    </div>
  )
}
