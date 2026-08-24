// S285 Phase 3b — ADMIN LABEL PRESET.
//
// UI labels read by a human in the admin dashboard: FAQ category options, the
// page-slug sidebar, form placeholder text, and what a "service" is called.
//
// DELIBERATELY SEPARATE from two things it must never import:
//
//   src/shells/_shared/verticalCopy.ts — the PUBLIC-SITE registry. Different
//   reader (a prospect on the marketing site), different review risk.
//
//   supabase/functions/_shared/verticalCopy.ts — GENERATED copy fed to a model.
//   A wrong noun there produces a fabricated sentence in a report; a wrong label
//   here produces a confusing dropdown. Different blast radius, different change
//   cadence. Merging them would couple a prompt rewrite to a UI relabel.
//
// THE TWO RULES:
//   (a) a preset holds only what is true of the whole TRADE. No tenant facts —
//       no licence numbers, no cities, no warranty terms, no service areas.
//       Location pages are the clearest case: they derive from service_areas,
//       differ per tenant, live in seo_meta rather than page_content, and are
//       NOT in servicePageSlugs.
//   (b) never fabricate. An unrecorded vertical resolves to NEUTRAL, never to
//       pest — and NEUTRAL names no service pages at all, because a tenant whose
//       trade we do not know has no service pages we can name.
//
// KEYED ON `vertical`, NOT `industry`. Not a style preference — a correctness
// constraint from the live data. settings.business_info.vertical is
// CHECK-constrained to 'pest' | 'irrigation' and is backfilled (7 pest, 1
// irrigation, 1 deliberate NULL). settings.business_info.industry is FREE TEXT
// from an onboarding input: pls's stored value is a 154-character service
// description, vita-glow's is "Medical Aesthetics". Neither would ever match a
// lookup key.
//
// NO THIRD KEY. vita-glow's pages (injectables, iv-infusions, weight-wellness)
// are real, but settings_business_info_vertical_valid permits only the two
// literals, so a 'medical_aesthetics' key would be unreachable dead code until
// that constraint is widened. It resolves to NEUTRAL, which is correct.

export type AdminVertical = 'pest' | 'irrigation';

export interface AdminEntityLabels {
  /** One service, as a noun phrase. Used in tooltips and button labels. */
  service: string;
  /** Heading for the group of service pages, e.g. on the SEO tab. */
  servicePages: string;
  /** What a location page is called. Platform-identical today; a slot, not a guess. */
  serviceArea: string;
}

export interface AdminPlaceholders {
  /** Example FAQ question — an EXAMPLE, never a claim the tenant has made. */
  faqQuestion: string;
  /** Example SEO keyword for the keyword generator. */
  seoKeyword: string;
  /** How the Content tab describes picking a photo for a service page. */
  contentPhotoHint: string;
}

export interface AdminLabelPreset {
  faqCategories: string[];
  servicePageSlugs: string[];
  placeholders: AdminPlaceholders;
  entityLabels: AdminEntityLabels;
}

// ── Platform pages ──────────────────────────────────────────────────────────
// Identical for EVERY vertical, so they live here once rather than being
// repeated in each preset. Verified against live page_content rows.
//
// This corrects ContentTab's STANDARD_SLUGS in BOTH directions:
//   - it listed `contact`, which no pest demo tenant actually has (only Dang)
//   - it omitted accessibility, privacy, terms, sms-terms and quote, all of
//     which exist for real — so they fell through to the "Custom Pages" bucket
//
// Split lead/trail purely for sidebar ordering: home and about first, service
// pages next, the rest after. PLATFORM_PAGE_SLUGS is the flat set for callers
// that only need membership.
export const PLATFORM_PAGE_SLUGS_LEADING: string[] = ['home', 'about'];
export const PLATFORM_PAGE_SLUGS_TRAILING: string[] = [
  'faq', 'contact', 'quote', 'privacy', 'terms', 'accessibility', 'sms-terms',
];
export const PLATFORM_PAGE_SLUGS: string[] = [
  ...PLATFORM_PAGE_SLUGS_LEADING,
  ...PLATFORM_PAGE_SLUGS_TRAILING,
];

// ── Presets ─────────────────────────────────────────────────────────────────
//
// faqCategories and servicePageSlugs are SEPARATE LISTS that merely overlap.
// Do not derive one from the other: pls has five service pages but only four
// FAQ categories — `retaining-walls` has no category — and the strings differ in
// form anyway ('sod-dirt-work' vs 'Sod & Dirt Work').

export const ADMIN_PRESETS: Record<AdminVertical, AdminLabelPreset> = {
  pest: {
    // Unchanged from FaqItemForm's FAQ_CATEGORIES — these are live values that
    // existing pest FAQ rows are already stored against. Renaming any of them
    // would orphan real rows into FaqTab's otherCats bucket.
    faqCategories: [
      'General', 'Ants', 'Spiders', 'Wasps & Yellow Jackets',
      'Scorpions', 'Rodents', 'Mosquitoes', 'Fleas & Ticks', 'Roaches', 'Bed Bugs',
    ],
    // Live page_content, identical across all seven pest tenants — 12/12 match
    // with the PEST_SLUGS array this replaces.
    servicePageSlugs: [
      'pest-control', 'termite-control', 'termite-inspections', 'spider-control',
      'roach-control', 'ant-control', 'mosquito-control', 'scorpion-control',
      'bed-bug-control', 'flea-tick-control', 'rodent-control', 'wasp-hornet-control',
    ],
    placeholders: {
      faqQuestion: 'e.g. Are your treatments safe for pets?',
      seoKeyword: 'e.g. spider control',
      contentPhotoHint: 'For pest pages, choose a photo from the auto-loaded image search.',
    },
    entityLabels: {
      service: 'pest service',
      servicePages: 'Pest Pages',
      serviceArea: 'service area',
    },
  },

  irrigation: {
    // pls's four live FAQ categories, exactly as stored. 'Sod & Dirt Work' keeps
    // its ampersand and spacing because live rows carry that literal.
    faqCategories: [
      'General', 'Sprinkler Systems', 'Drainage', 'Pump Systems', 'Sod & Dirt Work',
    ],
    // pls's five live page_content service pages. `retaining-walls` is here even
    // though it has no matching FAQ category — see the note above.
    servicePageSlugs: [
      'sprinkler-systems', 'drainage', 'pump-systems', 'sod-dirt-work', 'retaining-walls',
    ],
    placeholders: {
      faqQuestion: 'e.g. How often should I run my sprinklers?',
      seoKeyword: 'e.g. sprinkler repair',
      contentPhotoHint: 'For service pages, choose a photo from the auto-loaded image search.',
    },
    entityLabels: {
      service: 'irrigation service',
      servicePages: 'Irrigation Pages',
      serviceArea: 'service area',
    },
  },
};

