// S347 — the filter, tested against the REAL markdown that caused the incident.

import { describe, it, expect } from 'vitest';
import {
  partitionScrapedPages, isHttpError, pageStatusCode,
  isHomepageDuplicate, normalizeContent, similarity,
  HOMEPAGE_DUPLICATE_THRESHOLD, type ScrapedPage,
} from './pageFilter';
import {
  HOME_MARKDOWN, HOME_METADATA,
  NOT_FOUND_MARKDOWN, NOT_FOUND_METADATA,
  CONTACT_MARKDOWN, CONTACT_METADATA,
} from './__fixtures__/grandview';

const home: ScrapedPage = { path: '/', markdown: HOME_MARKDOWN, metadata: HOME_METADATA };
const contact: ScrapedPage = { path: '/contact', markdown: CONTACT_MARKDOWN, metadata: CONTACT_METADATA };
const notFound = (path: string): ScrapedPage => ({ path, markdown: NOT_FOUND_MARKDOWN, metadata: NOT_FOUND_METADATA });

/** The ten lawn service paths the S346 catalog would try on this prospect. */
const LAWN_404_PATHS = [
  '/lawn-fertilization', '/weed-control', '/lawn-aeration', '/overseeding',
  '/grub-control', '/mowing-maintenance', '/seasonal-cleanup',
  '/landscape-design', '/hardscape-stonework', '/artificial-turf',
];

describe('THE INCIDENT — ten near-identical pages, one real', () => {
  it('reproduces it: without the status check every 404 looks like a page', () => {
    // the pre-S347 gate was `pc.title || pc.intro`, and the 404 carries the
    // site-wide og:title — so it passed. This is the bug, pinned.
    expect(NOT_FOUND_METADATA.title).toBe(HOME_METADATA.title);
    expect((NOT_FOUND_METADATA.title as string).length).toBeGreaterThan(0);
  });

  it('ten 404s plus the homepage and contact -> exactly TWO real pages', () => {
    const pages = [home, ...LAWN_404_PATHS.map(notFound), contact];
    const { kept, discarded } = partitionScrapedPages(pages);
    expect(kept.map(p => p.path).sort()).toEqual(['/', '/contact']);
    expect(discarded).toHaveLength(10);
    expect(new Set(discarded.map(d => d.reason))).toEqual(new Set(['http_error']));
    expect(discarded.every(d => d.statusCode === 404)).toBe(true);
  });

  it('the genuinely distinct page SURVIVES — the dedupe must not eat real input', () => {
    const { kept } = partitionScrapedPages([home, contact]);
    expect(kept.map(p => p.path)).toEqual(['/', '/contact']);
  });

  it('the homepage is never discarded as a duplicate of itself', () => {
    const { kept, home: baseline } = partitionScrapedPages([home]);
    expect(kept.map(p => p.path)).toEqual(['/']);
    expect(baseline?.path).toBe('/');
  });
});

describe('the exact signal — the fetched PAGE status, not the Firecrawl call', () => {
  it('404 is an error', () => expect(isHttpError(NOT_FOUND_METADATA)).toBe(true));
  it('200 is not', () => expect(isHttpError(HOME_METADATA)).toBe(false));
  it('reads the real code', () => expect(pageStatusCode(NOT_FOUND_METADATA)).toBe(404));

  it('ABSENT status is NOT treated as an error — that would drop real pages', () => {
    expect(isHttpError({ title: 'x' })).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
    expect(pageStatusCode({})).toBeNull();
  });

  it('other non-2xx codes are errors too', () => {
    for (const code of [301, 403, 410, 500, 503]) {
      expect(isHttpError({ statusCode: code }), String(code)).toBe(true);
    }
    for (const code of [200, 201, 204]) {
      expect(isHttpError({ statusCode: code }), String(code)).toBe(false);
    }
  });
});

