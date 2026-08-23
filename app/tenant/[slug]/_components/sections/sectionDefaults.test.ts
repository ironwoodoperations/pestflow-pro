import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WhyChooseUs } from './WhyChooseUs';
import { Process } from './Process';
import { getVerticalCopy } from '../../../../../src/shells/_shared/verticalCopy';

// WS3 — both components became prop-driven. Their DEFAULTS must still be the
// exact pest copy, because the homepage's non-modern-pro branch calls them with
// no copy prop and must render byte-identically to before.

// React escapes &, <, > in text nodes; compare against escaped copy.
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const pest = getVerticalCopy('pest');
const irrigation = getVerticalCopy('irrigation');

describe('WhyChooseUs default = pest, unchanged', () => {
  const html = renderToStaticMarkup(createElement(WhyChooseUs, { businessName: 'Acme' }));

  it('renders all six historical pest features', () => {
    for (const f of pest.whyChooseFeatures) {
      expect(html).toContain(esc(f.title));
      // desc contains an em dash / apostrophes in places — check a stable slice
      expect(html).toContain(esc(f.desc.slice(0, 40)));
    }
  });

  it('still renders the section chrome', () => {
    expect(html).toContain('Our Promise');
    expect(html).toContain('Why Choose Acme?');
  });
});

describe('Process default = pest, unchanged', () => {
  const html = renderToStaticMarkup(createElement(Process));

  it('renders the historical heading', () => {
    expect(html).toContain('How Our Pest Control Process Works');
  });

  it('renders all five historical steps, numbered 1-5', () => {
    pest.processSteps.forEach((s, i) => {
      expect(html).toContain(esc(s.title));
      expect(html).toContain(esc(s.desc.slice(0, 40)));
      expect(html).toContain(`>${i + 1}</div>`);
    });
  });
});

describe('passing a preset swaps the copy wholesale', () => {
  it('WhyChooseUs renders irrigation features and NO pest ones', () => {
    const html = renderToStaticMarkup(
      createElement(WhyChooseUs, { businessName: 'Precision', features: irrigation.whyChooseFeatures }),
    );
    for (const f of irrigation.whyChooseFeatures) expect(html).toContain(esc(f.title));
    expect(html).not.toContain('Custom Treatment Plans');
    expect(html).not.toMatch(/pest|termite/i);
  });

  it('Process renders the irrigation heading and steps, no pest ones', () => {
    const html = renderToStaticMarkup(
      createElement(Process, { heading: irrigation.processHeading, steps: irrigation.processSteps }),
    );
    expect(html).toContain('How Our Irrigation Process Works');
    expect(html).toContain('Walkthrough');
    expect(html).not.toContain('How Our Pest Control Process Works');
    expect(html).not.toMatch(/harborage|pest/i);
  });
});

// WS6 — unrelated defect: the reviews page rendered testimonials.source raw in a
// styled span, leaking DB enum values ('client_site', 'google_outscraper') to
// visitors. The badge is deleted outright, not mapped to a friendly label: a
// mapping just leaks the next new enum value instead.
describe('WS6 — reviews page renders no provenance badge', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const reviewsPage = readFileSync(join(here, '..', '..', 'reviews', 'page.tsx'), 'utf8');

  it('does not render r.source anywhere', () => {
    expect(reviewsPage).not.toMatch(/\{\s*r\.source/);
    expect(reviewsPage).not.toMatch(/r\.source\s*&&/);
  });

  it('contains no raw enum value that could reach a visitor', () => {
    expect(reviewsPage).not.toContain('client_site');
    expect(reviewsPage).not.toContain('google_outscraper');
  });
});
