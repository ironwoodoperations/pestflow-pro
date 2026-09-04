// S290 — what provisioning writes for a NEW tenant, derived from its vertical.
//
// WHY THIS EXISTS. provision-tenant seeded pest content for every tenant
// regardless of trade: a home title reading "— Professional Pest Control",
// twelve pest service pages, pest seo_meta, and "{city} Pest Control" on every
// service area. It also wrote NO vertical at all, which is why eight of nine
// live tenants had a NULL one until it was backfilled by hand. Spin up a pool
// company and it got a pest-control website.
//
// THE TWO RULES:
//   (a) a preset holds only what is true of the whole TRADE. No tenant facts —
//       no licence, no insurance, no warranty, no founding year, no region the
//       tenant did not supply. Those live in the database, entered by a human.
//   (b) never fabricate. An UNKNOWN vertical seeds platform pages ONLY and
//       names no trade anywhere. Defaulting an unrecorded tenant to pest is the
//       defect this whole arc removed.
//
// WHAT WAS DELETED, not reworded. The old seed wrote claims the tenant had
// never made, straight into the DB, for every new customer:
//   "Fast, effective, guaranteed."            a warranty nobody offered
//   "Licensed technicians, fast response"     a licence and a capacity promise
//   "Family-owned, fully licensed and insured" four tenant facts, all invented
//   "Call for a free quote."                  an offer
//   "Free inspections available."             an offer
//   "Licensed & insured professionals."       a licence claim
//   "Locally owned and operated."             a tenant fact
// None of them is replaced by a safer-sounding version. A subtitle the tenant
// has not written is EMPTY, because that is the honest state and the admin
// dashboard is where they fill it in. S286 settled this: with the field empty
// the template cannot be used, no default, no placeholder that reads as an offer.
//
// WHERE THIS LIVES. supabase/functions/_shared/, because this module is
// provisioning policy and belongs beside the function that applies it.
//
// S335 — THE OLD REASON FOR THE SLUG COPY WAS FALSE, and this header used to
// state it: "the Supabase CLI bundles only supabase/functions/**, so
// provision-tenant cannot import from src/ or shared/ without deploying
// broken". Production disproved it — the deployed zernio-connect bundle
// carries shared/lib/resolveSiteUrl.ts AND its non-leaf dependency
// canonicalHost.ts, both verbatim. The CLI ships source files as written and
// Deno resolves specifiers at RUNTIME, so a cross-tree import works given an
// explicit `.ts` extension. The service-page slugs are therefore IMPORTED from
// shared/lib/serviceCatalog.ts, not restated, and the drift test that pinned
// the two copies equal is replaced by one asserting this module resolves to
// the canonical array itself.
//
// src/ remains off limits: it is React and Vite-resolved, and importing it
// here WOULD deploy broken. shared/lib is the seam that is safe from both trees.
//
// Pure: no I/O, no Deno APIs, ES5-safe (the root tsconfig sets no target).

import { getVerticalCopy, isKnownVertical } from './verticalCopy.ts';
import { SERVICE_CATALOG } from '../../../shared/lib/serviceCatalog.ts';

/**
 * The only two values settings_business_info_vertical_valid accepts:
 *
 *   CHECK (key <> 'business_info' OR value->>'vertical' IS NULL
 *          OR value->>'vertical' = ANY (ARRAY['pest','irrigation']))
 *
 * NULL is permitted and means "not recorded". Anything else is rejected at
 * write time with 23514, which is why validateVertical() exists — a bad value
 * must fail loudly at the edge rather than be silently dropped on the floor.
 */
export type SeedVertical = 'pest' | 'irrigation' | 'lawn';
export const SEED_VERTICALS: SeedVertical[] = ['pest', 'irrigation', 'lawn'];

export interface SeedPage {
  slug: string;
  /** Page title. Names the SERVICE, never the tenant's standing in it. */
  title: string;
}

export interface VerticalSeed {
  /** Title-case trade, for a page title: "Pest Control", "Irrigation". */
  tradeTitle: string;
  /** The tenant's service pages, in sidebar order. THE canonical catalog
   *  array from shared/lib/serviceCatalog — a shared frozen reference, never
   *  a local copy. */
  servicePages: readonly SeedPage[];
}

