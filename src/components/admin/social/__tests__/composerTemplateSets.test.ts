import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDUSTRY_TEMPLATES, fillTemplate, type PostTemplate } from '../composerTemplateSets';

// S286 — rule (b) in its THIRD location. S280 removed invented claims from
// public-site components; S283 removed them from the ContentTab AI prompt, which
// did not merely permit fabrication but REQUESTED it; this file did the same for
// social posts, instructing the model to announce discounts, free inspections
// and — twice — a storm that may never have happened.
//
// The fix is not deletion. Owners run real promotions, and a tool that cannot
// help them say so is one they stop using. The offer comes from the OWNER now.

const ALL: Array<[string, PostTemplate]> = Object.entries(INDUSTRY_TEMPLATES)
  .flatMap(([set, list]) => list.map((t) => [set, t] as [string, PostTemplate]));

// Scanned against the FIELD VALUES rather than raw lines, so the file's own
// comments — which quote the removed prompts verbatim, on purpose — cannot make
// this fire, and cannot be used to smuggle a claim past it either.
const fieldsOf = (t: PostTemplate) =>
  [t.name, t.description, t.topicPrompt, t.ownerInput?.label ?? '', t.ownerInput?.placeholder ?? ''].join(' | ');

// \bfree\b, not /free/: 'freeze' appears legitimately in two prompts ('before a
// freeze', 'cold weather can freeze pipes') and a substring match would flag
// both. That is the same over-match class as 'PestFlow Pro' matching /pest/i.
const FREE_OFFER = /\bfree\b|\bno cost\b|complimentary/i;
const DISCOUNT = /\bdiscount|\b\d+% off\b|limited[- ]time/i;
// A storm that HAS happened. Conditional seasonal copy ('cold weather can freeze
// pipes', 'hot/wet/cold weather increases pest activity') is a trade truth and
// stays; 'recent storms' asserts a past event the model cannot know occurred.
const WEATHER_EVENT = /recent storms?|after the storm|storms? (?:last|this) (?:week|month|night)|damage from the storm/i;

describe('no template asserts an offer the tenant may not have made', () => {
  for (const [name, pattern] of [
    ['a free offer', FREE_OFFER],
    ['a discount', DISCOUNT],
    ['a weather event', WEATHER_EVENT],
  ] as const) {
    it(`no template asserts ${name}`, () => {
      const offenders = ALL
        .filter(([, t]) => pattern.test(fieldsOf(t)))
        .map(([set, t]) => `${set}/${t.id}: ${fieldsOf(t).slice(0, 120)}`);
      expect(offenders, `\n${offenders.join('\n')}\n`).toEqual([]);
    });
  }

  it('scans every set and every template, so the guard is not accidentally narrow', () => {
    expect(Object.keys(INDUSTRY_TEMPLATES).sort())
      .toEqual(['generic', 'hvac', 'irrigation', 'pest control', 'plumbing', 'roofing']);
    expect(ALL.length).toBe(54);   // six sets x nine
  });

  // Proof the patterns are not inert — the exact strings this PR removed.
  const REMOVED = [
    'limited time discount offer on our pest control services',
    'offer a free home pest inspection to new customers',
    'limited time discount on HVAC maintenance or installation',
    'offer a free estimate on HVAC replacement or repair',
    'limited time discount on plumbing repair or water heater service',
    'offer a free estimate on plumbing repairs',
    'limited time discount on roof inspection or repair',
    'offer a free roof inspection after recent storms',
    'recent storms can cause hidden roof damage — get inspected',
    'limited time discount on our services — call today',
    'offer a free estimate or consultation to new customers',
  ];
  for (const literal of REMOVED) {
    it(`still catches the removed prompt: ${literal.slice(0, 44)}…`, () => {
      expect(FREE_OFFER.test(literal) || DISCOUNT.test(literal) || WEATHER_EVENT.test(literal)).toBe(true);
    });
  }

  // …and not over-broad. These survive in the file and must NOT be flagged.
  const KEPT = [
    'cold weather can freeze pipes — call us before it happens',
    'what winterizing a sprinkler system involves and why it matters before a freeze',
    'hot/wet/cold weather increases pest activity — call us',
    'what a seasonal roof check looks for, and why it is better done before bad weather than after',
    'invite the reader to get in touch about an estimate for plumbing repairs',
  ];
  for (const literal of KEPT) {
    it(`does not fire on: ${literal.slice(0, 44)}…`, () => {
      expect(FREE_OFFER.test(literal)).toBe(false);
      expect(DISCOUNT.test(literal)).toBe(false);
      expect(WEATHER_EVENT.test(literal)).toBe(false);
    });
  }
});

