import { describe, it, expect } from 'vitest';
import { PEST_CONTENT_MAP } from './pestContent';
import { IRRIGATION_CONTENT_MAP } from './irrigationContent';
import { getServiceEntry, resolveVertical } from './serviceEntry';

// S-PLS-5 / D1 — the pest path must be provably unchanged, and the irrigation
// vertical must be a union-by-selection, never a mutation of the pest maps.

describe('getServiceEntry — pest path identity', () => {
  it('returns the SAME object reference as PEST_CONTENT_MAP for every pest slug', () => {
    for (const slug of Object.keys(PEST_CONTENT_MAP)) {
      expect(getServiceEntry('pest', slug)).toBe(PEST_CONTENT_MAP[slug]);
    }
  });

  it('returns undefined for irrigation slugs on the pest vertical (they route to the location branch, as today)', () => {
    for (const slug of Object.keys(IRRIGATION_CONTENT_MAP)) {
      expect(getServiceEntry('pest', slug)).toBeUndefined();
    }
  });
});

describe('getServiceEntry — irrigation vertical', () => {
  it('resolves the four irrigation slugs', () => {
    for (const slug of Object.keys(IRRIGATION_CONTENT_MAP)) {
      expect(getServiceEntry('irrigation', slug)).toBe(IRRIGATION_CONTENT_MAP[slug]);
    }
  });

  it('does not resolve pest slugs (no pest page can render on an irrigation tenant via this accessor)', () => {
    expect(getServiceEntry('irrigation', 'ant-control')).toBeUndefined();
    expect(getServiceEntry('irrigation', 'pest-control')).toBeUndefined();
  });
});

describe('vertical separation invariants', () => {
  it('the two slug sets are disjoint', () => {
    const pest = new Set(Object.keys(PEST_CONTENT_MAP));
    for (const slug of Object.keys(IRRIGATION_CONTENT_MAP)) {
      expect(pest.has(slug)).toBe(false);
    }
  });

  it('every irrigation entry satisfies the PestEntry contract with a matching slug field', () => {
    for (const [slug, entry] of Object.entries(IRRIGATION_CONTENT_MAP)) {
      expect(entry.slug).toBe(slug);
      expect(entry.displayName.length).toBeGreaterThan(0);
      expect(entry.signs.length).toBeGreaterThan(0);
      expect(entry.treatment.length).toBeGreaterThan(0);
      expect(entry.metaTitle.length).toBeGreaterThan(0);
      expect(entry.metaDescription.length).toBeGreaterThan(0);
    }
  });

  it('§0.1: "lawn" appears nowhere in irrigation content', () => {
    const all = JSON.stringify(IRRIGATION_CONTENT_MAP).toLowerCase();
    expect(all.includes('lawn')).toBe(false);
  });
});

describe('resolveVertical', () => {
  // S-PLS-6: the explicit key is the routing key of record.
  it('explicit vertical wins over a contradicting industry string, both directions', () => {
    expect(resolveVertical({ vertical: 'irrigation', industry: 'Pest Control' })).toBe('irrigation');
    expect(resolveVertical({ vertical: 'pest', industry: 'irrigation and sprinkler...' })).toBe('pest');
  });

  it('invalid explicit values fall through to the substring fallback', () => {
    expect(resolveVertical({ vertical: 'Irrigation', industry: 'Pest Control' })).toBe('pest');
    expect(resolveVertical({ vertical: 'IRRIGATION', industry: 'irrigation work' })).toBe('irrigation');
    expect(resolveVertical({ vertical: 'landscaping', industry: 'Pest Control' })).toBe('pest');
    expect(resolveVertical({ vertical: null, industry: 'irrigation work' })).toBe('irrigation');
  });

  it('the §7 industry string resolves to irrigation', () => {
    expect(resolveVertical({ industry: 'irrigation and sprinkler system installation and repair, yard drainage and french drains, lake and pond pump systems, sod and grading — East Texas' })).toBe('irrigation');
  });

  it('pest tenants and absent/unrecognized values resolve to pest (historical behavior)', () => {
    expect(resolveVertical({ industry: 'Pest Control' })).toBe('pest');
    expect(resolveVertical({ industry: 'Medical Aesthetics' })).toBe('pest');
    expect(resolveVertical({ industry: null })).toBe('pest');
    expect(resolveVertical({})).toBe('pest');
  });
});
