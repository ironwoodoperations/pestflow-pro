import { useEffect, useState } from 'react'
import { Accordion } from '../../ui/accordion'
import AnalyticsSection, { type AnalyticsSectionId } from './AnalyticsSection'
import SEOSection from './sections/SEOSection'
import SocialSection from './sections/SocialSection'
import PerformanceSection from './sections/PerformanceSection'
import BlogSection from './sections/BlogSection'

const STORAGE_KEY = 'analytics-hub-expanded-sections'
const DEFAULT_EXPANDED: AnalyticsSectionId[] = ['seo']

function readStoredExpanded(): AnalyticsSectionId[] {
  if (typeof window === 'undefined') return DEFAULT_EXPANDED
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_EXPANDED
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_EXPANDED
    const valid: AnalyticsSectionId[] = ['seo', 'social', 'performance', 'blog']
    return parsed.filter((id): id is AnalyticsSectionId => valid.includes(id as AnalyticsSectionId))
  } catch {
    return DEFAULT_EXPANDED
  }
}

export default function AnalyticsHub() {
  const [expanded, setExpanded] = useState<AnalyticsSectionId[]>(DEFAULT_EXPANDED)

  useEffect(() => {
    setExpanded(readStoredExpanded())
  }, [])

  const handleChange = (value: string[]) => {
    const next = value as AnalyticsSectionId[]
    setExpanded(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage unavailable (private mode, quota) — silent fallback
    }
  }

  return (
    <Accordion
      type="multiple"
      value={expanded}
      onValueChange={handleChange}
      className="space-y-3"
    >
      <AnalyticsSection
        id="seo"
        title="SEO Analytics"
        summaryStat="—"
        defaultExpanded
      >
        <SEOSection />
      </AnalyticsSection>

      <AnalyticsSection
        id="social"
        title="Social Analytics"
        summaryStat="—"
      >
        <SocialSection />
      </AnalyticsSection>

      <AnalyticsSection
        id="performance"
        title="Performance & Reports"
        summaryStat="—"
      >
        <PerformanceSection />
      </AnalyticsSection>

      <AnalyticsSection
        id="blog"
        title="Blog Analytics"
        summaryStat="—"
      >
        <BlogSection />
      </AnalyticsSection>
    </Accordion>
  )
}
