import { describe, it, expect } from 'vitest';
import { resolveHeroImage } from './heroImage';

// S295 — this resolver had NO tests. It has five rules, one of them
// undocumented, and it is the single decision behind every hero on the site.

const MASTER = 'https://cdn.example/master.jpg';
const PAGE = 'https://cdn.example/page.jpg';
const LEGACY = 'https://cdn.example/legacy.jpg';

describe('rule 2 — the page hero wins, which is the pls case', () => {
  it('returns page_hero_image_url when the apply-to-all flag is off', () => {
    expect(resolveHeroImage(
      { page_hero_image_url: PAGE },
      { master_hero_image_url: MASTER, apply_hero_to_all_pages: false },
    )).toBe(PAGE);
  });

  it('the page hero beats the master even with both present', () => {
    expect(resolveHeroImage({ page_hero_image_url: PAGE }, { master_hero_image_url: MASTER })).toBe(PAGE);
  });
});

describe('rule 1 — apply-to-all forces the master', () => {
  it('returns the master when the flag is on', () => {
    expect(resolveHeroImage(
      { page_hero_image_url: PAGE },
      { master_hero_image_url: MASTER, apply_hero_to_all_pages: true },
    )).toBe(MASTER);
  });

  it('SHORT-CIRCUITS TO NULL when the flag is on and the master is empty', () => {
    // Undocumented: the comment above the function describes only the positive
    // case, so this branch reads like a fall-through and is not one. A page
    // hero that exists is DISCARDED here. Filed in S295's investigation as a
    // latent hazard — no live tenant is in this state — and pinned by this test
    // so the behaviour is at least known rather than surprising.
    expect(resolveHeroImage({ page_hero_image_url: PAGE }, { master_hero_image_url: '', apply_hero_to_all_pages: true })).toBeNull();
    expect(resolveHeroImage({ page_hero_image_url: PAGE }, { apply_hero_to_all_pages: true })).toBeNull();
    expect(resolveHeroImage({ page_hero_image_url: PAGE }, { master_hero_image_url: '   ', apply_hero_to_all_pages: true })).toBeNull();
  });
});

describe('rules 3, 4, 5 — the fallback chain', () => {
  it('rule 3: the master when there is no page hero', () => {
    expect(resolveHeroImage({}, { master_hero_image_url: MASTER })).toBe(MASTER);
    expect(resolveHeroImage(null, { master_hero_image_url: MASTER })).toBe(MASTER);
  });

  it('rule 4: the legacy content.image_url last', () => {
    expect(resolveHeroImage({ image_url: LEGACY }, null)).toBe(LEGACY);
    expect(resolveHeroImage({ image_url: LEGACY }, { master_hero_image_url: MASTER })).toBe(MASTER);
  });

  it('rule 5: null when there is nothing at all', () => {
    for (const [c, h] of [[null, null], [undefined, undefined], [{}, {}], [{ page_hero_image_url: '' }, { master_hero_image_url: '' }]] as const) {
      expect(resolveHeroImage(c, h)).toBeNull();
    }
  });

  it('whitespace-only strings are not images', () => {
    expect(resolveHeroImage({ page_hero_image_url: '  ' }, { master_hero_image_url: '  ' })).toBeNull();
  });

  it('the full precedence order is page > master > legacy', () => {
    const all = { page_hero_image_url: PAGE, image_url: LEGACY };
    expect(resolveHeroImage(all, { master_hero_image_url: MASTER })).toBe(PAGE);
    expect(resolveHeroImage({ image_url: LEGACY }, { master_hero_image_url: MASTER })).toBe(MASTER);
    expect(resolveHeroImage({ image_url: LEGACY }, null)).toBe(LEGACY);
  });
});

describe('the pls case end to end', () => {
  it('the exact live shape resolves to the page hero', () => {
    // page_content.drainage.page_hero_image_url populated,
    // hero_media.master_hero_image_url populated,
    // branding.apply_hero_to_all_pages false (merged in by getHeroMedia).
    expect(resolveHeroImage(
      { page_hero_image_url: PAGE, image_url: null },
      { master_hero_image_url: MASTER, apply_hero_to_all_pages: false },
    )).toBe(PAGE);
  });
});
