import { describe, it, expect } from 'vitest';
import {
  publiclyListedServices,
  isServeableServiceSlug,
  NON_LISTABLE_SLUGS,
} from './publiclyListedServices';
import { SERVICE_SLUGS, IRRIGATION_SERVICE_SLUGS } from './serviceData';

// ── LIVE FIXTURES. Every slug list below was read from the production database on
// 2026-09-04, not invented, so a byte-identical assertion means byte-identical for the
// tenant that actually exists.
const PLS_ROWS = [
  'about', 'artificial-turf', 'drainage', 'faq', 'home', 'pump-systems',
  'sod-dirt-work', 'sprinkler-systems',
].map((page_slug) => ({ page_slug, title: page_slug }));

const APEX_ROWS = [
  'about', 'accessibility', 'ant-control', 'bed-bug-control', 'faq', 'flea-tick-control',
  'home', 'mosquito-control', 'pest-control', 'privacy', 'roach-control', 'rodent-control',
  'scorpion-control', 'sms-terms', 'spider-control', 'termite-control',
  'termite-inspections', 'terms', 'wasp-hornet-control',
].map((page_slug) => ({ page_slug, title: page_slug }));

// dang's real rows, INCLUDING the wasp-control row this session exists to stop listing.
// Read-only fixture: the row is not modified, deleted or "fixed" anywhere.
const DANG_ROWS = [
  'about', 'accessibility', 'ant-control', 'bed-bug-control', 'contact', 'faq',
  'flea-tick-control', 'home', 'mosquito-control', 'pest-control', 'privacy', 'quote',
  'roach-control', 'rodent-control', 'scorpion-control', 'sms-terms', 'spider-control',
  'termite-control', 'termite-inspections', 'terms', 'wasp-control', 'wasp-hornet-control',
].map((page_slug) => ({ page_slug, title: page_slug }));

const VITA_GLOW_ROWS = [
  'about', 'contact', 'home', 'injectables', 'iv-infusions', 'weight-wellness',
].map((page_slug) => ({ page_slug, title: page_slug }));

const PLS = { template: 'modern-pro', vertical: 'irrigation', industry: 'irrigation and sprinklers' };
const APEX = { template: 'modern-pro', vertical: 'pest', industry: 'Pest Control' };
const DANG = { template: 'modern-pro', vertical: 'pest', industry: 'Pest Control' };
const VITA_GLOW = { template: 'vita-glow', vertical: null, industry: 'Medical Aesthetics' };

/** The predicate the four listing surfaces used BEFORE this module: rows minus exclusions. */
function predicateA<T extends { page_slug: string }>(rows: T[]): T[] {
  return rows.filter((r) => !NON_LISTABLE_SLUGS.has(r.page_slug));
}

const slugs = (rows: { page_slug: string }[]) => rows.map((r) => r.page_slug);

describe('BYTE-IDENTICAL for every live tenant that renders through this route', () => {
  // The requirement with real consequences: pls is a paying client on its own domain, and
  // its five service pages are indexed. If this list moves, its sitemap moves.
  it('pls — deep equality against the old predicate', () => {
    expect(slugs(publiclyListedServices(PLS, PLS_ROWS)))
      .toStrictEqual(slugs(predicateA(PLS_ROWS)));
  });

  it('pls — and the list is exactly the five live pages, named', () => {
    expect(slugs(publiclyListedServices(PLS, PLS_ROWS))).toStrictEqual([
      'artificial-turf', 'drainage', 'pump-systems', 'sod-dirt-work', 'sprinkler-systems',
    ]);
  });

  it('a pest tenant — deep equality, all 12', () => {
    expect(slugs(publiclyListedServices(APEX, APEX_ROWS)))
      .toStrictEqual(slugs(predicateA(APEX_ROWS)));
    expect(publiclyListedServices(APEX, APEX_ROWS)).toHaveLength(12);
  });

  // vita-glow's vertical is NULL, so a bare `catalog.has(slug)` predicate returns the EMPTY
  // set for it and would strip all three service pages from nav, tiles, sitemap and quote
  // form — while [service]/page.tsx kept rendering them from its own branch. This case is
  // why the predicate mirrors the router's branches instead of testing the catalog alone.
  it('vita-glow — deep equality, and NOT emptied by having no vertical catalog', () => {
    expect(slugs(publiclyListedServices(VITA_GLOW, VITA_GLOW_ROWS)))
      .toStrictEqual(slugs(predicateA(VITA_GLOW_ROWS)));
    expect(slugs(publiclyListedServices(VITA_GLOW, VITA_GLOW_ROWS)))
      .toStrictEqual(['injectables', 'iv-infusions', 'weight-wellness']);
  });

  it('anti-vacuity: the comparison predicate is not itself trivially equal', () => {
    // If predicateA and the canonical predicate agreed on EVERYTHING, the equalities above
    // would prove nothing. dang is where they differ, by exactly one row.
    expect(slugs(predicateA(DANG_ROWS))).not.toStrictEqual(slugs(publiclyListedServices(DANG, DANG_ROWS)));
  });
});

