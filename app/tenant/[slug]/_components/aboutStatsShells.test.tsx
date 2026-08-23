import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

import { DefaultAboutPage } from './DefaultAboutPage';
import { CleanFriendlyAboutPage } from '../_shells/clean-friendly/CleanFriendlyAboutPage';
import { BoldLocalAboutPage } from '../_shells/bold-local/BoldLocalAboutPage';
import { BoldLocalPestPage } from '../_shells/bold-local/BoldLocalPestPage';
import { resolveAboutStats, type ResolvedStat } from '../_lib/aboutStats';

// PR F — the four shells that were still rendering hardcoded stat tiles now use
// the settings.about contract modern-pro has had since PR B.
//
// What these prove, at render level rather than by reading the source:
//   1. none of the removed figures survives in the OUTPUT
//   2. no stats -> no block at all, on every shell, with no fallback tile
//   3. 1 / 4 / 5 stats all render correctly, 5 truncating to 4
//   4. auto:years_operating drops its tile on absent/unparseable/zero/future
//      founded_year rather than substituting a number

const REMOVED = /4,200|12,000|98%|100%\s*<|15\+|Homes Protected|Homes protected|Customer Satisfaction|Customer satisfaction|Treatments|Years Experience|Years experience|Years on the job/;

const ABOUT_BASE = {
  heroTitle: 'About Us',
  heroSub: 'Who we are',
  heroImageUrl: null,
  aboutImage: '/images/pests/team.jpg',
  team: [] as never[],
  businessName: 'Acme Pest',
  introParagraphs: ['We have been doing this a while.'],
};

const TENANT = {
  slug: 'acme',
  phone: '5125550123',
  business_name: 'Acme Pest',
  license_number: 'TX-1234',
  founded_year: 2010,
} as never;

/** Every shell PR F wired, rendered with whatever stats the case supplies. */
function renderAll(stats: ResolvedStat[]) {
  return [
    {
      name: 'DefaultAboutPage',
      html: renderToStaticMarkup(createElement(DefaultAboutPage, { ...ABOUT_BASE, aboutSchema: null, stats })),
    },
    {
      name: 'CleanFriendlyAboutPage',
      html: renderToStaticMarkup(createElement(CleanFriendlyAboutPage, { ...ABOUT_BASE, stats })),
    },
    {
      name: 'BoldLocalAboutPage',
      // licenseNumber deliberately omitted here so the strip contains ONLY the
      // supplied stats; the licence cell has its own tests below.
      html: renderToStaticMarkup(createElement(BoldLocalAboutPage, { ...ABOUT_BASE, stats })),
    },
    {
      name: 'BoldLocalPestPage',
      html: renderToStaticMarkup(createElement(BoldLocalPestPage, { tenant: TENANT, pestSlug: 'ant-control', stats })),
    },
  ];
}

const FOUR: ResolvedStat[] = [
  { value: '12+', label: 'Years operating' },
  { value: 'LI23001', label: 'Texas Irrigator License' },
  { value: 'A+', label: 'BBB rating' },
  { value: 'Tyler, TX', label: 'Based in' },
];

describe('no removed figure survives in rendered output', () => {
  for (const { name, html } of renderAll(FOUR)) {
    it(`${name} renders none of the retired stat literals`, () => {
      expect(html).not.toMatch(REMOVED);
    });
  }
});

describe('no stats -> no stat block at all, and no fallback tile', () => {
  for (const { name, html } of renderAll([])) {
    it(`${name} renders no stat block`, () => {
      expect(html).not.toMatch(REMOVED);
      // Nothing from the four supplied labels can appear either — the block is
      // absent, not merely empty of the old values.
      for (const s of FOUR) expect(html).not.toContain(s.label);
    });
  }

  it('DefaultAboutPage drops the whole section, not just the tiles', () => {
    const withStats = renderToStaticMarkup(createElement(DefaultAboutPage, { ...ABOUT_BASE, aboutSchema: null, stats: FOUR }));
    const without = renderToStaticMarkup(createElement(DefaultAboutPage, { ...ABOUT_BASE, aboutSchema: null, stats: [] }));
    expect(withStats.length).toBeGreaterThan(without.length);
    expect(withStats).toContain('Years operating');
    expect(without).not.toContain('Years operating');
  });
});

