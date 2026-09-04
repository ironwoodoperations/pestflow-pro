// S335 — THE service catalog. One canonical { slug, title } list per vertical.
//
// WHY THIS FILE EXISTS. The same slugs were stated in three places and pinned
// equal by tests:
//
//   src/lib/adminVerticalPreset.ts        ADMIN_PRESETS[v].servicePageSlugs
//   supabase/functions/_shared/provisioningSeed.ts   VERTICAL_SEED[v].servicePages
//   app/tenant/[slug]/_lib/serviceData.ts  the router's slug Sets
//
// provisioningSeed's own header explained the copy: "provisioningSeed cannot
// import src/lib/adminVerticalPreset (the Supabase CLI bundles only
// supabase/functions/**)". THAT PREMISE IS FALSE and was proven false in
// production — the deployed zernio-connect bundle carries
// shared/lib/resolveSiteUrl.ts AND its non-leaf dependency canonicalHost.ts,
// both verbatim. The CLI ships source files as written and Deno resolves the
// specifiers at RUNTIME, so a cross-tree import works given an explicit `.ts`
// extension. A copy with a drift guard was the right answer to a constraint
// that no longer holds; this file is the answer to the real one.
//
// WHY shared/lib AND NOT supabase/functions/_shared. Anything under
// _shared/** is a trigger path for redeploy-edge-on-shared-change.yml, which
// republishes the sixteen functions in .github/edge-shared-consumers.txt. A
// catalog edit must not redeploy sixteen functions. shared/lib is reachable
// from both trees: extensionless from Vite/Next, explicit `.ts` from Deno.
//
// THIS MODULE IMPORTS NOTHING. Not from src/, not from app/, not from
// supabase/. It is literals and two derived lookups, so it is safe to import
// from every tree and cannot drag a React or Deno dependency across a boundary.
//
// WHAT IS **NOT** HERE: page COPY. The content maps — PEST_CONTENT_MAP,
// IRRIGATION_CONTENT_MAP, LAWN_CONTENT_MAP in src/shells/_shared/, and
// SERVICE_DATA in the app tree — hold hero text, FAQs and treatment prose, and
// they stay exactly where they are. Only slugs and titles moved.
//
// CATALOG ≠ OFFERED. Being in this list makes a slug SERVEABLE. Whether a
// tenant OFFERS it is answered by a page_content row (and, once the read path
// lands, by public.tenant_services). A tenant selling three services has three
// rows and three tiles; the rest of the catalog is routable and unlisted.

/** A vertical with a real service catalog. Not every vertical has one. */
export type CatalogVertical = 'pest' | 'irrigation' | 'lawn';

export interface CatalogService {
  slug: string;
  /** Page title. Names the SERVICE, never the tenant's standing in it. */
  title: string;
}

/**
 * ORDER IS LOAD-BEARING and is preserved from the consumers this replaced:
 *
 *   pest / irrigation — the order ADMIN_PRESETS and VERTICAL_SEED both already
 *     used, byte for byte. It drives the admin sidebar and the order pages are
 *     seeded in, so reordering would move real UI.
 *   lawn — LAWN_CONTENT_MAP's catalog order (turf treatment, maintenance,
 *     landscape, boundary), which ADMIN_PRESETS.lawn already matched.
 *
 * Note this order deliberately DIFFERS from the content maps' key order for
 * pest and irrigation. That is not an oversight — it is what makes the
 * order-sensitive assertions in the consumer tests able to catch a revert to
 * `Object.keys(SOME_CONTENT_MAP)`.
 */
