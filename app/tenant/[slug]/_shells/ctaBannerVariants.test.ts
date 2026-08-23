import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BoldLocalCtaBanner } from './bold-local/BoldLocalCtaBanner';
import { CleanFriendlyCtaBanner } from './clean-friendly/CleanFriendlyCtaBanner';
import { getVerticalCopy } from '../../../../src/shells/_shared/verticalCopy';

// PR D — both shell banners hardcoded
//   "Same-day and next-day appointments available. No contracts required."
// a capacity promise plus a business-terms promise, neither verified for any
// tenant, on every bold-local and clean-friendly homepage.

const pest = getVerticalCopy('pest');
const irrigation = getVerticalCopy('irrigation');

const VARIANTS = [
  { name: 'BoldLocalCtaBanner', Component: BoldLocalCtaBanner },
  { name: 'CleanFriendlyCtaBanner', Component: CleanFriendlyCtaBanner },
] as const;

describe('the retired literals are gone from the rendered output', () => {
  for (const { name, Component } of VARIANTS) {
    it(`${name} renders neither capacity nor terms claim, whatever it is passed`, () => {
      for (const strapline of [undefined, pest.ctaStrapline, irrigation.ctaStrapline]) {
        const html = renderToStaticMarkup(createElement(Component, { phone: '5125550123', strapline }));
        expect(html).not.toMatch(/same-day|next-day|no contracts/i);
      }
    });

    it(`${name} renders the vertical strapline it is given`, () => {
      const pestHtml = renderToStaticMarkup(createElement(Component, { strapline: pest.ctaStrapline }));
      expect(pestHtml).toContain(pest.ctaStrapline);

      const irrHtml = renderToStaticMarkup(createElement(Component, { strapline: irrigation.ctaStrapline }));
      expect(irrHtml).toContain(irrigation.ctaStrapline);
      expect(irrHtml).not.toContain(pest.ctaStrapline);
    });

    it(`${name} renders NO strapline paragraph when given nothing — no fallback claim`, () => {
      const html = renderToStaticMarkup(createElement(Component, { phone: '5125550123' }));
      expect(html).not.toContain(pest.ctaStrapline);
      expect(html).not.toContain(irrigation.ctaStrapline);
    });

    it(`${name} keeps its own chrome and CTA`, () => {
      const html = renderToStaticMarkup(createElement(Component, { phone: '5125550123', ctaText: 'Get a free quote' }));
      expect(html).toContain('Get a free quote');
      expect(html).toContain('href="/quote"');
    });
  }
});

// Source scan across EVERY CtaBanner variant, including the two confirmed clean
// (ModernPro, RusticRugged) so a future edit cannot reintroduce the literals there.
describe('no CtaBanner variant contains the retired literals in source', () => {
  const shellsDir = dirname(fileURLToPath(import.meta.url));
  const sectionsDir = join(shellsDir, '..', '_components', 'sections');

  const bannerFiles: string[] = [
    join(sectionsDir, 'CtaBanner.tsx'),
    ...readdirSync(shellsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => {
        const dir = join(shellsDir, d.name);
        return readdirSync(dir).filter((f) => f.includes('CtaBanner')).map((f) => join(dir, f));
      }),
  ];

  it('finds every variant it is meant to be checking', () => {
    expect(bannerFiles.length).toBeGreaterThanOrEqual(5);
  });

  for (const file of bannerFiles) {
    const name = file.split('/').slice(-1)[0];
    it(`${name} contains no 'Same-day' or 'No contracts required'`, () => {
      // Strip comments: the shared CtaBanner and both shells document the
      // retired strings in a note, which is the point, not a violation.
      const src = readFileSync(file, 'utf8')
        .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      expect(src).not.toContain('Same-day');
      expect(src).not.toContain('No contracts required');
      expect(src).not.toMatch(/next-day/i);
    });
  }
});