// Slugs AND titles come from shared/lib/serviceCatalog — the same arrays the
// admin sidebar reads, so the two cannot drift because there is only one.
// Titles name the service only: "Termite Control", not "Termite Control —
// Guaranteed Results".
//
// tradeTitle stays here: it is provisioning vocabulary ("{city} Pest Control"
// on a service area), not a catalog fact, and lawn has no seed entry at all.
export const VERTICAL_SEED: Record<SeedVertical, VerticalSeed> = {
  pest: {
    tradeTitle: 'Pest Control',
    servicePages: SERVICE_CATALOG.pest,
  },
  irrigation: {
    tradeTitle: 'Irrigation',
    servicePages: SERVICE_CATALOG.irrigation,
  },
  // S341 — lawn becomes seedable. 'Lawn Care' matches VERTICAL_COPY.lawn's
  // tradeNoun ('lawn care'), which was chosen because the noun has to be true of
  // every tenant in the vertical: the catalog spans turf treatment, maintenance
  // and landscape work, and 'lawn care' covers all of it without asserting any
  // one company does all of it. Not 'Lawn Maintenance', not 'Landscaping'.
  //
  // The 17-service catalog is now REACHABLE but no tenant gets all 17 unless
  // they select all 17 — see the `services` selection below.
  lawn: {
    tradeTitle: 'Lawn Care',
    servicePages: SERVICE_CATALOG.lawn,
  },
};

/**
 * Pages every tenant gets, whatever their trade — and the ONLY pages an
 * unrecorded vertical gets. Mirrors PLATFORM_PAGE_SLUGS in adminVerticalPreset,
 * split the same way so service pages sit between the leading and trailing sets.
 *
 * Provisioning seeds page_content for the subset below; privacy, terms,
 * accessibility and sms-terms are platform-rendered and have no page_content
 * row, which is why they are not seeded here. The test states that gap rather
 * than papering over it.
 */
export const SEED_PLATFORM_PAGES_LEADING: SeedPage[] = [
  { slug: 'home', title: '' },
  { slug: 'about', title: '' },
];
export const SEED_PLATFORM_PAGES_TRAILING: SeedPage[] = [
  { slug: 'contact', title: 'Contact Us' },
  { slug: 'faq', title: 'Frequently Asked Questions' },
  { slug: 'quote', title: 'Request a Quote' },
];

/** Flat membership set — a slug that is a platform page for EVERY vertical. */
export const SEED_PLATFORM_SLUGS: string[] = [
  'home', 'about', 'faq', 'contact', 'quote',
  'privacy', 'terms', 'accessibility', 'sms-terms', 'blog', 'reviews', 'service-area',
];

/** True only for a vertical this module can seed. */
export function isSeedVertical(v: unknown): v is SeedVertical {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(VERTICAL_SEED, v);
}

export interface VerticalValidation {
  /** The value to write. NULL means "not recorded" and is legal. */
  vertical: SeedVertical | null;
  /** Non-null when the caller supplied something the constraint would reject. */
  error: string | null;
}

/**
 * Validate BEFORE writing, so a bad value fails loudly instead of reaching the
 * CHECK constraint as a 23514 buried in a settings upsert that logs and moves on.
 *
 * Absent / null / '' is NOT an error: the constraint permits NULL, and "the
 * operator did not pick one" is a real state that must seed neutral rather than
 * be rejected. Anything else — 'pest-control', 'Pest', 'hvac' — is an error.
 * Note the near-misses: the constraint takes the literals only, so 'pest_control'
 * and 'Pest' are as invalid as 'hvac'.
 */
export function validateVertical(raw: unknown): VerticalValidation {
  if (raw === undefined || raw === null) return { vertical: null, error: null };
  if (typeof raw !== 'string') {
    return { vertical: null, error: 'vertical must be a string, got ' + typeof raw };
  }
  const trimmed = raw.trim();
  if (trimmed === '') return { vertical: null, error: null };
  if (isSeedVertical(trimmed)) return { vertical: trimmed, error: null };
  return {
    vertical: null,
    error: 'vertical must be one of ' + SEED_VERTICALS.join(', ')
      + ' (or omitted); got ' + JSON.stringify(raw),
  };
}

/** 'pest' -> 'Pest Control'. Unknown -> '' (names no trade). */
export function tradeTitleFor(vertical: string | null | undefined): string {
  return isSeedVertical(vertical) ? VERTICAL_SEED[vertical].tradeTitle : '';
}

/** 'pest' -> 'pest control'. Unknown -> '' — NOT the neutral 'home services'. */
export function tradeNounFor(vertical: string | null | undefined): string {
  return isKnownVertical(vertical) ? getVerticalCopy(vertical).tradeNoun : '';
}

/**
 * Service page slugs for a vertical. EMPTY for an unrecorded one — the same
 * choice NEUTRAL_ADMIN_PRESET makes, and for the same reason: naming service
 * pages for a tenant whose trade we do not know means inventing their trade.
 */
// S340 — `readonly`, matching what it actually returns. VERTICAL_SEED.servicePages
// is the frozen catalog array from shared/lib, so declaring a mutable SeedPage[]
// was a lie the compiler never caught: the root tsconfig EXCLUDES supabase/, so
// nothing typechecked this file. All three callers only read it.
export function servicePagesFor(vertical: string | null | undefined): readonly SeedPage[] {
  return isSeedVertical(vertical) ? VERTICAL_SEED[vertical].servicePages : [];
}

