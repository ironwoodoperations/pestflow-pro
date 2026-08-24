// S293 PR B — the assembled strings the SEO admin sends to the model, and the
// one it writes straight to the database.
//
// Extracted because the ASSEMBLED STRING is the thing that can be wrong. A
// helper-only test passes while the string reaching the model still says "pest
// control company in East Texas". Settled practice: S283 narrationPrompt.ts,
// S285 contentPrompt.ts, S287 captionPrompt.ts.
//
// NO FIFTH VOCABULARY MODULE. Four exist and are deliberately separate; the
// trade nouns here come from S290's provisioningSeed (tradeNounFor /
// tradeTitleFor), which is already the tested source for exactly this — a
// lowercase trade noun keyed on the CHECK-constrained `vertical`, returning ''
// for an unrecorded one. The vertical itself arrives from useAdminPreset.
//
// THE TWO RULES, applied the way PR A applied them:
//   (a) a preset holds only what is true of the whole TRADE. The tenant's city,
//       name and service list are tenant facts and are passed in, never guessed.
//   (b) never fabricate. An unrecorded vertical yields NO trade — the clause is
//       OMITTED, not genericised. There is no "local service business" stand-in
//       here for the same reason PR A omits knowsAbout rather than emitting
//       "Home Services".
import { tradeNounFor, tradeTitleFor } from '../../../../supabase/functions/_shared/provisioningSeed';

/**
 * Shared ban list. Stated every time, not only when a fact is missing.
 *
 * The markers below are load-bearing: seoPrompts.test.ts scans every OTHER
 * string literal in this file for claim vocabulary and excises this region by
 * them. Without the markers a bullet that FORBIDS a guarantee reads identically
 * to a line that instructs one. Do not remove them, and do not put an
 * instruction inside them.
 */
// BAN-LIST START
const NO_INVENT = [
  'DO NOT INVENT ANYTHING. Use only the facts given above. Specifically, do not state or imply:',
  '- any trade, industry or specialty beyond what is stated above',
  '- any city, region or service area beyond what is stated above',
  '- certifications, licences, registrations, approvals, or product/chemical claims',
  '- guarantees, warranties, or refund promises',
  '- free offers, discounts, or prices',
  '- response times, availability, or scheduling promises',
  '- years in business, number of staff, customer counts, awards, or ratings',
  '- recent weather, storms, or seasonal events',
  'If a fact is not given above, leave it out. Writing around a missing fact is correct; filling it in is not.',
].join('\n');
// BAN-LIST END

/** " for pest control websites" — or nothing at all when the trade is unrecorded. */
function tradeClause(vertical: string | null | undefined, template: (noun: string) => string): string {
  const noun = tradeNounFor(vertical);
  return noun ? template(noun) : '';
}

export interface SeoMetadataPromptArgs {
  vertical: string | null | undefined;
  businessName: string;
  /** The tenant's city, parsed from their address. '' when unknown. */
  city: string;
  slug: string;
  pageTitle: string;
  pageIntro: string;
  /** The tenant's own live service page slugs. Empty when they have none. */
  services: string[];
}

/**
 * settings → SEO metadata for one page.
 *
 * WAS: system "You are an SEO specialist for pest control websites", a
 * `Services offered: … || 'pest control'` fallback, and `City: ${address || 'Unknown City'}`
 * paired with a rule requiring metaTitle to "include city" — which instructs the
 * model to invent a city when it has none. All three removed.
 */
