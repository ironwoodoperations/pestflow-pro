import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  ModernProTestimonials,
  selectTestimonials,
  type Testimonial,
} from './ModernProTestimonials';
import {
  normalizeLogoHeightPx,
  LOGO_HEIGHT_DEFAULT_PX,
  LOGO_HEIGHT_MIN_PX,
  LOGO_HEIGHT_MAX_PX,
} from '../../../../../shared/lib/tenant/types';

// S311 — modern-pro homepage testimonial selection.
//
// The component did `testimonials.slice(0, 3)` on a list getTestimonials()
// ordered by created_at DESC alone. Live on 2026-08-31, pls held 50 rows
// imported from Google that ALL share one created_at, so the head of the list
// was a 50-way tie with no defined order, and 10 of those 50 have an empty
// review_text. `featured` was never read at all.

const render = (testimonials: Testimonial[]) =>
  renderToStaticMarkup(createElement(ModernProTestimonials, { testimonials }));

const names = (rows: Testimonial[]) => selectTestimonials(rows).map((t) => t.author_name);

// A deterministic shuffle, so a failure reproduces instead of flaking.
function shuffle<T>(input: T[], seed: number): T[] {
  const out = [...input];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

describe('THE POINT OF THIS PART: the 50-identical-timestamp case is order-independent', () => {
  // Mirrors pls's Google import: every row carries the same created_at, so the
  // database is free to return them in any order and did not promise one.
  // Ratings and text lengths repeat heavily, so `id` is what actually settles
  // most of these comparisons — which is exactly why it is in the comparator.
  const bulk: Testimonial[] = Array.from({ length: 50 }, (_, i) => ({
    id: `g-${String(i).padStart(2, '0')}`,
    author_name: `Google Reviewer ${i}`,
    // 10 of the 50 have no review text, as live.
    review_text: i % 5 === 0 ? '' : 'Great service, showed up on time.',
    rating: 4 + (i % 2),
    featured: false,
  }));

  it('returns the SAME three rows under 25 different input orders', () => {
    const canonical = names(bulk);
    expect(canonical).toHaveLength(3);
    for (let seed = 1; seed <= 25; seed++) {
      expect(names(shuffle(bulk, seed))).toEqual(canonical);
    }
  });

  it('renders BYTE-IDENTICAL markup under a shuffled input', () => {
    expect(render(shuffle(bulk, 99))).toBe(render(bulk));
  });

  it('FAILS the way the old code did: slice(0,3) on a shuffled input does not', () => {
    // Guards the test itself. If this ever passes, the fixture has stopped
    // exercising the tie and the assertions above are vacuous.
    const oldWay = (rows: Testimonial[]) => rows.slice(0, 3).map((t) => t.author_name);
    expect(oldWay(shuffle(bulk, 99))).not.toEqual(oldWay(bulk));
  });

  it('never selects a row with an empty review_text', () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const t of selectTestimonials(shuffle(bulk, seed))) {
        expect(t.review_text.trim()).not.toBe('');
      }
    }
  });
});

describe('empty review_text is dropped, not rendered', () => {
  it('drops whitespace-only and null text, and never emits an empty quote', () => {
    const rows = [
      { id: 'e1', author_name: 'M Morrison', review_text: '', rating: 5 },
      { id: 'e2', author_name: 'Grant Smith', review_text: '   \n\t ', rating: 3 },
      // The column is nullable; PostgREST hands back null, not ''.
      { id: 'e3', author_name: 'Bob Liszewski', review_text: null as unknown as string, rating: 5 },
      { id: 'k1', author_name: 'Real Customer', review_text: 'They fixed the zone valve.', rating: 5 },
    ];
    expect(names(rows)).toEqual(['Real Customer']);
    expect(render(rows)).not.toContain('“”');
  });

  it('renders NOTHING when every row is empty, rather than a heading over an empty grid', () => {
    const allEmpty = [
      { id: 'e1', author_name: 'A', review_text: '', rating: 5 },
      { id: 'e2', author_name: 'B', review_text: '  ', rating: 5 },
    ];
    expect(selectTestimonials(allEmpty)).toEqual([]);
    expect(render(allEmpty)).toBe('');
    // The pre-S311 early exit tested the INPUT length, so this input would have
    // rendered the TESTIMONIALS heading above three blank cards.
    expect(render(allEmpty)).not.toContain('What Our Customers Say');
  });

  it('still renders nothing for a tenant with no rows at all (apex-protect)', () => {
    expect(render([])).toBe('');
  });
});