export const SERVICE_CATALOG: Readonly<Record<CatalogVertical, readonly CatalogService[]>> =
  Object.freeze({
    // 12 — titles unchanged from VERTICAL_SEED.
    pest: Object.freeze([
      { slug: 'pest-control', title: 'Pest Control Services' },
      { slug: 'termite-control', title: 'Termite Control' },
      { slug: 'termite-inspections', title: 'Termite Inspections' },
      { slug: 'spider-control', title: 'Spider Control' },
      { slug: 'roach-control', title: 'Roach Control' },
      { slug: 'ant-control', title: 'Ant Control' },
      { slug: 'mosquito-control', title: 'Mosquito Control' },
      { slug: 'scorpion-control', title: 'Scorpion Control' },
      { slug: 'bed-bug-control', title: 'Bed Bug Treatment' },
      { slug: 'flea-tick-control', title: 'Flea & Tick Control' },
      { slug: 'rodent-control', title: 'Rodent Control' },
      { slug: 'wasp-hornet-control', title: 'Wasp & Hornet Control' },
    ]),

    // 5 — titles unchanged from VERTICAL_SEED. 'sod-dirt-work' keeps its
    // ampersand and spacing because live pls rows carry that literal.
    irrigation: Object.freeze([
      { slug: 'sprinkler-systems', title: 'Sprinkler Systems' },
      { slug: 'drainage', title: 'Drainage' },
      { slug: 'pump-systems', title: 'Pump Systems' },
      { slug: 'sod-dirt-work', title: 'Sod & Dirt Work' },
      { slug: 'artificial-turf', title: 'Artificial Turf' },
    ]),

    // 17 — the FULL trade catalog, not one tenant's list.
    //
    // TITLES ARE NOT INVENTED HERE. Lawn has never had seed titles: it is not a
    // SeedVertical, so VERTICAL_SEED has no lawn entry to copy from. Rather
    // than write new strings, each title is LAWN_CONTENT_MAP's own
    // `displayName` for that slug — a string a human already authored for this
    // exact service. serviceCatalog.test.ts pins them equal so they cannot
    // drift apart.
    //
    // Nothing consumes a lawn title today. When lawn becomes seedable these
    // should be REVIEWED as page titles rather than inherited silently: a
    // display name and a page title are related but not the same field, which
    // irrigation shows plainly — 'sprinkler-systems' is titled 'Sprinkler
    // Systems' for seeding but displays as 'Sprinkler System Installation &
    // Repair'.
    lawn: Object.freeze([
      // turf treatment
      { slug: 'lawn-fertilization', title: 'Lawn Fertilization' },
      { slug: 'weed-control', title: 'Weed Control' },
      { slug: 'lawn-aeration', title: 'Lawn Aeration' },
      { slug: 'overseeding', title: 'Overseeding' },
      { slug: 'grub-control', title: 'Grub & Insect Control' },
      { slug: 'lawn-disease-control', title: 'Lawn Disease Control' },
      { slug: 'soil-health', title: 'Soil Health & pH' },
      // maintenance
      { slug: 'mowing-maintenance', title: 'Mowing & Edging' },
      { slug: 'seasonal-cleanup', title: 'Seasonal Cleanup' },
      { slug: 'tree-shrub-trimming', title: 'Tree & Shrub Trimming' },
      { slug: 'mulch-bed-maintenance', title: 'Mulch & Bed Maintenance' },
      // landscape
      { slug: 'landscape-design', title: 'Landscape Design & Installation' },
      { slug: 'hardscape-stonework', title: 'Hardscape & Stonework' },
      // boundary services — shared with another vertical's catalog, deliberately
      { slug: 'sprinkler-systems', title: 'Irrigation Repair' },
      { slug: 'artificial-turf', title: 'Artificial Turf' },
      { slug: 'perimeter-pest-control', title: 'Perimeter Pest Control' },
      { slug: 'mosquito-control', title: 'Mosquito & Tick Control' },
    ]),
  });

/**
 * Slug-only projection, derived ONCE and frozen.
 *
 * The stable identity is the point, not a micro-optimisation: a consumer that
 * re-exports this array can be asserted with `toBe`, so a future re-copy —
 * which would necessarily be a different array — fails the test rather than
 * passing a value-equality check that a copy satisfies by construction.
 */
export const CATALOG_SLUGS: Readonly<Record<CatalogVertical, readonly string[]>> = Object.freeze({
  pest: Object.freeze(SERVICE_CATALOG.pest.map((s) => s.slug)),
  irrigation: Object.freeze(SERVICE_CATALOG.irrigation.map((s) => s.slug)),
  lawn: Object.freeze(SERVICE_CATALOG.lawn.map((s) => s.slug)),
});

/** Every vertical that has a catalog. Not the set of SEEDABLE verticals. */
export const CATALOG_VERTICALS: readonly CatalogVertical[] =
  Object.freeze(['pest', 'irrigation', 'lawn'] as const);

/** True when the vertical has a catalog. Narrows for callers holding a string. */
export function isCatalogVertical(v: unknown): v is CatalogVertical {
  return typeof v === 'string'
    && Object.prototype.hasOwnProperty.call(SERVICE_CATALOG, v);
}

/**
 * The catalog for a vertical. EMPTY — never pest — for anything unregistered,
 * for the same reason serviceSlugsFor has no pest fallback: an unknown trade
 * must serve nothing rather than another trade's pages.
 */
export function catalogFor(vertical: string | null | undefined): readonly CatalogService[] {
  return isCatalogVertical(vertical) ? SERVICE_CATALOG[vertical] : EMPTY_CATALOG;
}

/** The slug list for a vertical. Empty (never pest) when unregistered. */
export function catalogSlugsFor(vertical: string | null | undefined): readonly string[] {
  return isCatalogVertical(vertical) ? CATALOG_SLUGS[vertical] : EMPTY_SLUGS;
}

const EMPTY_CATALOG: readonly CatalogService[] = Object.freeze([]);
const EMPTY_SLUGS: readonly string[] = Object.freeze([]);
