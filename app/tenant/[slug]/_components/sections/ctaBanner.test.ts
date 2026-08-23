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

// PR E: there are no defaults left. DEFAULT_GENERIC_INTRO, DEFAULT_STRAPLINE
// and DEFAULT_PRIMARY_LABEL were pest strings on a multi-vertical component,
// unreachable once both callers passed explicit props — and a claim by accident
// the moment one stopped. All three are optional with no default now, and every
// render site is guarded.
describe('no copy passed -> no claim rendered', () => {
  const bare = renderToStaticMarkup(createElement(CtaBanner, {}));
  const named = renderToStaticMarkup(createElement(CtaBanner, { businessName: 'Acme Pest' }));

  it('renders no strapline, intro or CTA label from a default', () => {
    for (const html of [bare, named]) {
      expect(html).not.toContain(pest.ctaStrapline);
      expect(html).not.toContain(pest.ctaGenericIntro);
      expect(html).not.toContain(pest.ctaPrimaryLabel);
    }
  });

  it('renders no intro paragraph at all when there is nothing to put in it', () => {
    expect(bare).not.toContain('text-white/70 text-lg mb-10');
  });

  it('still renders the business-name line, which is a tenant fact, not a claim', () => {
    expect(named).toContain('Acme Pest is ready to help.');
  });

  it('keeps its chrome and its unlabelled CTA route', () => {
    expect(bare).toContain('Get Started Today');
    expect(bare).toContain('href="/quote"');
  });

  it('carries no capacity or business-terms claim', () => {
    for (const html of [bare, named]) {
      expect(html).not.toMatch(/same-day|next-day|24\/7|no contracts/i);
    }
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
