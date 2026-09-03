import { describe, it, expect } from 'vitest';
import { getVerticalCopy, resolveVerticalCopy } from './verticalCopy';
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
    // toMatchObject, not toEqual: PR B added eleven more slots. This assertion
    // exists to lock the ORIGINAL four against drift, which a subset check does
    // exactly; verticalCopyPresets.test.ts locks the full set.
    expect(getVerticalCopy('pest')).toMatchObject({
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
    expect(getVerticalCopy('irrigation')).toMatchObject({
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

  // S323 PR A: 'lawn' left this list — it now HAS copy. Everything the list
  // asserts is unchanged for the four that remain.
  it('throws rather than silently serving pest copy — the whole point', () => {
    for (const v of ['pool', 'hvac', 'roof', 'trailer'] as const) {
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
    expect(withCopy).toEqual(['pest', 'irrigation', 'lawn']);
  });
});

// ── S293 PR A ────────────────────────────────────────────────────────────────
//
// This block lives HERE, not in shared/lib/seoSchema.test.ts where it was first
// written, because verticals.test.ts caught the import: shared/lib must never
// depend on src/. The guard was right and the test moved rather than the guard
// being relaxed — a test file is a real dependency edge.
describe('S293 — the metadata description tail, same defect, same layout', () => {
  // layout.tsx generateMetadata built its fallback from
  // getVerticalCopy(resolveVertical(tenant)). vita-glow has vertical NULL and
  // NO seo.meta_description, so the fallback FIRES and the indexable meta
  // description read "…professional pest control services".
  it('recorded verticals still resolve their own copy', () => {
    expect(resolveVerticalCopy('pest')?.metadataFallbackDesc).toBe('professional pest control services')
    expect(resolveVerticalCopy('irrigation')?.metadataFallbackDesc).toBe('professional irrigation and drainage services')
  })

  it('an unrecorded vertical resolves to NULL, so the caller omits the tail', () => {
    // S323 PR A: 'lawn' was the copyless example here and now has copy, so it
    // is replaced by 'pool' rather than dropped — the case still needs a
    // registered-but-copyless key alongside the unrecorded ones.
    for (const v of [null, undefined, '', 'Medical Aesthetics', 'pool']) {
      expect(resolveVerticalCopy(v as string | null | undefined), `for ${JSON.stringify(v)}`).toBeNull()
    }
  })

  it('lawn resolves its OWN copy, and names lawn care rather than pest', () => {
    // The S323 addition, asserted on the same helper the defect lived in.
    expect(resolveVerticalCopy('lawn')?.metadataFallbackDesc)
      .toBe('professional lawn care and landscape maintenance')
  })

  // The assembled string, not just the helper. A helper-only assertion passes
  // while the string reaching the page is still wrong — settled practice here.
  it('THE ASSEMBLED DESCRIPTION names no trade when none is recorded', () => {
    const build = (vertical: string | null, businessName: string, stored?: string) => {
      const copy = resolveVerticalCopy(vertical)
      return stored || (copy ? `${businessName} — ${copy.metadataFallbackDesc}` : businessName)
    }
    expect(build(null, 'Vita Glow Wellness')).toBe('Vita Glow Wellness')
    expect(build(null, 'Vita Glow Wellness')).not.toMatch(/pest/i)
    expect(build('pest', 'Dang Pest Control')).toBe('Dang Pest Control — professional pest control services')
    expect(build('irrigation', 'PLS')).toBe('PLS — professional irrigation and drainage services')
    // a stored description always wins, for every vertical
    expect(build(null, 'Vita Glow Wellness', 'Real copy.')).toBe('Real copy.')
  })
})