/**
 * THE SELECTED service pages — S341, and the distinction this function exists
 * to make.
 *
 * `servicePagesFor` answers "what CAN this vertical sell?". This answers "what
 * does THIS TENANT sell?", and those are not the same question. They only ever
 * looked the same because every tenant provisioned so far happened to sell the
 * whole catalog: all 12 pest services, all 5 irrigation services. Lawn breaks
 * the coincidence — its catalog is 17 and the first lawn client sells 7.
 *
 * `services` ABSENT means "not stated", and falls back to the whole catalog so
 * that every existing caller provisions exactly what it provisioned before.
 * `services` PRESENT — including an empty array — is a statement, and is obeyed.
 *
 * Order comes from the CATALOG, not the caller: catalog order drives the admin
 * sidebar and the order pages are seeded in, so it must not vary with however a
 * selection happened to be typed. Filtering preserves it for free.
 */
export function selectedServicePages(
  vertical: string | null | undefined,
  services?: readonly string[],
): readonly SeedPage[] {
  const all = servicePagesFor(vertical);
  if (services === undefined) return all;
  const want = new Set(services);
  return all.filter((p) => want.has(p.slug));
}

export interface PageContentSeedRow {
  page_slug: string;
  title: string;
  subtitle: string;
  intro: string;
  hero_headline: string;
}

export interface PageContentSeedInput {
  vertical: string | null | undefined;
  businessName: string;
  /** The tenant's own hero line, from the wizard. Falls back to the name. */
  heroHeadline?: string;
  /** The tenant's SELECTED service slugs. Absent = the whole catalog (S341). */
  services?: readonly string[];
}

/**
 * The page_content rows to seed. Platform pages always; service pages only when
 * the trade is recorded.
 *
 * EVERY subtitle is empty except the FAQ's, which describes the page itself and
 * asserts nothing about the business. intro is always empty. This is deliberate:
 * a subtitle is marketing copy, and there is no per-trade sentence that is not
 * either a benefit promise ("Protect your home from termite damage") or a
 * capacity claim ("Comprehensive pest management solutions") — both of which
 * were in the old seed and both of which are rule (b) violations.
 */
export function buildPageContentRows(input: PageContentSeedInput): PageContentSeedRow[] {
  const name = (input.businessName || '').trim();
  const tradeTitle = tradeTitleFor(input.vertical);
  const hero = (input.heroHeadline || '').trim() || name;

  const rows: PageContentSeedRow[] = [];
  const push = (slug: string, title: string, heroHeadline: string, subtitle?: string) => {
    rows.push({
      page_slug: slug,
      title: title,
      subtitle: subtitle || '',
      intro: '',
      hero_headline: heroHeadline,
    });
  };

  // home — the trade appears here ONLY when the tenant recorded it. With no
  // vertical the title is the business name and nothing else.
  push('home', tradeTitle ? name + ' — Professional ' + tradeTitle : name, hero);
  push('about', name ? 'About ' + name : 'About Us', name ? 'About ' + name : 'About Us');

  const services = selectedServicePages(input.vertical, input.services);
  for (let i = 0; i < services.length; i += 1) {
    push(services[i].slug, services[i].title, services[i].title);
  }

  push('contact', 'Contact Us', name ? 'Contact ' + name : 'Contact Us');
  push('faq', 'Frequently Asked Questions', 'Frequently Asked Questions', 'Answers to common questions.');
  push('quote', 'Request a Quote', 'Request a Quote');

  return rows;
}

export interface SeoSeedInput {
  vertical: string | null | undefined;
  businessName: string;
  /** From the tenant's address. '' when unknown. */
  city?: string;
  state?: string;
  /** The tenant's own tagline, verbatim. '' when they gave none. */
  tagline?: string;
}

/** "Tyler, TX", "Tyler", or '' — never a placeholder standing in for a real one. */
function areaOf(input: SeoSeedInput): string {
  const city = (input.city || '').trim();
  const state = (input.state || '').trim();
  if (!city) return '';
  return state ? city + ', ' + state : city;
}

export interface SeoSeedValue {
  meta_description: string;
  focus_keyword: string;
}

/**
 * settings.seo. The old version wrote "Serving your area and surrounding areas"
 * when it had no city — a coverage claim about a tenant whose service area it
 * did not know. With no city the clause is omitted entirely; with no vertical
 * the trade is omitted entirely.
 */