export function buildSeoMetadataPrompt(args: SeoMetadataPromptArgs): { system: string; user: string } {
  const name = (args.businessName || '').trim();
  const city = (args.city || '').trim();
  const services = (args.services || []).filter(Boolean);

  const system = [
    `You are an SEO specialist${tradeClause(args.vertical, (n) => ` for ${n} businesses`)}.`,
    'Generate SEO metadata for the given page. Return ONLY a JSON object with these exact keys:',
    'metaTitle, metaDescription, focusKeyword, ogTitle, ogDescription.',
    'Rules: metaTitle 50-60 chars' + (city ? ', includes the city and primary keyword' : ', includes the primary keyword') + '.',
    'metaDescription 150-160 chars, compelling, ends with an invitation to get in touch.',
    'focusKeyword: 2-4 word phrase.',
    'ogTitle: same as metaTitle or slight variation. ogDescription: same as metaDescription or slight variation.',
    'No markdown, no backticks, JSON only.',
    '',
    NO_INVENT,
  ].join('\n');

  const user = [
    name ? `Business: ${name}` : '',
    city ? `City: ${city}` : '',
    `Page: ${args.slug}`,
    args.pageTitle ? `Page title: ${args.pageTitle}` : '',
    args.pageIntro ? `Page intro: ${args.pageIntro.slice(0, 200)}` : '',
    services.length > 0 ? `Services offered: ${services.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return { system, user };
}

export interface KeywordsPromptArgs {
  vertical: string | null | undefined;
  page: string;
  topic: string;
  businessName: string;
  city: string;
}

/**
 * Keyword suggestions for one page.
 *
 * WAS, for EVERY tenant regardless of trade or location:
 *   "You are an SEO expert for a pest control company in East Texas."
 *   "Business: local pest control serving Tyler TX and surrounding East Texas cities."
 *   example keyword: "spider control tyler tx"
 *
 * Three fabrications in one string — a trade, a region, and a city — reaching
 * an irrigation tenant in Hawkins and a medical-aesthetics clinic. The worked
 * example is now built from the tenant's own facts, or dropped entirely when
 * there are none: an example containing a guessed city teaches the model to
 * guess one back.
 */
export function buildKeywordsPrompt(args: KeywordsPromptArgs): string {
  const name = (args.businessName || '').trim();
  const city = (args.city || '').trim();
  const noun = tradeNounFor(args.vertical);

  // The example is the sharpest fabrication risk: whatever it contains, the
  // model copies. Built only from facts we have; omitted when we have neither.
  const exampleKeyword = [noun, city.toLowerCase()].filter(Boolean).join(' ');

  return [
    `You are an SEO expert${noun ? ` for ${noun} businesses` : ''}.`,
    `Generate 10 keyword suggestions for the page: "${args.page}"`,
    `Focus topic: "${args.topic}"`,
    name ? `Business: ${name}` : '',
    city ? `Location: ${city}` : '',
    '',
    'Respond ONLY with a JSON array, no markdown, no explanation:',
    '[',
    exampleKeyword
      ? `  { "keyword": "${exampleKeyword}", "intent": "transactional", "difficulty": "low", "priority": "high" },`
      : '  { "keyword": "<a keyword for this page>", "intent": "transactional", "difficulty": "low", "priority": "high" },',
    '  ...',
    ']',
    '',
    'Intent options: transactional | informational | local',
    'Difficulty options: low | medium | high',
    'Priority options: high | medium | low',
    '',
    NO_INVENT,
  ].filter((line) => line !== undefined).join('\n');
}

export interface AioFallbackArgs {
  vertical: string | null | undefined;
  keywords: string[];
  businessName: string;
  city: string;
}

/**
 * The AIO tab's meta_description fallback — NOT a prompt. This string is
 * UPSERTED straight into `seo_meta.meta_description`, which is what
 * buildPageMetadata renders as the public `<meta name="description">`.
 *
 * WAS: `${keywords} — professional pest control in East Texas.`
 *
 * Written to the database, published, and indexable — for every tenant. It
 * fires whenever the page has no existing description, and "Sync All" walks
 * every page in one click. vita-glow has ZERO seo_meta rows, so every page it
 * syncs takes this branch.
 *
 * Now: the keywords (the tenant's own), plus a trade clause ONLY when the trade
 * is recorded and a location clause ONLY when the tenant supplied one. With
 * neither, the keywords stand alone — which is honest, and is what the operator
 * can then edit.
 */
export function buildAioFallbackDescription(args: AioFallbackArgs): string {
  const keywords = (args.keywords || []).filter(Boolean);
  const city = (args.city || '').trim();
  const title = tradeTitleFor(args.vertical);
  const name = (args.businessName || '').trim();

  const head = keywords.join(', ');
  const tail = [
    title ? `${title} services` : '',
    name ? `from ${name}` : '',
    city ? `in ${city}` : '',
  ].filter(Boolean).join(' ');

  if (!head) return tail ? `${tail}.` : '';
  return tail ? `${head} — ${tail}.` : `${head}.`;
}
