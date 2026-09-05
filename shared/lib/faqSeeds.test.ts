// S348 Part C — the seeded FAQ sets.

import { describe, it, expect } from 'vitest';
import { FAQ_SEEDS, faqSeedsFor, buildFaqRows, FAQ_SORT_STRIDE } from './faqSeeds';
import { CATALOG_SLUGS, catalogFor } from './serviceCatalog';

const ALL = Object.values(FAQ_SEEDS).flatMap(v => Object.values(v)).flat();
const ALL_TEXT = ALL.flatMap(f => [f.question, f.answer]);

/** The seven lawn services the grandview rows were lifted from. */
const LAWN_SEEDED = [
  'mowing-maintenance', 'tree-shrub-trimming', 'seasonal-cleanup',
  'hardscape-stonework', 'landscape-design', 'sprinkler-systems', 'artificial-turf',
];

describe('NO TENANT FACT is seeded — the rule this file exists to serve', () => {
  const FORBIDDEN: Array<[string, string]> = [
    ['a licence claim', 'licens'],
    ['a warranty term', 'warrant'],
    ['a guarantee', 'guarantee'],
    ['a founding year', 'since 20'],
    ['an insurance claim', 'insured'],
  ];

  for (const [label, needle] of FORBIDDEN) {
    it(`no seeded string carries ${label}`, () => {
      const hits = ALL_TEXT.filter(t => t.toLowerCase().includes(needle));
      expect(hits, `found: ${hits.join(' | ')}`).toEqual([]);
    });
  }

  it('MUTATION: a reintroduced tenant fact WOULD be caught', () => {
    const bad = 'We are licensed and insured since 2017, with a full warranty and a guarantee.';
    for (const [, needle] of FORBIDDEN) {
      expect(bad.toLowerCase().includes(needle), needle).toBe(true);
    }
  });

  it('ANTI-VACUITY: there is real text to scan', () => {
    expect(ALL.length).toBeGreaterThan(60);
    expect(ALL_TEXT.every(t => t.length > 0)).toBe(true);
  });

  it('no REGION is asserted — the dang rows were de-localised', () => {
    for (const needle of ['east texas', 'tyler', 'piney woods', 'texas']) {
      const hits = ALL_TEXT.filter(t => t.toLowerCase().includes(needle));
      expect(hits, `${needle} in: ${hits.join(' | ')}`).toEqual([]);
    }
  });

  it("'General' is never a seeded category", () => {
    for (const vertical of Object.keys(FAQ_SEEDS)) {
      const rows = buildFaqRows(vertical);
      expect(rows.every(r => r.category !== 'General'), vertical).toBe(true);
    }
  });
});

