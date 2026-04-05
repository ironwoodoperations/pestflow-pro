// Monthly subscription tiers — DO NOT CHANGE PRICES
export const MONTHLY_PLANS = [
  {
    tier: 1,
    name: 'Starter',
    price: 99,
    features: [
      'Branded website',
      'CRM & lead management',
      'Basic SEO tools',
      'Up to 3 locations',
      'Team access',
    ],
    badge: null as string | null,
  },
  {
    tier: 2,
    name: 'Grow',
    price: 149,
    features: [
      'Everything in Starter',
      'Full SEO suite',
      'Blog management',
      'Social scheduling',
    ],
    badge: 'Most Popular' as string | null,
  },
  {
    tier: 3,
    name: 'Pro',
    price: 249,
    features: [
      'Everything in Grow',
      'AI content tools',
      'Advanced reports',
      'Campaign management',
    ],
    badge: null as string | null,
  },
  {
    tier: 4,
    name: 'Elite',
    price: 499,
    features: [
      'Everything in Pro',
      'Social analytics',
      'Autopilot posting',
      'Live review management',
    ],
    badge: 'Best Value' as string | null,
  },
]

// One-time implementation packages
export const IMPLEMENTATION_PACKAGES = [
  {
    id: 'template-launch' as const,
    label: 'Template Launch',
    badge: 'Free–$500 setup',
    description: 'Fast template-based setup and branding',
    requiresCurrentSite: false,
  },
  {
    id: 'growth-setup' as const,
    label: 'Growth Setup',
    badge: '$500–$1,500 setup',
    description: 'Template deployment plus SEO and social integration setup',
    requiresCurrentSite: false,
  },
  {
    id: 'site-migration' as const,
    label: 'Site Migration',
    badge: '$2,000–$3,500 setup',
    description: 'We rebuild your current website from existing content and launch it in PestFlow Pro',
    requiresCurrentSite: true,
  },
  {
    id: 'custom-rebuild' as const,
    label: 'Custom Rebuild',
    badge: 'Custom quote',
    description: 'Full custom redesign and multi-week implementation',
    requiresCurrentSite: true,
  },
]

export type PackageId = typeof IMPLEMENTATION_PACKAGES[number]['id']