describe('featured rows win, which is the behaviour that was missing entirely', () => {
  // pls: 3 curated client_site rows created 2026-08-20, sorting BELOW a bulk
  // import created 2026-08-24, so they never rendered.
  const rows: Testimonial[] = [
    { id: 'g-1', author_name: 'Bulk Newer 1', review_text: 'Newer import.', rating: 5, featured: false },
    { id: 'g-2', author_name: 'Bulk Newer 2', review_text: 'Newer import.', rating: 5, featured: false },
    { id: 'g-3', author_name: 'Bulk Newer 3', review_text: 'Newer import.', rating: 5, featured: false },
    { id: 'c-1', author_name: 'Nancy Bentley Bowen', review_text: 'A'.repeat(384), rating: 5, featured: true },
    { id: 'c-2', author_name: 'Larry Kellam', review_text: 'B'.repeat(176), rating: 5, featured: true },
    { id: 'c-3', author_name: 'Jay D. Wilson', review_text: 'C'.repeat(85), rating: 5, featured: true },
  ];

  it('selects all three curated rows ahead of a newer bulk import', () => {
    expect(names(rows)).toEqual(['Nancy Bentley Bowen', 'Larry Kellam', 'Jay D. Wilson']);
  });

  it('treats only the literal boolean true as featured', () => {
    // settings and imported rows are untrusted; a truthy string must not
    // promote a row over a genuinely curated one.
    const spoofed = [
      { id: 'x', author_name: 'Spoofed', review_text: 'Text.', rating: 5, featured: 'true' as unknown as boolean },
      { id: 'y', author_name: 'Curated', review_text: 'Text.', rating: 5, featured: true },
    ];
    expect(names(spoofed)[0]).toBe('Curated');
  });

  it('orders within a group by rating DESC, then text length DESC, then id ASC', () => {
    const tied: Testimonial[] = [
      { id: 'b', author_name: 'SameEverything B', review_text: 'xx', rating: 5 },
      { id: 'a', author_name: 'SameEverything A', review_text: 'xx', rating: 5 },
      { id: 'c', author_name: 'Longer Text', review_text: 'xxxx', rating: 5 },
      { id: 'd', author_name: 'Lower Rating', review_text: 'xxxxxxxx', rating: 4 },
    ];
    expect(names(tied)).toEqual(['Longer Text', 'SameEverything A', 'SameEverything B']);
  });

  it('does not mutate the array it was given', () => {
    const input = [...rows];
    const before = input.map((t) => t.id);
    selectTestimonials(input);
    expect(input.map((t) => t.id)).toEqual(before);
  });

  it('sorts a non-numeric rating as 0 instead of going order-dependent', () => {
    const junk: Testimonial[] = [
      { id: 'n1', author_name: 'NaN rating', review_text: 'Text.', rating: 'abc' as unknown as number },
      { id: 'n2', author_name: 'Null rating', review_text: 'Text.', rating: null as unknown as number },
      { id: 'n3', author_name: 'Real rating', review_text: 'Text.', rating: 5 },
    ];
    expect(names(junk)[0]).toBe('Real rating');
    for (let seed = 1; seed <= 10; seed++) {
      expect(names(shuffle(junk, seed))).toEqual(names(junk));
    }
  });
});

