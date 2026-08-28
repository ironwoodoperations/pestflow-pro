// Single source of truth for the 5 demo-flagged tenants surfaced on the apex
// marketing site. Imported by the homepage carousel + /demos + /demos/admin.
// To add a 6th demo, append one entry — all 3 surfaces pick it up automatically.
//
// `tier` MIRRORS the live `tenants.entitlement` smallint for that demo tenant
// (the single feature gate, read by PlanContext). It exists here so the apex
// marketing pages — which render with no tenant session and therefore cannot
// read `tenants.entitlement` — can label each demo with the plan it runs on.
// Display name and price come from tierInfo(), never from literals here.
// If an entitlement changes in the DB, update the matching `tier` below.

export interface DemoTenant {
  slug: string;
  name: string;
  shortLabel: string;
  city: string;
  state: string;
  shell: 'clean-friendly' | 'bold-local' | 'modern-pro' | 'rustic-rugged' | 'metro-pro';
  /** Mirrors tenants.entitlement (1-4). Names/prices resolve via tierInfo(). */
  tier: 1 | 2 | 3 | 4;
  persona: string;
}

export const DEMO_TENANTS: DemoTenant[] = [
  { slug: 'coastal-pest',         name: 'Coastal Pest Co.',         shortLabel: 'Coastal',       city: 'Galveston',   state: 'TX', shell: 'clean-friendly', tier: 2, persona: 'Coastal beach-town family pest control' },
  { slug: 'urban-strike',         name: 'Urban Strike Pest Defense', shortLabel: 'Urban Strike', city: 'Dallas',      state: 'TX', shell: 'bold-local',     tier: 3, persona: 'Bold metropolitan defender against urban pests' },
  { slug: 'apex-protect',         name: 'Apex Pest Protection',     shortLabel: 'Apex',          city: 'Austin',      state: 'TX', shell: 'modern-pro',     tier: 3, persona: 'Tech-forward precision pest engineering' },
  { slug: 'heartland-pest',       name: 'Heartland Pest Co.',       shortLabel: 'Heartland',     city: 'Springfield', state: 'MO', shell: 'rustic-rugged',  tier: 1, persona: 'Family-owned Ozarks-grown pest control' },
  { slug: 'metro-pest-concierge', name: 'Metro Pest Concierge',     shortLabel: 'Metro',         city: 'Houston',     state: 'TX', shell: 'metro-pro',      tier: 4, persona: 'Concierge-level service for upscale Houston neighborhoods' },
];

// Shell accent colors used on apex pages where shell CSS vars are not loaded.
// Sourced from each shell's personality contract (S206-B).
export const SHELL_ACCENT_COLORS: Record<DemoTenant['shell'], string> = {
  'clean-friendly': '#0EA5E9',
  'bold-local':     '#F59E0B',
  'modern-pro':     '#3FB8AF',
  'rustic-rugged':  '#B85C38',
  'metro-pro':      '#14B8A6',
};

export function publicDemoUrl(slug: string): string {
  return `https://${slug}.pestflowpro.ai`;
}

export function adminDemoUrl(slug: string): string {
  return `https://${slug}.pestflowpro.ai/admin`;
}
