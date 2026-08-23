import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DefaultAboutPage } from './DefaultAboutPage';
import { WhyChooseUs } from './sections/WhyChooseUs';
import { ContactFormBoldLocal } from './forms/ContactFormBoldLocal';
import { BoldLocalWhyUs } from '../_shells/bold-local/BoldLocalWhyUs';
import { BoldLocalAboutPage } from '../_shells/bold-local/BoldLocalAboutPage';
import { CleanFriendlyAboutPage } from '../_shells/clean-friendly/CleanFriendlyAboutPage';
import { ModernProAboutPage } from '../_shells/modern-pro/ModernProAboutPage';
import { RusticRuggedAboutPage } from '../_shells/rustic-rugged/RusticRuggedAboutPage';
import { SERVICE_DATA } from '../_lib/serviceData';
import { PEST_CONTENT_MAP } from '../../../../src/shells/_shared/pestContent';

// PR E — render-level proof for every component whose copy changed.
//
// The repo-wide source guard (shared/lib/noUnverifiedClaims.test.ts) proves the
// literals are gone from the FILES. These prove they are gone from the OUTPUT,
// which is the thing a visitor actually reads, and that each component still
// renders the true copy around the hole the deletion left.

const CAPACITY = /same-day|next-day|24\/7|no contracts/i;
const FABRICATED = /most customers|thousands of (properties|customers|homes)/i;

const TEAM: never[] = [];
const ABOUT_BASE = {
  heroTitle: 'About Us',
  heroSub: 'Who we are',
  heroImageUrl: null,
  aboutImage: '/images/pests/team.jpg',
  team: TEAM,
  businessName: 'Acme Pest',
  introParagraphs: ['We have been doing this a while.'],
};

const PAGES = [
  {
    name: 'DefaultAboutPage',
    html: renderToStaticMarkup(createElement(DefaultAboutPage, { ...ABOUT_BASE, aboutSchema: null })),
    keeps: ['Transparent Pricing', 'Get your free quote today.'],
  },
  {
    name: 'BoldLocalAboutPage',
    html: renderToStaticMarkup(createElement(BoldLocalAboutPage, ABOUT_BASE)),
    keeps: ['Local first'],
  },
  {
    name: 'CleanFriendlyAboutPage',
    html: renderToStaticMarkup(createElement(CleanFriendlyAboutPage, ABOUT_BASE)),
    keeps: ['Get your free quote today.'],
  },
  {
    name: 'ModernProAboutPage',
    // No introParagraphs -> the FALLBACK array renders, which is where the
    // "same-day response and a 100% guarantee" claim used to live.
    html: renderToStaticMarkup(createElement(ModernProAboutPage, { ...ABOUT_BASE, introParagraphs: undefined })),
    keeps: ['A licensed team operating to enterprise quality standards.'],
  },
  {
    name: 'RusticRuggedAboutPage',
    html: renderToStaticMarkup(createElement(RusticRuggedAboutPage, ABOUT_BASE)),
    keeps: ['Get a free quote.'],
  },
  {
    name: 'WhyChooseUs (default features)',
    html: renderToStaticMarkup(createElement(WhyChooseUs, { businessName: 'Acme Pest' })),
    keeps: ['We know the local pest pressures in your area.', 'Clear Scheduling'],
  },
  {
    name: 'BoldLocalWhyUs',
    html: renderToStaticMarkup(createElement(BoldLocalWhyUs, { businessName: 'Acme Pest' })),
    keeps: ['No callbacks, no excuses', 'Flat pricing, no surprises'],
  },
  {
    name: 'ContactFormBoldLocal',
    html: renderToStaticMarkup(createElement(ContactFormBoldLocal, {
      bizName: 'Acme Pest',
      phone: '5125550123',
      email: 'hi@acme.test',
      address: '1 Main St',
      hours: 'Mon-Fri 8-5',
      facebook: '',
      instagram: '',
      google: '',
      form: { name: '', email: '', phone: '', message: '', smsConsent: false },
      set: () => {},
      submitting: false,
      sent: false,
      error: '',
      onSubmit: () => {},
    } as never)),
    keeps: ['hi@acme.test'],
  },
] as const;

describe('no retired claim survives in rendered output', () => {
  for (const { name, html } of PAGES) {
    it(`${name} renders no capacity or terms promise`, () => {
      expect(html).not.toMatch(CAPACITY);
    });

    it(`${name} renders no fabricated statistic`, () => {
      expect(html).not.toMatch(FABRICATED);
    });
  }
});

describe('the true copy around each deletion still renders', () => {
  for (const { name, html, keeps } of PAGES) {
    it(`${name} keeps what was actually true`, () => {
      for (const keep of keeps) {
        // React escapes & in text nodes; compare on the escaped form.
        expect(html).toContain(keep.replace(/&/g, '&amp;'));
      }
    });
  }
});

describe('ContactFormBoldLocal drops the whole Coverage block, not just its words', () => {
  const html = PAGES.filter((p) => p.name === 'ContactFormBoldLocal')[0].html;
  it('renders no orphaned "Coverage" heading', () => {
    expect(html).not.toContain('Coverage');
  });
});

describe('the data modules carry no retired claim', () => {
  const serviceValues = JSON.stringify(SERVICE_DATA);
  const pestValues = JSON.stringify(PEST_CONTENT_MAP);

  it('SERVICE_DATA is clean', () => {
    expect(serviceValues).not.toMatch(CAPACITY);
    expect(serviceValues).not.toMatch(FABRICATED);
  });

  it('PEST_CONTENT_MAP is clean', () => {
    expect(pestValues).not.toMatch(CAPACITY);
    expect(pestValues).not.toMatch(FABRICATED);
  });

  // The turnaround promises are NOT covered by the repo guard — /within \d+
  // hours/ was dropped because it cannot tell efficacy from turnaround. They
  // were deleted by hand, so they need an explicit assertion or nothing stops
  // them coming back.
  it('the WDI turnaround promises are gone, and stay gone', () => {
    for (const blob of [serviceValues, pestValues]) {
      expect(blob).not.toMatch(/report[s]? (are )?deliver(ed)? within \d+ hours/i);
      expect(blob).not.toMatch(/WDI[^"]{0,40}within \d+ hours/i);
      expect(blob).not.toMatch(/fast turnaround/i);
    }
  });

  it('mosquito treatment EFFICACY is deliberately untouched — a trade fact, not a promise', () => {
    expect(pestValues).toMatch(/effective within 24 hours/i);
  });
});

describe('QuoteForm makes no response-time promise', () => {
  // The confirmation screen is behind component state, so it cannot be reached
  // by a static render. Asserted against source instead — and stated plainly
  // rather than dressed up as a render test.
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'forms', 'QuoteForm.tsx'),
    'utf8',
  );

  it('no longer promises contact within a fixed window', () => {
    const withoutComments = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(withoutComments).not.toMatch(/in touch within \d+ hours/i);
  });

  it('still confirms the submission succeeded', () => {
    expect(src).toContain('Thank You!');
  });
});
