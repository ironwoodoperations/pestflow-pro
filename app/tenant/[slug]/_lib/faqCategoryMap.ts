import { SERVICE_SLUGS } from './serviceData';

// Versioned map: FAQ category label (exact string stored in public.faqs.category)
// → canonical service slug (a member of SERVICE_SLUGS in serviceData.ts).
//
// FAQs key on tenant_id + category only — there is no page_slug / service column
// on the faqs table and no clean programmatic join between a category label and a
// service slug, so this explicit map is the connective layer. It is the single
// source of truth for "which service page owns which FAQ category".
//
// Locked mapping (matches the live service slugs):
//   - 'Wasps & Yellow Jackets' → 'wasp-hornet-control' is the SERVICE_SLUGS member.
//     'wasp-control' is only a redirect alias and is NOT in the set.
//   - 'General' → null: the home/global FAQ bucket, not a service page.
//   - termite-control / termite-inspections have NO FAQ category, so they resolve
//     to zero FAQs via the reverse lookup below (correct — not a gap).
export const FAQ_CATEGORY_TO_SLUG = {
  'Ants': 'ant-control',
  'Bed Bugs': 'bed-bug-control',
  'Fleas & Ticks': 'flea-tick-control',
  'Mosquitoes': 'mosquito-control',
  'Roaches': 'roach-control',
  'Rodents': 'rodent-control',
  'Scorpions': 'scorpion-control',
  'Spiders': 'spider-control',
  'Wasps & Yellow Jackets': 'wasp-hornet-control',
  'General': null,
} as const satisfies Record<string, string | null>;

export type FaqCategory = keyof typeof FAQ_CATEGORY_TO_SLUG;

// Module-load guard: every non-null slug MUST be a canonical SERVICE_SLUGS
// member. A slug typo throws at import time (build / first SSR render), never
// silently at runtime. This is what keeps the map anchored to serviceData.ts.
for (const [category, slug] of Object.entries(FAQ_CATEGORY_TO_SLUG)) {
  if (slug !== null && !SERVICE_SLUGS.has(slug)) {
    throw new Error(
      `[faqCategoryMap] category "${category}" maps to "${slug}", which is not a ` +
        `canonical SERVICE_SLUGS member. Fix the mapping in faqCategoryMap.ts or serviceData.ts.`
    );
  }
}

// Derived reverse lookup: service slug → FAQ category label. Only categories
// that map to a real service page appear here (the null 'General' bucket is
// dropped), so an unmapped slug resolves to undefined.
export const SLUG_TO_FAQ_CATEGORY: Record<string, FaqCategory> = Object.fromEntries(
  Object.entries(FAQ_CATEGORY_TO_SLUG)
    .filter(([, slug]) => slug !== null)
    .map(([category, slug]) => [slug as string, category as FaqCategory])
);