export function buildSeoSettings(input: SeoSeedInput): SeoSeedValue {
  const name = (input.businessName || '').trim();
  const area = areaOf(input);
  const tradeTitle = tradeTitleFor(input.vertical);
  const tradeNoun = tradeNounFor(input.vertical);
  // Taglines often end in '.', and the literal '.' that follows would produce
  // '..' — the S196 CityShield bug.
  const tagline = (input.tagline || '').trim().replace(/\.+$/, '');

  const head = tagline
    ? (name ? name + ' — ' + tagline : tagline)
    : tradeTitle
      ? (name ? tradeTitle + ' services by ' + name : tradeTitle + ' services')
      : name;

  const parts: string[] = [];
  if (head) parts.push(head + '.');
  if (area) parts.push('Serving ' + area + '.');

  const focus = tradeNoun
    ? (input.city ? tradeNoun + ' ' + (input.city || '').trim().toLowerCase() : tradeNoun)
    : '';

  return { meta_description: parts.join(' '), focus_keyword: focus };
}

export interface PageSeoMeta {
  meta_title: string;
  meta_description: string;
}

export interface PageSeoSeedInput extends SeoSeedInput {
  /** The tenant's phone, verbatim. Omitted from copy when absent. */
  phone?: string;
  /** The tenant's SELECTED service slugs. Absent = the whole catalog (S341). */
  services?: readonly string[];
}

/**
 * Per-page meta_title / meta_description for the pages this module seeds.
 *
 * Every string here is built from the business name, the recorded trade, the
 * tenant's own city and their own phone number. Nothing else. The old map
 * asserted licences, insurance, family ownership, response speed, guaranteed
 * results, free quotes and free inspections — for a business nobody had spoken
 * to yet.
 */
export function buildPageSeoMeta(input: PageSeoSeedInput): Record<string, PageSeoMeta> {
  const name = (input.businessName || '').trim();
  const area = areaOf(input);
  const city = (input.city || '').trim();
  const tradeTitle = tradeTitleFor(input.vertical);
  const tradeNoun = tradeNounFor(input.vertical);
  const phone = (input.phone || '').trim();

  const inArea = area ? ' in ' + area : '';
  const out: Record<string, PageSeoMeta> = {};

  const titleTail = name ? ' | ' + name : '';

  out['home'] = {
    meta_title: (name || 'Home') + (tradeTitle ? ' | ' + tradeTitle : '') + (city ? ' in ' + city : ''),
    meta_description: tradeNoun
      ? (name ? name + ' provides ' + tradeNoun + ' services' + inArea + '.' : '')
      : (name ? name + (area ? ' — serving ' + area + '.' : '.') : ''),
  };

  out['about'] = {
    meta_title: (name ? 'About ' + name : 'About Us'),
    meta_description: name
      ? 'Learn about ' + name + (area ? ', serving ' + area : '') + '.'
      : '',
  };

  const services = selectedServicePages(input.vertical, input.services);
  for (let i = 0; i < services.length; i += 1) {
    out[services[i].slug] = {
      meta_title: services[i].title + titleTail,
      meta_description: services[i].title + inArea + (name ? ' from ' + name : '') + '.',
    };
  }

  out['contact'] = {
    meta_title: (name ? 'Contact ' + name : 'Contact Us') + (city ? ' | ' + city : ''),
    meta_description: (name ? 'Contact ' + name : 'Contact us')
      + (tradeNoun ? ' for ' + tradeNoun : '')
      + inArea + '.'
      + (phone ? ' Call ' + phone + '.' : ''),
  };

  out['quote'] = {
    meta_title: 'Request a Quote' + titleTail,
    meta_description: 'Request a quote' + (name ? ' from ' + name : '') + inArea + '.',
  };

  return out;
}

/**
 * The service-area page's hero title. "Tyler Pest Control" for a recorded pest
 * tenant; for an unrecorded trade, the city alone — never a trade we guessed.
 */
export function buildServiceAreaHeroTitle(
  vertical: string | null | undefined,
  city: string,
): string {
  const c = (city || '').trim();
  if (!c) return '';
  const tradeTitle = tradeTitleFor(vertical);
  return tradeTitle ? c + ' ' + tradeTitle : c;
}

/** meta for a service-area page. Same rules: name, trade if recorded, city. */
export function buildServiceAreaSeo(
  vertical: string | null | undefined,
  city: string,
  state: string | null | undefined,
  businessName: string,
): PageSeoMeta & { focus_keyword: string } {
  const c = (city || '').trim();
  const st = (state || '').trim();
  const name = (businessName || '').trim();
  const tradeTitle = tradeTitleFor(vertical);
  const tradeNoun = tradeNounFor(vertical);
  const where = st ? c + ', ' + st : c;

  return {
    meta_title: (tradeTitle ? c + ' ' + tradeTitle : c) + (name ? ' | ' + name : ''),
    meta_description: tradeNoun
      ? (name ? name + ' provides ' + tradeNoun + ' services in ' + where + '.'
              : tradeNoun + ' services in ' + where + '.')
      : (name ? name + ' serving ' + where + '.' : where),
    focus_keyword: tradeNoun ? c.toLowerCase() + ' ' + tradeNoun : '',
  };
}
