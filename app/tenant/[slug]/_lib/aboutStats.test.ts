import { describe, it, expect } from 'vitest';
import { resolveAboutStats, yearsOperating, AUTO_YEARS_OPERATING, MAX_ABOUT_STATS } from './aboutStats';

// WS7 — the documented invariant break. The old component hardcoded four tiles,
// two fabricated and one inventing fifteen years for any tenant with no
// founded_year. The governing rule now: render nothing rather than invent.

const YEAR = 2026;

describe('no stats configured renders nothing', () => {
  it('absent key / undefined', () => expect(resolveAboutStats(undefined, '2017', YEAR)).toEqual([]));
  it('null', () => expect(resolveAboutStats(null, '2017', YEAR)).toEqual([]));
  it('empty array', () => expect(resolveAboutStats([], '2017', YEAR)).toEqual([]));
  it('a non-array (malformed settings value)', () => {
    expect(resolveAboutStats({ stats: 'nope' }, '2017', YEAR)).toEqual([]);
    expect(resolveAboutStats('nope', '2017', YEAR)).toEqual([]);
  });

  it('NEVER substitutes a fallback tile', () => {
    const out = JSON.stringify(resolveAboutStats([], undefined, YEAR));
    expect(out).not.toMatch(/5,000|24\/7|15\+|Guarantee|Properties protected|Response window/);
  });
});

describe('auto:years_operating', () => {
  it('computes from founded_year', () => {
    expect(resolveAboutStats([{ value: AUTO_YEARS_OPERATING, label: 'Years operating' }], '2017', YEAR))
      .toEqual([{ value: '9+', label: 'Years operating' }]);
  });

  it('DROPS the tile when founded_year is absent — never substitutes a number', () => {
    for (const missing of [undefined, null, '']) {
      expect(resolveAboutStats([{ value: AUTO_YEARS_OPERATING, label: 'Years operating' }], missing, YEAR)).toEqual([]);
    }
  });

  it('drops rather than showing a nonsense span', () => {
    expect(yearsOperating('notayear', YEAR)).toBeNull();  // unparseable
    expect(yearsOperating('2026', YEAR)).toBeNull();       // zero years
    expect(yearsOperating('2030', YEAR)).toBeNull();       // founded in the future
    expect(resolveAboutStats([{ value: AUTO_YEARS_OPERATING, label: 'Years' }], '2030', YEAR)).toEqual([]);
  });

  it('a dropped auto tile does not consume one of the four slots', () => {
    const stats = [
      { value: AUTO_YEARS_OPERATING, label: 'Years operating' },
      { value: 'A', label: 'one' }, { value: 'B', label: 'two' },
      { value: 'C', label: 'three' }, { value: 'D', label: 'four' },
    ];
    expect(resolveAboutStats(stats, undefined, YEAR).map((s) => s.label))
      .toEqual(['one', 'two', 'three', 'four']);
  });
});

describe('defensive shape validation — malformed entries are skipped, not rendered as undefined', () => {
  it('skips every malformed shape while keeping the good ones', () => {
    const stats = [
      { value: 'LI23001', label: 'Texas Irrigator License' },
      null, undefined, 'a string', 42, [],
      { value: 'no label' },
      { label: 'no value' },
      { value: '', label: 'empty value' },
      { value: 'x', label: '   ' },
      { value: 5, label: 'numeric value' },
      { value: 'BBB', label: 'A+ Rating' },
    ];
    expect(resolveAboutStats(stats, '2017', YEAR)).toEqual([
      { value: 'LI23001', label: 'Texas Irrigator License' },
      { value: 'BBB', label: 'A+ Rating' },
    ]);
  });

  it('never emits an entry with an undefined value or label', () => {
    for (const s of resolveAboutStats([{ value: 'x', label: 'y' }, { value: 'z' }], '2017', YEAR)) {
      expect(typeof s.value).toBe('string');
      expect(typeof s.label).toBe('string');
    }
  });
});

describe('at most four tiles', () => {
  it(`truncates beyond ${MAX_ABOUT_STATS}`, () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ value: `v${i}`, label: `l${i}` }));
    const out = resolveAboutStats(six, '2017', YEAR);
    expect(out).toHaveLength(4);
    expect(out.map((s) => s.label)).toEqual(['l0', 'l1', 'l2', 'l3']);
  });

  it('0 through 4 pass through untouched', () => {
    for (const n of [0, 1, 2, 3, 4]) {
      const stats = Array.from({ length: n }, (_, i) => ({ value: `v${i}`, label: `l${i}` }));
      expect(resolveAboutStats(stats, '2017', YEAR)).toHaveLength(n);
    }
  });
});
