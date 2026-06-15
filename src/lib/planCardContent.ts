// Locked plan/pricing card content for the concierge plan menu.
//
// Single source of truth shared by the Dashboard plan section and the Billing
// tab so the two surfaces stay byte-identical (same prices, taglines, feature
// lists, button behavior, and Remi add-on copy). This is DISPLAY COPY ONLY — it
// does not drive entitlement, tier gating, or tier resolution. The card that is
// marked "Current Plan" is decided by the live tier from usePlan(), never here.

export interface PlanCardTier {
  tier: number
  name: string
  price: number
  tagline: string
  /** Cumulative "Everything in X, plus:" line shown above the feature list (tiers 2–4). */
  headerLine?: string
  /** Tier 3 is flagged "Most popular". */
  mostPopular?: boolean
  features: string[]
}

export const PLAN_CARD_TIERS: PlanCardTier[] = [
  {
    tier: 1,
    name: 'Starter',
    price: 149,
    tagline: 'Get online + manage leads',
    features: [
      'Website with page editing + media library',
      'Lead CRM, pipeline & alerts',
      'Settings & branding (logo, colors, copy)',
      'Testimonials, legal pages, SEO schema & sitemap (automatic)',
      'SEO Pages: view & edit metadata + "Needs update" badges',
      'AI Authority Score (see your score)',
      'Monthly report: diagnosis + manual fix',
      'Social: manual "Copy & Post" + Google reviews sync',
      'Up to 3 locations',
    ],
  },
  {
    tier: 2,
    name: 'Growth',
    price: 249,
    tagline: 'Do-it-yourself marketing engine',
    headerLine: 'Everything in Starter, plus:',
    features: [
      'Full SEO suite (GSC + GA4, Site Performance / Lighthouse)',
      'Blog editor + Blog SEO',
      'Social tab + smart-scheduling / content queue',
      'Lead reports',
      'Suggested-fix: read-only recommendations',
      'Faster Google reviews sync',
      'Up to 5 locations',
    ],
  },
  {
    tier: 3,
    name: 'Pro',
    price: 349,
    tagline: 'Let the AI run your marketing',
    headerLine: 'Everything in Growth, plus:',
    mostPopular: true,
    features: [
      'All AI content: keyword research, social posts & captions, campaigns, blog drafts, metadata',
      'AI Vision image tagging',
      'AIO structured data + SEO Analytics tiles',
      'AI Authority Score: full breakdown + recommendations',
      'Advanced reports',
      '301 Redirect Map',
      'Suggested-fix: one-click "AI Generate"',
      'Up to 10 locations',
    ],
  },
  {
    tier: 4,
    name: 'Elite',
    price: 499,
    tagline: 'Scale, intelligence & done-for-you',
    headerLine: 'Everything in Pro, plus:',
    features: [
      'Social media analytics & reports',
      'AI Authority Score: competitor benchmarking + trends',
      'Suggested-fix: one-click fix-all (preview + confirm)',
      'Auto-fix scheduling',
      'Weekly reporting + fresher data',
      'White-glove onboarding',
      'Priority support + quarterly strategy review',
      'Unlimited locations + roll-up reporting',
    ],
  },
]

// Remi voice add-on — informational strip rendered below the four tier cards.
// Not a fifth plan; there is no button (plan/add-on changes go through sales).
export const REMI_ADDON = {
  heading: 'Voice AI Receptionist — Remi (optional add-on)',
  description:
    'Remi answers your calls 24/7 — books appointments, captures leads, and answers customer questions in a natural voice. Available as an add-on on any plan.',
  pricingLine:
    '100 minutes included, then $0.50/min. Add-on price by plan: Starter $99/mo · Growth $75/mo · Pro $50/mo · Elite included.',
}

// Concierge plan-change contact. Customers never self-serve checkout — every
// non-current tier links here. There is no entitlement change wired client-side.
export const PLAN_CHANGE_PHONE = '(430) 367-5601'

/** Builds the "Contact us to switch" mailto for a given tier name. */
export function planChangeMailto(tierName: string): string {
  const subject = `PestFlow Pro — plan change to ${tierName}`
  return `mailto:sales@pestflowpro.ai?subject=${encodeURIComponent(subject)}`
}