describe('BYTE-IDENTICAL to the pre-S311 render for an unaffected tenant', () => {
  // Captured by RENDERING ModernProTestimonials as it stood on main at bf2d5b6,
  // not hand-written. Input: zero featured rows, distinct created_at, and rows
  // already in the order the new comparator produces — the case where the two
  // implementations must agree character for character.
  const PRE_S311 =
    "<section style=\"background:var(--color-bg-cta)\" class=\"py-16 px-6\"><div class=\"max-w-5xl mx-auto\"><div class=\"text-center mb-10\"><p class=\"text-xs font-semibold uppercase tracking-widest mb-2\" style=\"color:#ffffff\">TESTIMONIALS</p><h2 class=\"text-3xl font-bold\" style=\"color:#ffffff\">What Our Customers Say</h2></div><div class=\"grid grid-cols-1 md:grid-cols-3 gap-6\"><div class=\"rounded-2xl p-6\" style=\"background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15)\"><div class=\"text-lg mb-3\" style=\"color:#fbbf24\">★★★★★</div><p class=\"text-sm italic leading-relaxed mb-4\" style=\"color:#ffffff\">“Longer text here that is quite long indeed.”</p><p class=\"font-semibold\" style=\"color:#ffffff\">Ada L.</p></div><div class=\"rounded-2xl p-6\" style=\"background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15)\"><div class=\"text-lg mb-3\" style=\"color:#fbbf24\">★★★★★</div><p class=\"text-sm italic leading-relaxed mb-4\" style=\"color:#ffffff\">“Shorter text.”</p><p class=\"font-semibold\" style=\"color:#ffffff\">Bo N.</p></div><div class=\"rounded-2xl p-6\" style=\"background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15)\"><div class=\"text-lg mb-3\" style=\"color:#fbbf24\">★★★★☆</div><p class=\"text-sm italic leading-relaxed mb-4\" style=\"color:#ffffff\">“Four star review text.”</p><p class=\"font-semibold\" style=\"color:#ffffff\">Cy R.</p></div></div></div></section>";

  const CANONICAL_ORDER: Testimonial[] = [
    { id: 'a1', author_name: 'Ada L.', rating: 5, review_text: 'Longer text here that is quite long indeed.' },
    { id: 'a2', author_name: 'Bo N.', rating: 5, review_text: 'Shorter text.' },
    { id: 'a3', author_name: 'Cy R.', rating: 4, review_text: 'Four star review text.' },
    { id: 'a4', author_name: 'Di S.', rating: 3, review_text: 'Three star.' },
  ];

  it('the recorded baseline is a real render — an empty one makes the compare vacuous', () => {
    expect(PRE_S311.length).toBeGreaterThan(500);
    expect(PRE_S311).toContain('What Our Customers Say');
    expect(PRE_S311).toContain('Ada L.');
  });

  it('emits the original markup exactly, character for character', () => {
    expect(render(CANONICAL_ORDER)).toBe(PRE_S311);
  });

  it('also preserves the star clamp for an out-of-range rating', () => {
    const wild = [{ id: 'w', author_name: 'W', review_text: 'Text.', rating: 99 }];
    expect(render(wild)).toContain('★★★★★');
    expect(render(wild)).not.toContain('☆');
  });

  // Stated plainly rather than papered over: selection is no longer
  // created_at DESC, so a tenant with NO featured rows whose rows are not
  // already in canonical order DOES get a different three than before. On
  // 2026-08-31 that is `dang`, which has 3 featured rows and so changes
  // regardless. This pins the intended behaviour; it is not a regression.
  it('a zero-featured tenant NOT already in canonical order is reordered, by design', () => {
    const byCreatedAtDesc: Testimonial[] = [
      { id: 'z1', author_name: 'Newest, three stars', review_text: 'Short.', rating: 3 },
      { id: 'z2', author_name: 'Middle, five stars', review_text: 'A longer, more useful review.', rating: 5 },
      { id: 'z3', author_name: 'Oldest, four stars', review_text: 'Fine work.', rating: 4 },
    ];
    expect(byCreatedAtDesc.slice(0, 3).map((t) => t.author_name)[0]).toBe('Newest, three stars');
    expect(names(byCreatedAtDesc)[0]).toBe('Middle, five stars');
  });
});

describe('S311 Part B — per-tenant nav logo height', () => {
  it('defaults to the historical 40px when the tenant has no value', () => {
    expect(LOGO_HEIGHT_DEFAULT_PX).toBe(40);
    expect(normalizeLogoHeightPx(undefined)).toBe(40);
    expect(normalizeLogoHeightPx(null)).toBe(40);
  });

  it('accepts a number and a numeric string, since branding is JSONB', () => {
    expect(normalizeLogoHeightPx(32)).toBe(32);
    expect(normalizeLogoHeightPx('32')).toBe(32);
    expect(normalizeLogoHeightPx(' 32 ')).toBe(32);
    expect(normalizeLogoHeightPx(31.6)).toBe(32);
  });

  it('falls back to 40 on anything non-numeric', () => {
    for (const junk of ['', '   ', 'tall', {}, [], true, false, NaN, Infinity, -Infinity]) {
      expect(normalizeLogoHeightPx(junk)).toBe(LOGO_HEIGHT_DEFAULT_PX);
    }
  });

  it('clamps to a range the 64px nav row can actually contain', () => {
    expect(normalizeLogoHeightPx(0)).toBe(LOGO_HEIGHT_MIN_PX);
    expect(normalizeLogoHeightPx(-200)).toBe(LOGO_HEIGHT_MIN_PX);
    expect(normalizeLogoHeightPx(5000)).toBe(LOGO_HEIGHT_MAX_PX);
    expect(LOGO_HEIGHT_MAX_PX).toBe(64); // Tailwind h-16 on the nav row
  });

  it('is idempotent, so resolve-time and render-time normalization agree', () => {
    for (const v of [undefined, null, 32, '32', 5000, -1, 'junk']) {
      expect(normalizeLogoHeightPx(normalizeLogoHeightPx(v))).toBe(normalizeLogoHeightPx(v));
    }
  });
});