describe('the SECONDARY net — a true soft-404 serving the homepage at 200', () => {
  const softNotFound: ScrapedPage = {
    path: '/mowing-maintenance',
    markdown: HOME_MARKDOWN,          // the site renders home for unknown paths
    metadata: { title: HOME_METADATA.title, statusCode: 200 },
  };

  it('is discarded even though its status is 200', () => {
    const { kept, discarded } = partitionScrapedPages([home, softNotFound, contact]);
    expect(kept.map(p => p.path).sort()).toEqual(['/', '/contact']);
    expect(discarded).toEqual([{ path: '/mowing-maintenance', reason: 'homepage_duplicate' }]);
  });

  it('a near-copy (homepage plus a trivial line) is still discarded', () => {
    const nearly: ScrapedPage = {
      path: '/weed-control',
      markdown: HOME_MARKDOWN + '\n\nCall us today.',
      metadata: { statusCode: 200 },
    };
    expect(isHomepageDuplicate(nearly, home)).toBe(true);
  });

  it('but a REAL page is not a near-copy', () => {
    expect(isHomepageDuplicate(contact, home)).toBe(false);
    expect(similarity(normalizeContent(CONTACT_MARKDOWN), normalizeContent(HOME_MARKDOWN)))
      .toBeLessThan(HOMEPAGE_DUPLICATE_THRESHOLD);
  });

  it('an empty page is discarded as no_content, not kept', () => {
    const blank: ScrapedPage = { path: '/overseeding', markdown: '   \n\n  ', metadata: { statusCode: 200 } };
    const { kept, discarded } = partitionScrapedPages([home, blank]);
    expect(kept.map(p => p.path)).toEqual(['/']);
    expect(discarded[0]).toMatchObject({ path: '/overseeding', reason: 'no_content' });
  });
});

describe('a PEST site with genuinely distinct pages must not regress', () => {
  const distinct = (path: string, body: string): ScrapedPage => ({
    path, markdown: `# ${body}\n\n${body} is a specific service we provide, described here in detail with its own copy that shares little with the homepage.`,
    metadata: { title: body, statusCode: 200 },
  });
  const pestPages = [
    { ...home, markdown: 'Welcome to Acme Pest. We protect homes across the county from termites, roaches and rodents with tailored quarterly plans.' },
    distinct('/termite-control', 'Termite Control'),
    distinct('/roach-control', 'Roach Control'),
    distinct('/ant-control', 'Ant Control'),
    distinct('/rodent-control', 'Rodent Control'),
  ];

  it('every distinct service page is kept', () => {
    const { kept, discarded } = partitionScrapedPages(pestPages);
    expect(kept).toHaveLength(5);
    expect(discarded).toHaveLength(0);
  });
});

describe('normalisation is not doing something silly', () => {
  it('strips links and images but keeps their text', () => {
    expect(normalizeContent('[Call us](tel:5125939900)')).toBe('call us');
    expect(normalizeContent('![](https://x/y.png)')).toBe('');
  });
  it('identical strings are perfectly similar; disjoint are zero', () => {
    expect(similarity('a b c', 'a b c')).toBe(1);
    expect(similarity('a b c', 'x y z')).toBe(0);
  });
  it('the threshold is a real number that discards near-copies', () => {
    expect(HOMEPAGE_DUPLICATE_THRESHOLD).toBeGreaterThan(0.5);
    expect(HOMEPAGE_DUPLICATE_THRESHOLD).toBeLessThanOrEqual(1);
  });
});

describe('a broken homepage must not throw everything away', () => {
  it('when / itself errors, only the exact status check applies', () => {
    const brokenHome: ScrapedPage = { path: '/', markdown: NOT_FOUND_MARKDOWN, metadata: { statusCode: 500 } };
    const { home: baseline, kept, discarded } = partitionScrapedPages([brokenHome, contact]);
    expect(baseline).toBeNull();
    expect(kept.map(p => p.path)).toEqual(['/contact']);   // real page still survives
    expect(discarded).toEqual([{ path: '/', reason: 'http_error', statusCode: 500 }]);
  });
});