describe('shape matches what the live tenants already show', () => {
  it('answers are one or two sentences, 100-260 chars', () => {
    const bad = ALL.filter(f => f.answer.length < 100 || f.answer.length > 260)
      .map(f => `${f.answer.length}: ${f.answer.slice(0, 60)}`);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('questions are phrased as a customer would ask', () => {
    expect(ALL.every(f => f.question.trim().endsWith('?'))).toBe(true);
  });

  it('every seeded slug is a real catalog slug for its vertical', () => {
    for (const [vertical, set] of Object.entries(FAQ_SEEDS)) {
      const known = new Set(CATALOG_SLUGS[vertical as keyof typeof CATALOG_SLUGS]);
      for (const slug of Object.keys(set)) {
        expect(known.has(slug), `${vertical}/${slug} is not in the catalog`).toBe(true);
      }
    }
  });

  it('no duplicate question inside one service', () => {
    for (const [vertical, set] of Object.entries(FAQ_SEEDS)) {
      for (const [slug, seeds] of Object.entries(set)) {
        const qs = seeds.map(s => s.question);
        expect(new Set(qs).size, `${vertical}/${slug}`).toBe(qs.length);
      }
    }
  });
});

describe('a tenant gets FAQs for the services it SELECTED', () => {
  const SELECTED_SEVEN = [
    'lawn-fertilization', 'weed-control', 'lawn-aeration',
    'mowing-maintenance', 'seasonal-cleanup', 'landscape-design', 'hardscape-stonework',
  ];

  it('lawn selecting 7 of 17 gets only the seeded ones among those 7', () => {
    const rows = buildFaqRows('lawn', SELECTED_SEVEN);
    expect(new Set(rows.map(r => r.category))).toEqual(new Set([
      'Mowing & Edging', 'Seasonal Cleanup', 'Landscape Design & Installation', 'Hardscape & Stonework',
    ]));
  });

  it('NONE of the ten unselected lawn services appear', () => {
    const rows = buildFaqRows('lawn', SELECTED_SEVEN);
    const unselected = CATALOG_SLUGS.lawn.filter(s => !SELECTED_SEVEN.includes(s));
    expect(unselected).toHaveLength(10);
    const titles = new Set(catalogFor('lawn').filter(s => unselected.includes(s.slug)).map(s => s.title));
    for (const r of rows) expect(titles.has(r.category), `${r.category} leaked in`).toBe(false);
  });

  it('an EMPTY selection seeds nothing — [] is a statement of nothing (S341)', () => {
    expect(buildFaqRows('lawn', [])).toEqual([]);
  });

  it('an ABSENT selection seeds the whole authored catalog — "not stated"', () => {
    expect(new Set(buildFaqRows('lawn').map(r => r.category)).size).toBe(LAWN_SEEDED.length);
  });

  it('an unregistered vertical seeds nothing, never another trade', () => {
    expect(buildFaqRows('medical-aesthetics')).toEqual([]);
    expect(buildFaqRows(null)).toEqual([]);
  });

  // THIS ASSERTION WAS VACUOUS THROUGH buildFaqRows AND A MUTATION CAUGHT IT.
  // buildFaqRows calls catalogFor() first, which returns an empty catalog for an
  // unregistered vertical — so the loop never runs and rows come back [] no
  // matter what faqSeedsFor would have answered. A pest fallback planted inside
  // faqSeedsFor was therefore unreachable from that test and survived. The
  // lookup has to be asserted DIRECTLY, on the function the defect would live in.
  it('faqSeedsFor itself never falls back to another trade', () => {
    expect(faqSeedsFor('medical-aesthetics', 'pest-control')).toEqual([]);
    expect(faqSeedsFor(null, 'pest-control')).toEqual([]);
    expect(faqSeedsFor(undefined, 'mowing-maintenance')).toEqual([]);
    // and a known vertical asked for a slug it does not sell stays empty
    expect(faqSeedsFor('irrigation', 'mowing-maintenance')).toEqual([]);
    expect(faqSeedsFor('lawn', 'roach-control')).toEqual([]);
  });
});

describe('category and ordering', () => {
  it('THE SAME SLUG TAKES ITS VERTICAL’S TITLE', () => {
    const lawn = buildFaqRows('lawn', ['sprinkler-systems']);
    const irr = buildFaqRows('irrigation', ['sprinkler-systems']);
    expect(new Set(lawn.map(r => r.category))).toEqual(new Set(['Irrigation Repair']));
    expect(new Set(irr.map(r => r.category))).toEqual(new Set(['Sprinkler Systems']));
  });

  it('sort_order runs in decades, one per service, ascending', () => {
    const rows = buildFaqRows('pest');
    expect(rows.length).toBeGreaterThan(0);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].sort_order).toBeGreaterThan(rows[i - 1].sort_order);
    }
    const firstOfEach = rows.filter(r => r.sort_order % FAQ_SORT_STRIDE === 0);
    expect(firstOfEach.length).toBe(new Set(rows.map(r => r.category)).size);
  });

  it('rows follow CATALOG order, not selection order', () => {
    const a = buildFaqRows('lawn', ['artificial-turf', 'mowing-maintenance']);
    const b = buildFaqRows('lawn', ['mowing-maintenance', 'artificial-turf']);
    expect(a.map(r => r.category)).toEqual(b.map(r => r.category));
    expect(a[0].category).toBe('Mowing & Edging');
  });
});

describe('provenance', () => {
  it('lawn covers the seven grandview services', () => {
    expect(Object.keys(FAQ_SEEDS.lawn).sort()).toEqual([...LAWN_SEEDED].sort());
  });
  it('pest covers nine species plus the general service page', () => {
    expect(Object.keys(FAQ_SEEDS.pest)).toHaveLength(10);
    expect(faqSeedsFor('pest', 'pest-control').length).toBeGreaterThan(0);
  });
  it('termite is deliberately NOT seeded — dang has no termite FAQs to ground it', () => {
    expect(faqSeedsFor('pest', 'termite-control')).toEqual([]);
    expect(faqSeedsFor('pest', 'termite-inspections')).toEqual([]);
  });
  it('irrigation covers four pls services plus shared turf', () => {
    expect(Object.keys(FAQ_SEEDS.irrigation)).toHaveLength(5);
  });
});
