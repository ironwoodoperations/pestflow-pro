import { describe, it, expect } from 'vitest';
import { buildNarrationSystemPrompt, PLATFORM_RULES, NO_TRADE_RULE } from './narrationPrompt.ts';
import { getVerticalCopy, isKnownVertical, NEUTRAL_COPY, VERTICAL_COPY } from '../_shared/verticalCopy.ts';

// S283 — the monthly report is the URGENT case. The monthly-report-dispatch cron
// enqueues a report_jobs row for EVERY row in public.tenants, unfiltered, so on
// the 10th of the month an irrigation tenant received a report narrated for "a
// pest-control business owner" with no action on anyone's part.
//
// These assert the ASSEMBLED prompt, not the helper. A test of getVerticalCopy()
// in isolation would have passed on main — the map was never the broken part;
// the string handed to the model was, and it was built somewhere the map could
// not reach it.

// Byte-identical copy of the block as it stands on main, transcribed
// independently rather than imported, so that rewording PLATFORM_RULES in
// narrationPrompt.ts fails here instead of silently agreeing with itself. The
// block exists to stop the model inventing WordPress, Yoast, Rank Math and
// Google Search Console (S261-report-fix); a persona change must not be allowed
// to drop or soften it.
const PLATFORM_RULES_ON_MAIN =
  'PLATFORM RULES (highest priority — never violate, even if it means a fix step must be more general):\n' +
  '- The owner\'s website lives entirely on the PestFlow Pro platform. Every change they make happens inside the PestFlow Pro admin dashboard. Assume PestFlow Pro is the only system they ever log into to work on their website.\n' +
  '- NEVER name, suggest, or reference any other tool, plugin, CMS, platform, or software — not by name and not generically. This includes (but is not limited to) WordPress, Wix, Squarespace, Webflow, Yoast, Rank Math, Google Search Console, Google Business Profile settings, "your SEO plugin," "your CMS," "your website builder," or any external analytics or SEO tool. The owner does not use them and has no access to them.\n' +
  '- For a finding about ONE specific page, direct the owner to SEO -> Pages in PestFlow Pro and edit that page (e.g. "In PestFlow Pro, go to SEO -> Pages and edit the title and description for this page"). For a finding that is clearly site-wide (such as duplicate titles across pages, page-2 search rankings, or site speed), describe what to adjust in PestFlow Pro in general terms — do NOT pretend there is a single page to click, and do NOT invent menus, tabs, or settings that aren\'t obviously implied.\n' +
  '- If you don\'t know the exact button or tab name, describe the action in simple generic terms inside PestFlow Pro (e.g. "edit the page\'s description field") rather than guessing a specific control or mentioning any outside tool.\n\n';

// Any of these in a prompt sent to a non-pest tenant is the bug this PR fixes.
const PEST_VOCABULARY = /pest|exterminat|termite|rodent|roach|bed bug|infestation/i;

// 'PestFlow Pro' is the PLATFORM's name. It appears in every prompt by design
// and says nothing about the tenant's trade, but it contains the substring
// 'Pest' — so a naive /pest/i check reports the neutral prompt as pest-flavoured
// and the guard becomes noise. (S282's admin classifier shipped this exact
// over-match against the same product name; it is an easy one to repeat.)
// Masked rather than dropped so the surrounding text still lines up.
const maskProductName = (s: string) => s.split('PestFlow Pro').join('<<PLATFORM>>');

describe('PLATFORM RULES survive the persona change', () => {
  it('the module\'s block is byte-identical to main', () => {
    expect(PLATFORM_RULES).toBe(PLATFORM_RULES_ON_MAIN);
  });

  for (const vertical of ['pest', 'irrigation', null, undefined, 'hvac'] as const) {
    it(`is present verbatim for vertical=${String(vertical)}`, () => {
      expect(buildNarrationSystemPrompt(vertical)).toContain(PLATFORM_RULES_ON_MAIN);
    });
  }
});

describe('assembled narration prompt — pest', () => {
  const prompt = buildNarrationSystemPrompt('pest');

  it('addresses a pest-control owner', () => {
    expect(prompt).toContain('You write a monthly website report for a pest-control business owner with no SEO background.');
  });

  it('keeps the pest-control call noun in the TASK line', () => {
    expect(prompt).toContain('why it matters for getting more pest-control phone calls');
  });

  it('does NOT carry the no-trade rule — the trade IS recorded', () => {
    expect(prompt).not.toContain(NO_TRADE_RULE);
  });
});

