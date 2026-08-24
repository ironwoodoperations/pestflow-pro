import { describe, it, expect } from 'vitest';
import { buildCaptionPrompt, buildSmartSchedulePrompt } from '../captionPrompt';

// S287 — assembled-prompt assertions. The point is the STRING that reaches the
// model; a test of the trade-noun lookup alone would pass while the prompt still
// said "in East Texas".

// pls's REAL stored settings.business_info.industry — 146 characters of free
// text from an onboarding input. Until this PR it was interpolated verbatim into
// the caption prompt, producing an ungrammatical run-on that named East Texas
// twice: once from the hardcoded suffix, once folded to lowercase out of this.
const PLS_REAL_INDUSTRY =
  'irrigation and sprinkler system installation and repair, yard drainage and french drains, lake and pond pump systems, sod and grading — East Texas';

const base = { topic: 'spring startup checks', count: 3 };

describe('no prompt asserts a region the platform cannot know', () => {
  const CASES = [
    ['pest, city known', { businessName: 'Ironclad', vertical: 'pest', city: 'Tyler' }],
    ['irrigation, city known', { businessName: 'Precision Lawn Systems', vertical: 'irrigation', city: 'Lindale' }],
    ['irrigation, city unknown', { businessName: 'Precision Lawn Systems', vertical: 'irrigation', city: '' }],
    ['vertical NULL, city unknown', { businessName: 'Vita Glow', vertical: null, city: '' }],
    ['everything unknown', { businessName: '', vertical: undefined, city: '' }],
  ] as const;

  for (const [name, args] of CASES) {
    it(`caption prompt (${name}) contains no "East Texas"`, () => {
      expect(buildCaptionPrompt({ ...base, ...args })).not.toMatch(/east texas/i);
    });
  }

  it('names the tenant\'s OWN city when the address gives one', () => {
    const p = buildCaptionPrompt({ ...base, businessName: 'Ironclad', vertical: 'pest', city: 'Tyler' });
    expect(p).toContain('The business is based in Tyler.');
  });

  it('omits the region entirely when the address gives none — no substitute guess', () => {
    const p = buildCaptionPrompt({ ...base, businessName: 'Ironclad', vertical: 'pest', city: '' });
    expect(p).not.toContain('based in');
    // S283 fixed the same defect in ContentTab by omitting, after it had been
    // defaulting the city to 'Tyler'. Omission, not a different guess.
    expect(p).not.toMatch(/Tyler|Texas|TX\b/);
  });

  it('tells the model not to reinstate a region it was not given', () => {
    expect(buildCaptionPrompt({ ...base, businessName: 'X', vertical: 'pest', city: '' }))
      .toContain('Do not state or imply a location, service area, trade');
  });
});

describe('the trade comes from `vertical`, never from free-text `industry`', () => {
  it('pest yields the pest trade noun', () => {
    expect(buildCaptionPrompt({ ...base, businessName: 'Ironclad', vertical: 'pest', city: '' }))
      .toContain('for Ironclad, a pest service business');
  });

  it('irrigation yields the irrigation trade noun, with the right article', () => {
    const p = buildCaptionPrompt({ ...base, businessName: 'Precision Lawn Systems', vertical: 'irrigation', city: '' });
    expect(p).toContain('for Precision Lawn Systems, an irrigation service business');
    expect(p).not.toContain('a irrigation');
  });

  it('NULL yields NO trade at all — not a guess, not "a service business"', () => {
    const p = buildCaptionPrompt({ ...base, businessName: 'Vita Glow', vertical: null, city: '' });
    expect(p).toContain('writing for Vita Glow.');
    expect(p).not.toMatch(/pest|irrigation|service business/i);
  });

  for (const v of [undefined, '', 'Pest', 'PEST', 'hvac', 'medical_aesthetics', PLS_REAL_INDUSTRY]) {
    it(`unrecognised vertical ${JSON.stringify(String(v).slice(0, 24))} yields no trade`, () => {
      const p = buildCaptionPrompt({ ...base, businessName: 'X', vertical: v, city: '' });
      expect(p).not.toMatch(/pest|irrigation/i);
      expect(p).toContain('writing for X.');
    });
  }

  // The headline case. Whatever else happens, pls's 146-character description
  // must not reach the model.
  it("pls's real industry string cannot reach the prompt through any argument", () => {
    const p = buildCaptionPrompt({
      ...base, businessName: 'Precision Lawn Systems', vertical: 'irrigation', city: 'Lindale',
    });
    expect(p).not.toContain('french drains');
    expect(p).not.toContain('sod and grading');
    expect(p.length).toBeLessThan(700);   // the run-on version was far longer
  });
});

describe('the caption contract is unchanged', () => {
  const p = buildCaptionPrompt({ ...base, businessName: 'Ironclad', vertical: 'pest', city: 'Tyler' });

  it('still asks for exactly N captions with the same separator', () => {
    expect(p).toContain('Generate exactly 3 different Facebook/Instagram captions');
    expect(p).toContain('Separate captions with "---CAPTION---"');
    expect(p).toContain('Return ONLY the 3 captions separated by "---CAPTION---". No JSON, no preamble.');
  });

  it('keeps the original style rules', () => {
    for (const rule of [
      'engaging and friendly, not salesy',
      'Include relevant emojis',
      'End each with 3-5 relevant hashtags',
      'Keep each under 200 words',
    ]) expect(p).toContain(rule);
  });

  it('passes the owner\'s topic through verbatim', () => {
    const odd = 'spring "start-up" — 2 zones & a french drain';
    expect(buildCaptionPrompt({ ...base, topic: odd, businessName: 'X', vertical: 'pest', city: '' }))
      .toContain(odd);
  });
});

describe('the smart-schedule prompt has the same trade fix', () => {
  const now = new Date('2026-08-24T00:00:00Z');

  it('uses the vertical trade noun, not free-text industry', () => {
    expect(buildSmartSchedulePrompt({ vertical: 'irrigation', platform: 'facebook', now }))
      .toContain('An irrigation service business wants to post on facebook');
  });

  it('NULL yields no trade', () => {
    const p = buildSmartSchedulePrompt({ vertical: null, platform: 'facebook', now });
    expect(p).toContain('A business wants to post on facebook');
    expect(p).not.toMatch(/pest|irrigation/i);
  });

  it('never carries a region', () => {
    for (const v of ['pest', 'irrigation', null]) {
      expect(buildSmartSchedulePrompt({ vertical: v, platform: 'instagram', now })).not.toMatch(/east texas/i);
    }
  });

  it('keeps the JSON output contract', () => {
    const p = buildSmartSchedulePrompt({ vertical: 'pest', platform: 'facebook', now });
    expect(p).toContain('{"scheduled_for": "YYYY-MM-DDTHH:mm:00", "reasoning": "One sentence."}');
    expect(p).toContain('Must be future datetime within 7 days. Use 24-hour time.');
  });
});
