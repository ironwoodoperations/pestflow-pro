import { describe, it, expect } from 'vitest';
import { resolveLocationHeroTitle, resolveLocationIntro } from './locationCopy';
import { getVerticalCopy } from '../../../../src/shells/_shared/verticalCopy';

// WS2 — "tenant DB override beats vertical preset" is the whole architecture.
// If these fail, a tenant's own copy is being ignored in favour of a preset.

const pest = getVerticalCopy('pest');
const irrigation = getVerticalCopy('irrigation');

describe('DB override BEATS the preset', () => {
  it('hero_title wins over the preset suffix', () => {
    expect(resolveLocationHeroTitle({ hero_title: 'Tyler Sprinkler Repair Experts' }, 'Tyler', irrigation))
      .toBe('Tyler Sprinkler Repair Experts');
  });

  it('intro wins over the preset paragraphs', () => {
    const out = resolveLocationIntro({ intro: 'We have served Tyler since 2017.' }, 'Tyler', irrigation);
    expect(out.paragraphs).toEqual(['We have served Tyler since 2017.']);
    expect(out.fromDb).toBe(true);
    expect(out.paragraphs.join(' ')).not.toContain('Our licensed crews');
  });

  it('holds for pest tenants too — the preset never overrides real DB copy', () => {
    expect(resolveLocationHeroTitle({ hero_title: 'Bug Busters of Austin' }, 'Austin', pest))
      .toBe('Bug Busters of Austin');
    expect(resolveLocationIntro({ intro: 'Custom Austin copy.' }, 'Austin', pest).paragraphs)
      .toEqual(['Custom Austin copy.']);
  });
});

describe('preset fills in only what the DB lacks', () => {
  it('builds the hero title from city + suffix when hero_title is absent', () => {
    expect(resolveLocationHeroTitle({}, 'Tyler', pest)).toBe('Tyler Pest Control');
    expect(resolveLocationHeroTitle({}, 'Tyler', irrigation)).toBe('Tyler Irrigation & Drainage');
  });

  it('substitutes {city} into the preset paragraphs', () => {
    const out = resolveLocationIntro({}, 'Longview', irrigation);
    expect(out.fromDb).toBe(false);
    expect(out.paragraphs).toHaveLength(1);
    expect(out.paragraphs[0]).toContain('Longview');
    expect(out.paragraphs[0]).not.toContain('{city}');
  });

  it('pest keeps its two historical paragraphs verbatim', () => {
    const out = resolveLocationIntro({}, 'Tyler', pest);
    expect(out.paragraphs).toEqual([
      "Our licensed technicians provide comprehensive pest control services throughout Tyler. Whether you're dealing with ants, roaches, rodents, termites, or mosquitoes, we have the solution.",
      'We combine local knowledge with professional-grade treatments to deliver lasting results for Tyler homeowners and businesses.',
    ]);
  });
});

describe('whitespace-only DB values do not count as set', () => {
  it('falls back to the preset for an intro of spaces', () => {
    const out = resolveLocationIntro({ intro: '   ' }, 'Tyler', pest);
    expect(out.fromDb).toBe(false);
    expect(out.paragraphs).toHaveLength(2);
  });
});

describe('paragraph-spacing provenance (byte-identical markup)', () => {
  // The original markup gave a DB intro mb-4 and only the LAST preset paragraph
  // mb-6. `fromDb` is what lets the caller keep that exact distinction.
  it('reports fromDb so the caller can preserve the original classes', () => {
    expect(resolveLocationIntro({ intro: 'x' }, 'Tyler', pest).fromDb).toBe(true);
    expect(resolveLocationIntro({}, 'Tyler', pest).fromDb).toBe(false);
  });
});