describe('assembled narration prompt — irrigation', () => {
  const prompt = buildNarrationSystemPrompt('irrigation');

  it('contains no pest vocabulary anywhere', () => {
    expect(maskProductName(prompt).match(PEST_VOCABULARY)).toBe(null);
  });

  it('addresses an irrigation owner', () => {
    expect(prompt).toContain('You write a monthly website report for an irrigation business owner with no SEO background.');
  });

  it('asks for irrigation phone calls', () => {
    expect(prompt).toContain('why it matters for getting more irrigation phone calls');
  });

  it('does NOT carry the no-trade rule', () => {
    expect(prompt).not.toContain(NO_TRADE_RULE);
  });
});

describe('assembled narration prompt — vertical not recorded', () => {
  // NULL is a real, current, deliberate state: one live tenant is NOT pest and
  // has no vertical set. Unknown must never resolve to a trade.
  for (const vertical of [null, undefined, '', 'hvac', 'pest-control', 'Pest'] as const) {
    const label = vertical === '' ? "'' (empty)" : String(vertical);
    describe(`vertical=${label}`, () => {
      const prompt = buildNarrationSystemPrompt(vertical);

      it('names no trade', () => {
        expect(maskProductName(prompt).match(PEST_VOCABULARY)).toBe(null);
        expect(prompt).toContain('You write a monthly website report for a business owner with no SEO background.');
        expect(prompt).toContain('why it matters for getting more phone calls');
      });

      it('states the absence explicitly rather than leaving it to be inferred', () => {
        expect(prompt).toContain(NO_TRADE_RULE);
        expect(prompt).toContain('Do NOT name, guess, or imply any specific trade or industry');
      });

      it('is NOT the pest prompt', () => {
        expect(prompt).not.toBe(buildNarrationSystemPrompt('pest'));
      });
    });
  }
});

describe('prompt structure', () => {
  it('orders persona, then the trade rule, then PLATFORM RULES, then TASK', () => {
    const p = buildNarrationSystemPrompt(null);
    const persona = p.indexOf('You write a monthly website report');
    const trade = p.indexOf('TRADE: this business');
    const rules = p.indexOf('PLATFORM RULES (highest priority');
    const task = p.indexOf('TASK: Rephrase each finding');
    expect(persona).toBe(0);
    expect(trade).toBeGreaterThan(persona);
    expect(rules).toBeGreaterThan(trade);
    expect(task).toBeGreaterThan(rules);
  });

  it('the only difference between the pest and irrigation prompts is the trade nouns', () => {
    const pest = buildNarrationSystemPrompt('pest');
    const irrigation = buildNarrationSystemPrompt('irrigation');
    const normalised = pest
      .replace('a pest-control business owner', 'an irrigation business owner')
      .replace('pest-control phone calls', 'irrigation phone calls');
    expect(normalised).toBe(irrigation);
  });
});

describe('verticalCopy resolution', () => {
  it('knows exactly the two verticals the CHECK constraint allows', () => {
    expect(Object.keys(VERTICAL_COPY).sort()).toEqual(['irrigation', 'pest']);
  });

  it('resolves unknown, absent and mis-cased input to NEUTRAL', () => {
    for (const v of [null, undefined, '', 'hvac', 'pest-control', 'pest_control', 'Pest', 'IRRIGATION']) {
      expect(getVerticalCopy(v)).toBe(NEUTRAL_COPY);
      expect(isKnownVertical(v)).toBe(false);
    }
  });

  it('does not mistake an Object.prototype key for a preset', () => {
    for (const v of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      expect(isKnownVertical(v)).toBe(false);
      expect(getVerticalCopy(v)).toBe(NEUTRAL_COPY);
    }
  });

  it('the neutral copy names no trade', () => {
    expect(NEUTRAL_COPY.ownerNoun).toBe('a business owner');
    expect(NEUTRAL_COPY.callNoun).toBe('phone calls');
    expect(PEST_VOCABULARY.test(NEUTRAL_COPY.ownerNoun + NEUTRAL_COPY.callNoun)).toBe(false);
  });
});