// The fallback names no trade. USABLE, not empty: a tenant with no recorded
// vertical still gets a working FAQ category list and the full platform page
// set. These four categories are organisational buckets for FAQs the tenant
// writes themselves — they assert nothing about what the business does or
// offers, which is why 'Warranty' and 'Guarantee' are deliberately absent.
//
// servicePageSlugs is EMPTY on purpose. It is the one slot where a plausible
// default would be a fabrication: naming service pages for a tenant whose trade
// is unrecorded means inventing their trade. Their real pages still reach the
// sidebar through ContentTab's existing custom-slug path, which reads
// page_content directly.
export const NEUTRAL_ADMIN_PRESET: AdminLabelPreset = {
  faqCategories: ['General', 'Services', 'Pricing', 'Scheduling'],
  servicePageSlugs: [],
  placeholders: {
    faqQuestion: 'e.g. What areas do you serve?',
    seoKeyword: 'e.g. your main service',
    contentPhotoHint: 'For service pages, choose a photo from the auto-loaded image search.',
  },
  entityLabels: {
    service: 'service',
    servicePages: 'Service Pages',
    serviceArea: 'service area',
  },
};

// ── The selector (S290) ─────────────────────────────────────────────────────
//
// provision-tenant now RECORDS the vertical, which means a human has to supply
// it. These are the options both wizards render.
//
// A SELECT, NOT A TEXT BOX. `industry` is already free text and that is exactly
// why nothing can key on it: pls's stored value is a 154-character service
// description and vita-glow's is "Medical Aesthetics". Neither would ever match
// a lookup key, and a typed 'Pest Control' is rejected by
// settings_business_info_vertical_valid with 23514.
//
// The empty option is REAL, not a prompt to be dismissed. "Not listed" is the
// correct answer for vita-glow and for the next tenant whose trade has no
// preset, and it seeds trade-neutral rather than pest. Widening this list means
// widening the CHECK constraint in the same change.
export const ADMIN_VERTICAL_LABELS: Record<AdminVertical, string> = {
  pest: 'Pest Control',
  irrigation: 'Irrigation & Sprinklers',
};

export interface VerticalOption { value: AdminVertical | ''; label: string }

export const VERTICAL_OPTIONS: VerticalOption[] = [
  { value: '', label: 'Not listed / other — seeds no service pages' },
  { value: 'pest', label: ADMIN_VERTICAL_LABELS.pest },
  { value: 'irrigation', label: ADMIN_VERTICAL_LABELS.irrigation },
];

/** True only for a vertical this module has a preset for. */
export function isAdminVertical(vertical: string | null | undefined): vertical is AdminVertical {
  return typeof vertical === 'string' && Object.prototype.hasOwnProperty.call(ADMIN_PRESETS, vertical);
}

/** Never throws, never returns undefined. Unknown/absent/mis-cased -> NEUTRAL. */
export function getAdminPreset(vertical: string | null | undefined): AdminLabelPreset {
  return isAdminVertical(vertical) ? ADMIN_PRESETS[vertical] : NEUTRAL_ADMIN_PRESET;
}

/**
 * The ordered slug list for the Content tab sidebar and for deciding what counts
 * as a "standard" page. Platform pages bracket the vertical's service pages.
 * For NEUTRAL this is exactly the platform list.
 */
export function standardPageSlugs(vertical: string | null | undefined): string[] {
  return [
    ...PLATFORM_PAGE_SLUGS_LEADING,
    ...getAdminPreset(vertical).servicePageSlugs,
    ...PLATFORM_PAGE_SLUGS_TRAILING,
  ];
}

/** True when the slug is one of the vertical's service pages. NEUTRAL: always false. */
export function isServicePageSlug(vertical: string | null | undefined, slug: string): boolean {
  return getAdminPreset(vertical).servicePageSlugs.indexOf(slug) !== -1;
}

/**
 * Split a tenant's stored page_content slugs into the sidebar's two groups.
 *
 * Exists because ContentTab must NOT snapshot this split. The page_content query
 * and the vertical lookup race; deriving on every render keeps the two groups
 * consistent with whatever the vertical currently is, so no slug can appear in
 * both — which is what happened when the split was computed once, at fetch time,
 * against a still-NEUTRAL preset.
 */
export function partitionPageSlugs(
  vertical: string | null | undefined,
  allSlugs: string[],
): { standard: string[]; custom: string[] } {
  const standard = standardPageSlugs(vertical);
  return { standard, custom: allSlugs.filter((s) => standard.indexOf(s) === -1) };
}
