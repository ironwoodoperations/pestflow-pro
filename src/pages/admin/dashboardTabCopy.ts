import { PLATFORM_NAME } from '../../../shared/lib/platformBrand'

// S297 — the admin dashboard's per-tab subtitles, extracted from Dashboard.tsx.
//
// WHY THEY MOVED. `dashboard` read 'Overview of your pest control business' and
// renders on the FIRST LINE under the page title of the DEFAULT tab — so it was
// the first sentence every tenant read on every login, irrigation tenants
// included. The other thirteen entries were already trade-neutral, which makes
// the pest one the outlier rather than the design.
//
// It is deliberately NOT vertical-keyed. 'Overview of your business' is true of
// every tenant, names no trade, and needs no preset lookup — so this file has no
// dependency on the vertical at all, and the tab header cannot go blank while
// useAdminPreset's effect is still in flight.
//
// A SEPARATE MODULE rather than an export on Dashboard.tsx: react-refresh warns
// when a component module also exports constants, and importing Dashboard into a
// test would drag in its whole lazy-loaded tab graph and the router. The S297
// guard asserts every value here — all fourteen, not just the one that leaked —
// so a pest subtitle added to ANY tab goes red.
export const TAB_SUBTITLES: Record<string, string> = {
  dashboard: 'Overview of your business',
  content: 'Manage page content across your website',
  seo: 'Optimize your search engine rankings',
  blog: 'Create and manage blog posts',
  media: 'Upload and organize photos for posts',
  social: 'Schedule and manage social media',
  testimonials: 'Manage customer reviews and testimonials',
  locations: 'Manage service area locations',
  analytics: 'Business analytics and reports',
  crm: 'Track leads and customer relationships',
  team: 'Manage your team members shown on your website',
  billing: 'Your current plan and payment history',
  support: `Submit support requests to the ${PLATFORM_NAME} team`,
  settings: 'Configure your business settings',
}
