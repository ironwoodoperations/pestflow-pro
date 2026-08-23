import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { CtaBanner } from './CtaBanner';
import { getVerticalCopy } from '../../../../../src/shells/_shared/verticalCopy';

// PR C / DEFECT 2 — CtaBanner rendered "Same-day appointments available."
// unconditionally for EVERY tenant, and the pest label "Schedule Inspection".
// Both were live on all five pls location pages.

const pest = getVerticalCopy('pest');
const irrigation = getVerticalCopy('irrigation');

describe('defaults track the pest preset', () => {
  const html = renderToStaticMarkup(createElement(CtaBanner, { businessName: 'Acme Pest' }));

  // PR D: the strapline default WAS 'Same-day appointments available.' — that
  // capacity promise is retired platform-wide, so the default now tracks the
  // pest preset's conduct claim. Asserted against the preset rather than a
  // literal so the two cannot drift apart again.
  it('a caller passing no copy matches the pest preset', () => {
    expect(html).toContain('Acme Pest is ready to help.');
    expect(html).toContain(pest.ctaStrapline);
    expect(html).toContain(pest.ctaPrimaryLabel);
  });

  it('the default carries no capacity or business-terms claim', () => {
    expect(html).not.toMatch(/same-day|next-day|24\/7|no contracts/i);
  });
});

describe('irrigation copy replaces every pest string', () => {
  const html = renderToStaticMarkup(createElement(CtaBanner, {
    businessName: 'Precision Lawn Systems LLC',
    genericIntro: irrigation.ctaGenericIntro,
    strapline: irrigation.ctaStrapline,
    primaryLabel: irrigation.ctaPrimaryLabel,
  }));

  it('makes no capacity promise', () => {
    expect(html).not.toMatch(/same-day|next-day|24\/7|guarantee/i);
  });

  it('uses the estimate-framed CTA, not the pest inspection label', () => {
    expect(html).toContain(irrigation.ctaPrimaryLabel);
    expect(html).not.toContain('Schedule Inspection');
  });

  it('carries no pest vocabulary at all', () => {
    expect(html).not.toMatch(/pest|termite|mosquito|rodent/i);
  });

  it('renders the conduct strapline', () => {
    expect(html).toContain(irrigation.ctaStrapline);
  });
});

describe('the no-business-name branch is also vertical-aware', () => {
  it('falls back to the vertical intro, not a pest literal', () => {
    const html = renderToStaticMarkup(createElement(CtaBanner, {
      genericIntro: irrigation.ctaGenericIntro,
      strapline: irrigation.ctaStrapline,
      primaryLabel: irrigation.ctaPrimaryLabel,
    }));
    expect(html).toContain(irrigation.ctaGenericIntro);
    expect(html).not.toContain(pest.ctaGenericIntro);
  });
});
