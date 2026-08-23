import { describe, it, expect } from 'vitest';

// No mocks. contentPrompt.ts is pure — no Supabase client, no React, no I/O —
// which is the point of it being its own module: the prompt string can be
// asserted directly instead of inferred from a rendered component.
import { buildContentPrompt } from '../contentPrompt';

// The literals main shipped. Each is a fabrication under rule (b): a claim made
// on behalf of a tenant who never made it. They are asserted by their exact
// removed wording, so a re-introduction under any spelling of the same idea has
// to get past a named test rather than an absence nobody is watching.
const FABRICATIONS = [
  'EPA-approved',
  'family-safe',
  'free inspection',
  'satisfaction guarantee',
  'East Texas',
  'Longview',
  'Jacksonville',
  'Tyler',
  ', TX',
  'a professional pest control company',
  'pest control company',
];

// 'PestFlow Pro' does not appear in this prompt, so — unlike the narration
// prompt — a bare /pest/i is safe here.
const PEST_VOCABULARY = /pest|exterminat|termite|rodent|roach|bed bug|infestation/i;

const FULL = { slug: 'sprinkler-repair', businessName: 'Precision Lawn Systems', businessCity: 'Denver', isServicePage: true };

describe('buildContentPrompt — nothing invented', () => {
  const cases = [
    { name: 'service page, everything known', args: FULL },
    { name: 'generic page, everything known', args: { ...FULL, slug: 'about', isServicePage: false } },
    { name: 'service page, no business name', args: { ...FULL, businessName: '' } },
    { name: 'service page, no city', args: { ...FULL, businessCity: '' } },
    { name: 'generic page, nothing known', args: { slug: 'contact', businessName: '', businessCity: '', isServicePage: false } },
    { name: 'a pest tenant is not special-cased', args: { ...FULL, slug: 'spider-control', businessName: 'Ironclad Pest Solutions' } },
  ];

  for (const { name, args } of cases) {
    describe(name, () => {
      const prompt = buildContentPrompt(args);
      // The business's own name is a tenant fact and is allowed to say anything;
      // exclude it before scanning, or 'Ironclad Pest Solutions' fails its own case.
      const scanned = args.businessName ? prompt.split(args.businessName).join('<<NAME>>') : prompt;

      for (const literal of FABRICATIONS) {
        it(`does not contain "${literal}"`, () => {
          expect(scanned).not.toContain(literal);
        });
      }

      it('carries the do-not-invent instruction', () => {
        expect(prompt).toContain('DO NOT INVENT ANYTHING. Use only the facts given above.');
        expect(prompt).toContain('If a fact is not given above, leave it out.');
      });

      it('bans the claim classes the old prompt requested', () => {
        expect(prompt).toContain('certifications, licences, registrations, approvals, or product/chemical claims');
        expect(prompt).toContain('guarantees, warranties, or refund promises');
        expect(prompt).toContain('free offers, discounts, or prices');
        expect(prompt).toContain('response times, availability, or scheduling promises');
        expect(prompt).toContain('years in business, number of staff, customer counts, awards, or ratings');
      });

      it('names no trade of its own', () => {
        // The slug may legitimately name the service ('spider control'), and the
        // business name is the tenant's own. Neither is the prompt asserting a
        // trade; anything left after removing them would be.
        const withoutSlug = scanned.split(args.slug).join('<<SLUG>>').split(args.slug.replace(/-/g, ' ')).join('<<SLUG>>');
        expect(withoutSlug.match(PEST_VOCABULARY)).toBe(null);
      });
    });
  }
});

describe('buildContentPrompt — unknown facts are omitted, not filled in', () => {
  it('states the real business name when there is one', () => {
    expect(buildContentPrompt(FULL)).toContain('You are a marketing copywriter for Precision Lawn Systems.');
  });

  it('invents no company when the name is missing', () => {
    const prompt = buildContentPrompt({ ...FULL, businessName: '' });
    expect(prompt).toContain('You are a marketing copywriter for a local service business.');
    expect(prompt).toContain('- any business name');
  });

  it('states the real city when there is one, and forbids any other', () => {
    const prompt = buildContentPrompt(FULL);
    expect(prompt).toContain('The business is based in Denver.');
    expect(prompt).toContain('- any city, region or service area other than the one given');
  });

  it('invents no city when the address has none, and forbids all of them', () => {
    const prompt = buildContentPrompt({ ...FULL, businessCity: '' });
    expect(prompt).not.toContain('based in');
    expect(prompt).toContain('- any city, region or service area\n');
    expect(prompt).not.toContain('and the location');
  });

  it('treats whitespace-only input as missing', () => {
    expect(buildContentPrompt({ ...FULL, businessName: '   ', businessCity: '  ' }))
      .toBe(buildContentPrompt({ ...FULL, businessName: '', businessCity: '' }));
  });
});

describe('buildContentPrompt — the page name comes from the slug', () => {
  it('reads a service page name straight off the slug', () => {
    expect(buildContentPrompt(FULL)).toContain('copy for the "sprinkler repair" service page');
  });

  it('does not strip and re-add the word "control" — the slug is taken as written', () => {
    expect(buildContentPrompt({ ...FULL, slug: 'termite-inspections' })).toContain('"termite inspections" service page');
    expect(buildContentPrompt({ ...FULL, slug: 'spider-control' })).toContain('"spider control" service page');
  });

  it('uses the generic brief for a non-service page', () => {
    const prompt = buildContentPrompt({ ...FULL, slug: 'about', isServicePage: false });
    expect(prompt).toContain('Write marketing copy for the "about" page.');
    expect(prompt).toContain('\n\nPage: about');
  });

  it('the two branches are genuinely different briefs', () => {
    const service = buildContentPrompt({ ...FULL, isServicePage: true });
    const generic = buildContentPrompt({ ...FULL, isServicePage: false });
    expect(service).not.toBe(generic);
    expect(service).toContain('SEO-optimized');
    expect(generic).not.toContain('SEO-optimized');
  });
});

describe('buildContentPrompt — output contract is unchanged', () => {
  for (const isServicePage of [true, false]) {
    it(`still demands bare JSON (isServicePage=${isServicePage})`, () => {
      const prompt = buildContentPrompt({ ...FULL, isServicePage });
      expect(prompt).toContain('Respond ONLY with a JSON object, no markdown');
      expect(prompt).toContain('{"title": "...", "subtitle": "...", "intro": "..."}');
    });
  }
});
