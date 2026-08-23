import { describe, it, expect } from 'vitest';
import { getVerticalCopy, withCity, CITY_TOKEN } from './verticalCopy';
import { VERTICALS } from './serviceEntry';

// PR B — the pest block below is the REGRESSION LOCK. Every string is the
// verbatim production value from before this PR. If any assertion here fails,
// live pest tenants have moved and the PR is wrong.

const PEST_EXPECTED = {
  locationHeroSuffix: 'Pest Control',
  locationSubtitleGeneric: 'Professional pest control for',
  locationH2Generic: 'Professional Pest Control',
  locationIntroFallback: [
    "Our licensed technicians provide comprehensive pest control services throughout {city}. Whether you're dealing with ants, roaches, rodents, termites, or mosquitoes, we have the solution.",
    'We combine local knowledge with professional-grade treatments to deliver lasting results for {city} homeowners and businesses.',
  ],
  locationPrimaryCta: 'Schedule Inspection',
  cityFaqs: [
    { q: 'Do you service the {city} area?', a: 'Yes! We provide full pest control services throughout {city} and surrounding communities. Call us today for same-day scheduling.' },
    { q: 'What pests are most common in {city}?', a: 'Common pests in {city} include ants, roaches, rodents, mosquitoes, and spiders. Our local technicians are familiar with regional pest pressures and seasonal patterns.' },
    { q: 'How quickly can you get to my home in {city}?', a: 'We offer same-day and next-day appointments for {city} residents. Call us to check current availability.' },
    { q: 'Are your services available year-round in {city}?', a: 'Yes. Many pests remain active year-round in this area. We recommend quarterly service plans for continuous protection.' },
  ],
  whyChooseFeatures: [
    { title: 'Custom Treatment Plans', desc: 'Every property is different. We tailor our approach to your specific pest pressures and property layout.' },
    { title: 'Family & Pet-Friendly Products', desc: 'EPA-approved, low-impact formulations that are safe for your children and pets when applied correctly.' },
    { title: 'Unlimited Callbacks', desc: 'If pests return between scheduled services, we come back at no additional cost — guaranteed.' },
    { title: 'Fast & Reliable', desc: 'Same-day and next-day appointments available. We show up on time, every time.' },
    { title: 'Local Experts', desc: 'We know the local pest pressures in your area and have treated thousands of properties just like yours.' },
    { title: 'You Come First', desc: 'Our technicians take time to explain treatments, answer questions, and ensure your complete satisfaction.' },
  ],
  processHeading: 'How Our Pest Control Process Works',
  processSteps: [
    { title: 'Inspection', desc: 'Thorough checks of all key entry points, harborage areas, and pest activity indicators.' },
    { title: 'Identification', desc: 'Precise pest identification to develop targeted, pest-specific treatment strategies.' },
    { title: 'Monitoring', desc: 'Installation of monitoring devices to track pest activity and treatment effectiveness.' },
    { title: 'Implementation', desc: 'Targeted, safe applications using the right products at the right concentration levels.' },
    { title: 'Evaluation', desc: 'Follow-up assessments to ensure lasting results and adjust strategies as needed.' },
  ],
  serviceProcessVerb: 'How we treat',
  serviceSolutionLabel: 'Treatment',
  serviceSteps: [
    { num: '01', title: 'Inspect', desc: 'Comprehensive site assessment to identify entry points, harborage, and risk factors.' },
    { num: '02', title: 'Engineer', desc: 'Treatment plan calibrated to species, severity, and structural conditions.' },
    { num: '03', title: 'Execute', desc: 'Targeted application using IPM-compliant materials and documented procedures.' },
    { num: '04', title: 'Verify', desc: 'Follow-up monitoring to confirm elimination and prevent recurrence.' },
  ],
  serviceAreaStrapline: 'Professional pest control in your community and surrounding areas.',
  quoteHeroTitle: 'Schedule a Free Inspection',
  metadataFallbackDesc: 'professional pest control services',
  // PR C — verbatim from the production files they were lifted out of:
  //   blogHeading/blogSubtitle  blog/page.tsx:49-50
  //   blogNewsletterCopy        blog/page.tsx:100
  //   ctaGenericIntro/ctaStrapline/ctaPrimaryLabel  CtaBanner.tsx:13,17
  //   blogCardFallbackImage     blog/page.tsx:80
  //   aboutImageFallback        about/page.tsx:48
  blogHeading: 'Pest Control Blog',
  blogSubtitle: 'Tips, guides, and news from our pest control experts.',
  blogNewsletterCopy: 'Get pest control tips and seasonal alerts delivered to your inbox.',
  ctaGenericIntro: 'Professional pest control, on your schedule.',
  ctaStrapline: 'Same-day appointments available.',
  ctaPrimaryLabel: 'Schedule Inspection',
  blogCardFallbackImage: '/images/pests/pest_control.jpg',
  aboutImageFallback: '/images/pests/team.jpg',
};