describe('the defect: a row the router will not serve is not listed', () => {
  // THE LIVE PROOF, cited by the S324 report. dang holds page_content rows for BOTH
  // wasp-control and wasp-hornet-control; PEST_CONTENT_MAP holds only the latter.
  it("dang's wasp-control row is excluded, and wasp-hornet-control is kept", () => {
    const out = slugs(publiclyListedServices(DANG, DANG_ROWS));
    expect(out).not.toContain('wasp-control');
    expect(out).toContain('wasp-hornet-control');
  });

  it('and that is the ONLY thing it changes for dang — one row, not a rewrite', () => {
    const before = slugs(predicateA(DANG_ROWS));
    const after = slugs(publiclyListedServices(DANG, DANG_ROWS));
    expect(before.filter((s) => !after.includes(s))).toStrictEqual(['wasp-control']);
    expect(after.filter((s) => !before.includes(s))).toStrictEqual([]);
  });

  it('anti-vacuity: wasp-control really is absent from the pest catalog', () => {
    expect(SERVICE_SLUGS.has('wasp-hornet-control')).toBe(true);
    expect(SERVICE_SLUGS.has('wasp-control')).toBe(false);
  });
});

describe('a catalog slug with NO page_content row is not listed', () => {
  it('pest catalog has 12 but a tenant with 2 rows lists 2', () => {
    const rows = [{ page_slug: 'ant-control' }, { page_slug: 'roach-control' }];
    expect(slugs(publiclyListedServices(APEX, rows))).toStrictEqual(['ant-control', 'roach-control']);
    expect(SERVICE_SLUGS.size).toBe(12);
  });

  // The router still SERVES those ten — that is the correctly different question, and this
  // module deliberately does not change it.
  it('but the router would still serve them — listed and serveable are not the same', () => {
    expect(isServeableServiceSlug(APEX, 'termite-control')).toBe(true);
  });
});

describe('the ZERO case must not crash — a tenant with no listed services', () => {
  it('returns an empty array rather than throwing', () => {
    expect(publiclyListedServices(APEX, [])).toStrictEqual([]);
    expect(publiclyListedServices(APEX, null)).toStrictEqual([]);
    expect(publiclyListedServices(APEX, undefined)).toStrictEqual([]);
  });

  it('a tenant whose only rows are non-service pages lists nothing', () => {
    const rows = ['home', 'about', 'contact', 'faq', 'quote', 'terms'].map((page_slug) => ({ page_slug }));
    expect(publiclyListedServices(APEX, rows)).toStrictEqual([]);
  });

  it('an unregistered vertical serves nothing rather than another trade’s pages', () => {
    const pool = { template: 'modern-pro', vertical: 'pool', industry: 'Pool Service' };
    expect(publiclyListedServices(pool, APEX_ROWS)).toStrictEqual([]);
    expect(isServeableServiceSlug(pool, 'ant-control')).toBe(false);
  });
});

describe('isServeableServiceSlug mirrors the router', () => {
  it('vita-glow serves any slug that has a row — its branch runs before the vertical logic', () => {
    expect(isServeableServiceSlug(VITA_GLOW, 'injectables')).toBe(true);
    expect(isServeableServiceSlug(VITA_GLOW, 'anything-at-all')).toBe(true);
  });

  it('every other template asks the vertical catalog', () => {
    expect(isServeableServiceSlug(PLS, 'sprinkler-systems')).toBe(true);
    expect(isServeableServiceSlug(PLS, 'ant-control')).toBe(false);
    expect(isServeableServiceSlug(APEX, 'ant-control')).toBe(true);
    expect(isServeableServiceSlug(APEX, 'sprinkler-systems')).toBe(false);
  });

  it('anti-vacuity: the two catalogs are genuinely different sets', () => {
    expect(IRRIGATION_SERVICE_SLUGS.size).toBe(5);
    // Array.from, not a spread: the root tsconfig targets below es2015 and TS2802s a
    // Set spread. vitest transpiles it happily, which is exactly why tsc is the check.
    expect(Array.from(IRRIGATION_SERVICE_SLUGS).some((s) => SERVICE_SLUGS.has(s))).toBe(false);
  });
});

describe('shape guarantees the surfaces depend on', () => {
  it('preserves the caller’s order — it filters and never sorts', () => {
    const rows = [{ page_slug: 'spider-control' }, { page_slug: 'ant-control' }];
    expect(slugs(publiclyListedServices(APEX, rows))).toStrictEqual(['spider-control', 'ant-control']);
  });

  it('returns a NEW array, so a caller may sort it in place', () => {
    const out = publiclyListedServices(APEX, APEX_ROWS);
    expect(out).not.toBe(APEX_ROWS);
  });

  it('preserves every field on the row, not just page_slug', () => {
    const rows = [{ page_slug: 'ant-control', title: 'Ants', image_url: '/a.png' }];
    expect(publiclyListedServices(APEX, rows)[0]).toStrictEqual(rows[0]);
  });
});
