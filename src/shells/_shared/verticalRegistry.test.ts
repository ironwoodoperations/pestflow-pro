import { describe, it, expect, vi, afterEach } from 'vitest';
import { VERTICALS, isVertical, resolveVertical, getServiceEntry } from './serviceEntry';
import { PEST_CONTENT_MAP } from './pestContent';

// PR A — the registry opens `Vertical` without moving a single live tenant.
// Dang is live, has business_info.vertical = null and industry 'Pest Control',
// and resolves through the industry fallback. That path is load-bearing.

afterEach(() => { vi.restoreAllMocks(); });

describe('vertical registry', () => {
  it('registers exactly the seven agreed keys', () => {
    expect([...VERTICALS]).toEqual(['pest', 'irrigation', 'lawn', 'pool', 'hvac', 'roof', 'trailer']);
  });

  it('keeps irrigation and lawn as separate keys, never aliases', () => {
    expect(VERTICALS).toContain('irrigation');
    expect(VERTICALS).toContain('lawn');
    expect(new Set(VERTICALS).size).toBe(VERTICALS.length);
  });

  it('is frozen — the routing key set cannot be mutated at runtime', () => {
    expect(Object.isFrozen(VERTICALS)).toBe(true);
    expect(() => { (VERTICALS as unknown as string[]).push('bogus'); }).toThrow();
  });

  it('isVertical admits only exact registered keys', () => {
    for (const v of VERTICALS) expect(isVertical(v)).toBe(true);
    // Case, prose and non-strings are all rejected — a routing key must not
    // depend on how someone typed it.
    for (const junk of ['Irrigation', 'PEST', 'irrigation ', 'plumbing', '', null, undefined, 7, {}]) {
      expect(isVertical(junk)).toBe(false);
    }
  });
});

describe('resolveVertical — precedence', () => {
  it('1. explicit registered key wins over industry prose', () => {
    expect(resolveVertical({ vertical: 'irrigation', industry: 'Pest Control' })).toBe('irrigation');
    expect(resolveVertical({ vertical: 'pest', industry: 'irrigation and drainage' })).toBe('pest');
  });

  it('1. explicit key engages for the newly registered verticals too', () => {
    expect(resolveVertical({ vertical: 'lawn', industry: null })).toBe('lawn');
    expect(resolveVertical({ vertical: 'pool', industry: null })).toBe('pool');
  });

  it('2. a JUNK vertical falls through to the industry check — not straight to pest', () => {
    // The distinguishing case: if junk short-circuited to pest, an irrigation
    // tenant with a typo'd key would silently serve pest pages.
    expect(resolveVertical({ vertical: 'Irrigation', industry: 'irrigation and sprinklers' })).toBe('irrigation');
    expect(resolveVertical({ vertical: 'nonsense', industry: 'yard irrigation services' })).toBe('irrigation');
  });

  it('3. DANG-SHAPED tenant (vertical null, industry "Pest Control") still resolves pest', () => {
    expect(resolveVertical({ vertical: null, industry: 'Pest Control' })).toBe('pest');
  });

  it('3. absent everything resolves pest, the historical default', () => {
    expect(resolveVertical({})).toBe('pest');
    expect(resolveVertical({ vertical: null, industry: null })).toBe('pest');
  });

  it('does NOT widen the industry scan to other registered keys', () => {
    // A pest tenant whose freeform prose mentions lawn or pools must stay pest.
    // Widening step 2 is precisely the silent movement this PR forbids.
    expect(resolveVertical({ vertical: null, industry: 'Pest Control and lawn treatments' })).toBe('pest');
    expect(resolveVertical({ vertical: null, industry: 'pool and spa service' })).toBe('pest');
  });
});

describe('resolveVertical — dev warning on fallback', () => {
  it('warns when a tenant resolves via the fallback path', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveVertical({ vertical: null, industry: 'unique-industry-for-warn-test' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('resolveVertical');
  });

  it('does NOT warn when an explicit registered key is present', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveVertical({ vertical: 'irrigation', industry: 'anything at all' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns only once per distinct tenant shape, so it cannot bury itself', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const shape = { vertical: null, industry: 'repeated-industry-for-dedupe-test' };
    resolveVertical(shape);
    resolveVertical(shape);
    resolveVertical(shape);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('opening the registry did not disturb service lookup', () => {
  it('pest still returns the SAME object reference from PEST_CONTENT_MAP', () => {
    for (const slug of Object.keys(PEST_CONTENT_MAP)) {
      expect(getServiceEntry('pest', slug)).toBe(PEST_CONTENT_MAP[slug]);
    }
  });

  it('a registered vertical with no content map resolves no service entries', () => {
    // Not a silent pest page: getServiceEntry falls to the pest map by slug, and
    // no pest slug is reachable for a tenant whose own page_content lacks it.
    expect(getServiceEntry('pool', 'no-such-slug')).toBeUndefined();
  });
});