describe('1, 4 and 5 stats all render correctly', () => {
  const ONE: ResolvedStat[] = [{ value: '12+', label: 'Years operating' }];

  for (const { name, html } of renderAll(ONE)) {
    it(`${name} renders a single tile`, () => {
      expect(html).toContain('Years operating');
      expect(html).toContain('12+');
    });
  }

  for (const { name, html } of renderAll(FOUR)) {
    it(`${name} renders all four tiles`, () => {
      for (const s of FOUR) expect(html).toContain(s.label);
    });
  }

  it('a fifth stat is truncated by the resolver before any shell sees it', () => {
    const five = [...FOUR, { value: '9+', label: 'Fifth tile' }];
    const resolved = resolveAboutStats(five, '2010', 2026);
    expect(resolved).toHaveLength(4);
    expect(resolved.map((s) => s.label)).not.toContain('Fifth tile');

    for (const { html } of renderAll(resolved)) {
      expect(html).not.toContain('Fifth tile');
    }
  });
});

describe('auto:years_operating drops its tile rather than inventing a number', () => {
  const stats = [{ value: 'auto:years_operating', label: 'Years operating' }];

  const CASES: Array<[string, string | number | undefined | null]> = [
    ['absent', undefined],
    ['null', null],
    ['empty string', '   '],
    ['unparseable', 'nineteen ninety'],
    ['zero span (founded this year)', 2026],
    ['future', 2030],
  ];

  for (const [name, foundedYear] of CASES) {
    it(`${name} -> tile dropped, and no shell renders a years figure`, () => {
      const resolved = resolveAboutStats(stats, foundedYear, 2026);
      expect(resolved).toEqual([]);

      for (const { html } of renderAll(resolved)) {
        expect(html).not.toContain('Years operating');
        expect(html).not.toMatch(REMOVED);
      }
    });
  }

  it('a usable founded_year still produces the tile', () => {
    const resolved = resolveAboutStats(stats, 2010, 2026);
    expect(resolved).toEqual([{ value: '16+', label: 'Years operating' }]);
    for (const { html } of renderAll(resolved)) {
      expect(html).toContain('16+');
    }
  });
});

describe('BoldLocalAboutPage: the licence cell is a tenant fact, not a statistic', () => {
  it('renders the licence number when the tenant really has one', () => {
    const html = renderToStaticMarkup(createElement(BoldLocalAboutPage, { ...ABOUT_BASE, licenseNumber: 'TX-1234', stats: [] }));
    expect(html).toContain('TX-1234');
    expect(html).toContain('License #');
  });

  it('renders nothing at all when there is no licence number — never the word "Licensed"', () => {
    const html = renderToStaticMarkup(createElement(BoldLocalAboutPage, { ...ABOUT_BASE, stats: [] }));
    expect(html).not.toContain('License #');
    expect(html).not.toContain('>Licensed<');
  });

  it('keeps the licence cell alongside DB stats', () => {
    const html = renderToStaticMarkup(createElement(BoldLocalAboutPage, { ...ABOUT_BASE, licenseNumber: 'TX-1234', stats: [{ value: '12+', label: 'Years operating' }] }));
    expect(html).toContain('TX-1234');
    expect(html).toContain('Years operating');
  });
});

describe('BoldLocalAboutPage: the single surviving belief', () => {
  const html = renderToStaticMarkup(createElement(BoldLocalAboutPage, { ...ABOUT_BASE, stats: [] }));

  it('still renders the belief that is true', () => {
    expect(html).toContain('Local first');
  });

  it('does not double its border against the container', () => {
    // With one belief, no team and no stats, the only bordered card in the
    // document is this one. Counting the declarations is exact where a slice
    // window is not: before PR F this rendered `strong: 1, none: 0`, because
    // borderRight was unconditional and doubled against the container's own
    // border. It must now be the reverse.
    const none = (html.match(/border-right:none/g) || []).length;
    const strong = (html.match(/border-right:1px solid var\(--bl-border-strong\)/g) || []).length;
    expect({ none, strong }).toEqual({ none: 1, strong: 0 });
  });
});
