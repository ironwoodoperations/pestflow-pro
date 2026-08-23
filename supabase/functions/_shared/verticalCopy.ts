// S283 — trade vocabulary for GENERATED copy, keyed by settings.business_info.vertical.
//
// THE TWO RULES this exists to serve:
//   (a) a vertical preset holds only what is true of the whole TRADE. Nothing
//       here is a tenant fact — no warranty, no licence, no region, no
//       scheduling promise. Those live in the database.
//   (b) never fabricate. An unknown vertical resolves to NEUTRAL, never to a
//       specific trade. Defaulting an unknown tenant to pest control IS
//       fabrication: it puts words about someone else's trade in their mouth.
//
// This stays in CODE, not in a table. It is the vocabulary a prompt is written
// against — it changes when a preset is written, in the same commit as the
// prompt that consumes it, and it must be reviewable in a diff. A tenant with
// DB-level control over the nouns fed to a model is a content-injection
// surface, and a missing row would silently degrade to no vocabulary at all.
//
// KEYS: 'pest' and 'irrigation' are the only two literals the live CHECK
// constraint settings_business_info_vertical_valid accepts (S281). Not
// 'pest-control', not 'pest_control' — either is rejected at write time with
// 23514. Widen this map in the same change that widens that constraint.
//
// There is deliberately NO null-as-pest branch. NULL is a real, current state
// with a deliberate consumer, and it means "not recorded", not "pest".

export interface VerticalCopy {
  /** The trade itself. "pest control", "irrigation". */
  tradeNoun: string;
  /** Who the copy is addressed to. "a pest-control business owner". */
  ownerNoun: string;
  /** What a converted visitor produces. "pest-control phone calls". */
  callNoun: string;
}

export const VERTICAL_COPY: Record<string, VerticalCopy> = {
  pest: {
    tradeNoun: 'pest control',
    ownerNoun: 'a pest-control business owner',
    callNoun: 'pest-control phone calls',
  },
  irrigation: {
    tradeNoun: 'irrigation',
    ownerNoun: 'an irrigation business owner',
    callNoun: 'irrigation phone calls',
  },
};

// The fallback names no trade. "a business owner" and "phone calls" are true of
// every tenant on the platform and assert nothing about what any of them does.
export const NEUTRAL_COPY: VerticalCopy = {
  tradeNoun: 'home services',
  ownerNoun: 'a business owner',
  callNoun: 'phone calls',
};

/**
 * True only for a vertical this module has a preset for. Callers use it to
 * decide whether they may name a trade at all — a caller that only reads
 * getVerticalCopy() cannot tell a real preset from the neutral fallback, and
 * would happily write trade-specific framing around trade-neutral nouns.
 */
export function isKnownVertical(vertical: string | null | undefined): boolean {
  return typeof vertical === 'string' && Object.prototype.hasOwnProperty.call(VERTICAL_COPY, vertical);
}

/** Never throws, never returns undefined. Unknown/absent -> NEUTRAL_COPY. */
export function getVerticalCopy(vertical: string | null | undefined): VerticalCopy {
  return isKnownVertical(vertical) ? VERTICAL_COPY[vertical as string] : NEUTRAL_COPY;
}