describe('an offer template is unusable until the owner supplies the offer', () => {
  const promos = ALL.filter(([, t]) => t.ownerInput);

  it('every set that sells a promotion has exactly one owner-supplied template', () => {
    // irrigation is deliberately absent: the set S285 added has NO offer
    // template at all, which is the proof this category is optional rather than
    // load-bearing. Nine templates, none of them an offer.
    expect(promos.map(([set]) => set).sort())
      .toEqual(['generic', 'hvac', 'pest control', 'plumbing', 'roofing']);
    expect(INDUSTRY_TEMPLATES['irrigation'].some((t) => t.ownerInput)).toBe(false);
    expect(INDUSTRY_TEMPLATES['irrigation']).toHaveLength(9);
  });

  for (const [set, t] of promos) {
    it(`${set}/${t.id} cannot be used with an empty offer`, () => {
      expect(fillTemplate(t, 'Acme', '')).toBeNull();
      expect(fillTemplate(t, 'Acme', '   ')).toBeNull();
      expect(fillTemplate(t, 'Acme')).toBeNull();
    });

    it(`${set}/${t.id} carries no default and no example offer in its placeholder`, () => {
      expect(t.topicPrompt).toContain('{offer}');
      expect(FREE_OFFER.test(t.ownerInput!.placeholder)).toBe(false);
      expect(DISCOUNT.test(t.ownerInput!.placeholder)).toBe(false);
      // Nothing that reads as a ready-made offer: no money, no percentage.
      expect(t.ownerInput!.placeholder).not.toMatch(/\$\d|\d+\s*%/);
    });
  }
});

describe("the owner's words reach the model unchanged", () => {
  const promo = INDUSTRY_TEMPLATES['pest control'].find((t) => t.ownerInput)!;

  it('interpolates the offer verbatim', () => {
    const out = fillTemplate(promo, 'Ironclad', '$50 off the first treatment through June');
    expect(out).toContain('$50 off the first treatment through June');
  });

  it('does not paraphrase, truncate or re-word it', () => {
    const odd = "2-for-1 'spring special' — 25% off, ends 30/06, no strings";
    expect(fillTemplate(promo, 'Ironclad', odd)).toContain(odd);
  });

  it('trims surrounding whitespace only', () => {
    expect(fillTemplate(promo, 'Ironclad', '  half price  ')).toContain('half price');
    expect(fillTemplate(promo, 'Ironclad', '  half price  ')).not.toContain('  half price');
  });

  it('still interpolates businessName, and leaves no placeholder behind', () => {
    const out = fillTemplate(promo, 'Ironclad Pest Solutions', 'half price')!;
    expect(out).toContain('Ironclad Pest Solutions');
    expect(out).not.toContain('{businessName}');
    expect(out).not.toContain('{offer}');
  });

  it('a template with no owner input is unaffected and always usable', () => {
    const plain = INDUSTRY_TEMPLATES['pest control'].find((t) => !t.ownerInput)!;
    expect(fillTemplate(plain, 'Acme', '')).toBe(plain.topicPrompt.replace(/\{businessName\}/g, 'Acme'));
  });
});

// The source file is also checked directly: a NEW template added later gets
// caught by the field scan above only if it is registered in INDUSTRY_TEMPLATES.
// This catches a claim parked anywhere else in the file.
describe('the source file carries no offer literal outside a comment', () => {
  const SRC = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'composerTemplateSets.ts'), 'utf8',
  );

  it('every offer-word occurrence is inside a comment explaining the removal', () => {
    const offenders: string[] = [];
    const lines = SRC.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);
      if (isComment) continue;
      if (FREE_OFFER.test(line) || DISCOUNT.test(line) || WEATHER_EVENT.test(line)) {
        offenders.push(`${i + 1}: ${line.trim().slice(0, 110)}`);
      }
    }
    expect(offenders, `\n${offenders.join('\n')}\n`).toEqual([]);
  });
});