describe('REGRESSION LOCK — pest preset is verbatim production copy', () => {
  it('deep-equals the pre-PR-B strings, every slot', () => {
    expect(getVerticalCopy('pest')).toEqual(PEST_EXPECTED);
  });

  // Slot-by-slot, so a failure names the surface that moved rather than
  // dumping one enormous diff.
  for (const key of Object.keys(PEST_EXPECTED) as (keyof typeof PEST_EXPECTED)[]) {
    it(`${key} is unchanged`, () => {
      expect(getVerticalCopy('pest')[key]).toEqual(PEST_EXPECTED[key]);
    });
  }
});

describe('irrigation preset — trade-level only', () => {
  const serialized = JSON.stringify(getVerticalCopy('irrigation'));

  it('carries zero pest vocabulary', () => {
    expect(serialized).not.toMatch(/pest|termite|mosquito|rodent|bed bug|ant control|harborage|IPM|infestation/i);
  });

  it('carries NO TENANT FACTS — no licence, region, warranty term, or rating', () => {
    // These are true of Precision, not of irrigation as a trade. They belong in
    // the DB. This is the assertion that keeps the preset reusable.
    expect(serialized).not.toMatch(/LI23001|East Texas|2-year|two-year|BBB/i);
  });

  it('makes NO CAPACITY OR OUTCOME PROMISE the client has not given us', () => {
    // A preset may describe how a trade works; it may not commit a business to
    // a response time or a guarantee. 'Same-day and next-day appointments
    // available' shipped here in the original brief and was wrong for exactly
    // that reason — it is the same class of fabrication WS7 strips from the
    // about stats, and it contradicted the city FAQ, which was deliberately
    // written to promise nothing. Conduct claims ("we show up when we say we
    // will") are fine; capacity claims are not.
    expect(serialized).not.toMatch(/same-day|next-day|24\/7|guarantee/i);
  });

  it('§0.1: says nothing about "lawn" — irrigation is a separate vertical', () => {
    expect(serialized.toLowerCase()).not.toContain('lawn');
  });

  it('makes no scheduling promise in the city FAQs either', () => {
    // The pest city-FAQ promises same-day scheduling; the irrigation FAQ must
    // not, because no such commitment exists.
    const faqs = JSON.stringify(getVerticalCopy('irrigation').cityFaqs);
    expect(faqs).not.toMatch(/same-day/i);
  });

  it('feature 4 is the corrected conduct claim, not the withdrawn capacity one', () => {
    expect(getVerticalCopy('irrigation').whyChooseFeatures[3]).toEqual({
      title: 'Clear Scheduling',
      desc: 'We give you a firm date, keep you posted if anything changes, and show up when we say we will.',
    });
  });

  it('has the same slot shape as pest — no missing or extra slots', () => {
    expect(Object.keys(getVerticalCopy('irrigation')).sort())
      .toEqual(Object.keys(getVerticalCopy('pest')).sort());
  });

  it('has the expected collection sizes', () => {
    const c = getVerticalCopy('irrigation');
    expect(c.cityFaqs).toHaveLength(4);
    expect(c.whyChooseFeatures).toHaveLength(6);
    expect(c.processSteps).toHaveLength(5);
    expect(c.serviceSteps).toHaveLength(4);
    expect(c.serviceSteps.map((s) => s.num)).toEqual(['01', '02', '03', '04']);
  });
});

describe('city tokenization', () => {
  it('every city-tokenized slot uses the literal {city} token', () => {
    for (const v of ['pest', 'irrigation'] as const) {
      const c = getVerticalCopy(v);
      expect(c.locationIntroFallback.join(' ')).toContain(CITY_TOKEN);
      expect(JSON.stringify(c.cityFaqs)).toContain(CITY_TOKEN);
    }
  });

  it('withCity replaces every occurrence, not just the first', () => {
    expect(withCity('{city} and {city}', 'Tyler')).toBe('Tyler and Tyler');
  });

  it('leaves no unreplaced token behind in rendered copy', () => {
    for (const v of ['pest', 'irrigation'] as const) {
      const c = getVerticalCopy(v);
      for (const p of c.locationIntroFallback) expect(withCity(p, 'Tyler')).not.toContain(CITY_TOKEN);
      for (const f of c.cityFaqs) {
        expect(withCity(f.q, 'Tyler')).not.toContain(CITY_TOKEN);
        expect(withCity(f.a, 'Tyler')).not.toContain(CITY_TOKEN);
      }
    }
  });
});

