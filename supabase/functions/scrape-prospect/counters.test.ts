// S346C Part D — the scrape counters must reconcile.
//
// The live run reported "23 paths tried, 1 real page saved (9 skipped)".
// 23 - 1 - 9 = 13 unaccounted for: paths where scrapeOne returned null, so they
// never reached partitionScrapedPages and appeared in neither counter.

import { describe, it, expect } from 'vitest';
import { partitionScrapedPages, type ScrapedPage } from './pageFilter';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CODE = readFileSync(join(__dirname, 'index.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const page = (path: string, status: number, md = 'x'.repeat(80)): ScrapedPage =>
  ({ path, markdown: md, metadata: { statusCode: status } });

describe('tried = unreachable + discarded + kept', () => {
  it('the identity holds for the shape of the real run', () => {
    const tried = 23;
    // 13 unreachable — scrapeOne returned null, so they are simply absent
    const fetched: ScrapedPage[] = [
      page('/', 200, 'homepage copy that is quite distinct from anything else here'),
      ...Array.from({ length: 9 }, (_, i) => page(`/svc-${i}`, 404)),
    ];
    const unreachable = tried - fetched.length;
    const { kept, discarded } = partitionScrapedPages(fetched);

    expect(unreachable).toBe(13);
    expect(discarded).toHaveLength(9);
    expect(kept).toHaveLength(1);
    expect(unreachable + discarded.length + kept.length).toBe(tried);
  });

  it('holds for an all-reachable run too', () => {
    const fetched = [
      page('/', 200, 'home page words that differ a great deal from the others'),
      page('/contact', 200, 'contact page with a form and a phone number and hours'),
    ];
    const tried = 2;
    const unreachable = tried - fetched.length;
    const { kept, discarded } = partitionScrapedPages(fetched);
    expect(unreachable).toBe(0);
    expect(unreachable + discarded.length + kept.length).toBe(tried);
  });

  it('holds when everything is unreachable', () => {
    const tried = 18;
    const { kept, discarded } = partitionScrapedPages([]);
    expect(tried - 0 + discarded.length + kept.length - tried).toBe(0);
    expect(18 - 0).toBe(tried);
  });
});

describe('the function computes and reports it', () => {
  it('unreachable is derived from paths tried minus what came back', () => {
    expect(CODE).toMatch(/const\s+unreachable\s*=\s*candidatePaths\.length\s*-\s*fetched\.length/);
  });

  it('it is in BOTH responses — the success one and the nothing-found one', () => {
    const bodies = CODE.split('return json(').slice(1);
    const withCounts = bodies.filter(b => /paths_tried/.test(b));
    expect(withCounts.length).toBeGreaterThanOrEqual(2);
    for (const b of withCounts) expect(b).toMatch(/unreachable/);
  });

  it('MUTATION: dropping unreachable from the success response is caught', () => {
    const broken = CODE.replace(/\n\s*unreachable,/, '');
    const bodies = broken.split('return json(').slice(1).filter(b => /paths_tried/.test(b));
    expect(bodies.some(b => !/unreachable/.test(b))).toBe(true);
  });
});
