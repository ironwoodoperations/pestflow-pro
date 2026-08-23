import { describe, it, expect } from 'vitest';
import { getVerticalCopy } from './verticalCopy';
import { VERTICALS } from './serviceEntry';

// PR A — the preset registry. Pest values are the CURRENT production strings;
// if any assertion here fails, live pest tenants have moved.

describe('getVerticalCopy — pest is verbatim production copy', () => {
  it('returns the exact strings rendered today', () => {
    // Sources, diffed character by character:
    //   [service]/page.tsx:95            `${city} Pest Control`
    //   _components/sections/Process.tsx:15
    //   service-area/page.tsx:25
    //   layout.tsx:42
    expect(getVerticalCopy('pest')).toEqual({
      locationHeroSuffix: 'Pest Control',
      processHeading: 'How Our Pest Control Process Works',
      serviceAreaStrapline: 'Professional pest control in your community and surrounding areas.',
      metadataFallbackDesc: 'professional pest control services',
    });
  });

  it('keeps the strapline trailing period — it is part of the rendered sentence', () => {
    expect(getVerticalCopy('pest').serviceAreaStrapline.endsWith('areas.')).toBe(true);
  });

  it('metadataFallbackDesc is the tail only — the em dash lives at the call site', () => {
    const desc = getVerticalCopy('pest').metadataFallbackDesc;
    expect(desc).toBe('professional pest control services');
    expect(desc).not.toContain('—');
    expect(desc.trim()).toBe(desc);
  });
});

describe('getVerticalCopy — irrigation', () => {
  it('returns the irrigation preset', () => {
    expect(getVerticalCopy('irrigation')).toEqual({
      locationHeroSuffix: 'Irrigation & Drainage',
      processHeading: 'How Our Irrigation Process Works',
      serviceAreaStrapline: 'Professional irrigation and drainage in your community and surrounding areas.',
      metadataFallbackDesc: 'professional irrigation and drainage services',
    });
  });

  it('carries no pest vocabulary whatsoever', () => {
    const serialized = JSON.stringify(getVerticalCopy('irrigation'));
    expect(serialized).not.toMatch(/pest|termite|mosquito|rodent|bed bug|ant control/i);
  });

  it('§0.1: says nothing about "lawn" — irrigation is a separate vertical', () => {
    expect(JSON.stringify(getVerticalCopy('irrigation')).toLowerCase()).not.toContain('lawn');
  });
});

describe('getVerticalCopy — registered but copyless verticals FAIL LOUDLY', () => {
  it('throws for pool, naming the vertical', () => {
    expect(() => getVerticalCopy('pool')).toThrow(/pool/);
  });

  it('throws rather than silently serving pest copy — the whole point', () => {
    for (const v of ['lawn', 'pool', 'hvac', 'roof', 'trailer'] as const) {
      expect(() => getVerticalCopy(v)).toThrow();
      // and specifically NOT by returning something pest-shaped
      let returned: unknown = 'did-not-throw';
      try { returned = getVerticalCopy(v); } catch { returned = 'threw'; }
      expect(returned).toBe('threw');
    }
  });

  it('the error points at the file to edit', () => {
    expect(() => getVerticalCopy('hvac')).toThrow(/verticalCopy\.ts/);
  });
});

describe('preset immutability', () => {
  it('presets are frozen — they are handed out by reference', () => {
    const pest = getVerticalCopy('pest');
    expect(Object.isFrozen(pest)).toBe(true);
    expect(() => { (pest as { processHeading: string }).processHeading = 'Corrupted'; }).toThrow();
  });

  it('a mutation attempt cannot leak into a later read', () => {
    try { (getVerticalCopy('pest') as { locationHeroSuffix: string }).locationHeroSuffix = 'X'; } catch { /* frozen */ }
    expect(getVerticalCopy('pest').locationHeroSuffix).toBe('Pest Control');
  });
});

describe('registry / copy coverage is deliberate, not accidental', () => {
  it('exactly pest and irrigation have copy today', () => {
    const withCopy = VERTICALS.filter((v) => {
      try { getVerticalCopy(v); return true; } catch { return false; }
    });
    expect(withCopy).toEqual(['pest', 'irrigation']);
  });
});