describe('registered-but-copyless verticals still fail loudly', () => {
  it('throws for each, naming the vertical', () => {
    for (const v of ['lawn', 'pool', 'hvac', 'roof', 'trailer'] as const) {
      expect(() => getVerticalCopy(v)).toThrow(new RegExp(v));
    }
  });

  it('exactly pest and irrigation have copy', () => {
    const withCopy = VERTICALS.filter((v) => {
      try { getVerticalCopy(v); return true; } catch { return false; }
    });
    expect(withCopy).toEqual(['pest', 'irrigation']);
  });
});

// ── PR C ────────────────────────────────────────────────────────────────────
describe('PR C — new slots exist for BOTH populated verticals', () => {
  const NEW_COPY_SLOTS = [
    'blogHeading', 'blogSubtitle', 'blogNewsletterCopy',
    'ctaGenericIntro', 'ctaStrapline', 'ctaPrimaryLabel',
  ] as const;

  for (const v of ['pest', 'irrigation'] as const) {
    it(`${v} defines every new copy slot as a non-empty string`, () => {
      const c = getVerticalCopy(v) as unknown as Record<string, unknown>;
      for (const slot of NEW_COPY_SLOTS) {
        expect(typeof c[slot]).toBe('string');
        expect((c[slot] as string).trim().length).toBeGreaterThan(0);
      }
    });

    it(`${v} defines both image slots as a string or explicit null`, () => {
      const c = getVerticalCopy(v);
      for (const img of [c.blogCardFallbackImage, c.aboutImageFallback]) {
        expect(img === null || typeof img === 'string').toBe(true);
        if (typeof img === 'string') expect(img.startsWith('/images/')).toBe(true);
      }
    });
  }
});

describe('PR C — irrigation values pass the existing guards', () => {
  const newIrrigationCopy = JSON.stringify([
    getVerticalCopy('irrigation').blogHeading,
    getVerticalCopy('irrigation').blogSubtitle,
    getVerticalCopy('irrigation').blogNewsletterCopy,
    getVerticalCopy('irrigation').ctaGenericIntro,
    getVerticalCopy('irrigation').ctaStrapline,
    getVerticalCopy('irrigation').ctaPrimaryLabel,
  ]);

  it('makes no capacity or outcome promise', () => {
    expect(newIrrigationCopy).not.toMatch(/same-day|next-day|24\/7|guarantee/i);
  });

  it('carries no tenant facts', () => {
    expect(newIrrigationCopy).not.toMatch(/LI23001|East Texas|2-year|two-year|BBB/i);
  });

  it('carries no pest vocabulary', () => {
    expect(newIrrigationCopy).not.toMatch(/pest|termite|mosquito|rodent|bed bug|ant control/i);
  });

  it('the CTA label is estimate-framed, consistent with quoteHeroTitle', () => {
    expect(getVerticalCopy('irrigation').ctaPrimaryLabel).toMatch(/estimate/i);
    expect(getVerticalCopy('irrigation').quoteHeroTitle).toMatch(/estimate/i);
    expect(getVerticalCopy('irrigation').ctaPrimaryLabel).not.toBe('Schedule Inspection');
  });
});

describe('PR C — irrigation image slots point at nothing rather than a missing or borrowed asset', () => {
  it('are null: no irrigation team or generic photo exists in public/', () => {
    expect(getVerticalCopy('irrigation').blogCardFallbackImage).toBeNull();
    expect(getVerticalCopy('irrigation').aboutImageFallback).toBeNull();
  });

  it('never borrow the pest photography', () => {
    // Stringify rather than toMatch: these are legitimately null today, and
    // toMatch throws on null. This assertion must survive them becoming real
    // irrigation paths later, and must still fail if either points at pests/.
    const c = getVerticalCopy('irrigation');
    expect(String(c.blogCardFallbackImage)).not.toContain('images/pests');
    expect(String(c.aboutImageFallback)).not.toContain('images/pests');
  });
});
