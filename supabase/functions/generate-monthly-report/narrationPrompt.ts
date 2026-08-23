import { getVerticalCopy, isKnownVertical } from '../_shared/verticalCopy.ts';
import type { VerticalCopy } from '../_shared/verticalCopy.ts';

// S283 — the narration system prompt, extracted from index.ts so it can be
// asserted as an ASSEMBLED STRING.
//
// Why this file exists at all: index.ts imports from https: URLs (the Supabase
// client, std/http), which vitest cannot load, so anything built inside it is
// unreachable by the test suite. A test of getVerticalCopy() alone would pass
// happily while the prompt that actually reaches the model still said
// "pest-control business owner" — the helper is not the thing that can be
// wrong. This module has no https: imports and no I/O, so the real prompt
// string is testable byte-for-byte.
//
// Only the trade nouns vary. PLATFORM_RULES below is lifted verbatim from
// index.ts and is NOT parameterised by vertical: it exists to stop the model
// inventing WordPress, Yoast, Rank Math and Google Search Console, and that
// failure mode has nothing to do with what trade the tenant is in. A persona
// change must not be allowed to drop or reword it, so the tests assert it is
// present byte-identical in all three vertical branches.

export const PLATFORM_RULES =
  'PLATFORM RULES (highest priority — never violate, even if it means a fix step must be more general):\n' +
  '- The owner\'s website lives entirely on the PestFlow Pro platform. Every change they make happens inside the PestFlow Pro admin dashboard. Assume PestFlow Pro is the only system they ever log into to work on their website.\n' +
  '- NEVER name, suggest, or reference any other tool, plugin, CMS, platform, or software — not by name and not generically. This includes (but is not limited to) WordPress, Wix, Squarespace, Webflow, Yoast, Rank Math, Google Search Console, Google Business Profile settings, "your SEO plugin," "your CMS," "your website builder," or any external analytics or SEO tool. The owner does not use them and has no access to them.\n' +
  '- For a finding about ONE specific page, direct the owner to SEO -> Pages in PestFlow Pro and edit that page (e.g. "In PestFlow Pro, go to SEO -> Pages and edit the title and description for this page"). For a finding that is clearly site-wide (such as duplicate titles across pages, page-2 search rankings, or site speed), describe what to adjust in PestFlow Pro in general terms — do NOT pretend there is a single page to click, and do NOT invent menus, tabs, or settings that aren\'t obviously implied.\n' +
  '- If you don\'t know the exact button or tab name, describe the action in simple generic terms inside PestFlow Pro (e.g. "edit the page\'s description field") rather than guessing a specific control or mentioning any outside tool.\n\n';

// Said only when the vertical is NOT recorded. Without it the model fills the
// silence: asked to write for "a business owner" about a website full of
// service pages, it reaches for whatever trade the examples suggest. This makes
// the absence explicit rather than leaving it to be inferred.
export const NO_TRADE_RULE =
  'TRADE: this business\'s trade is not recorded. Do NOT name, guess, or imply any specific trade or industry anywhere in your output — refer to "the business", "the work", and "your customers" in general terms.\n\n';

/**
 * Assemble the narration system prompt for one tenant.
 *
 * @param vertical settings.business_info.vertical, exactly as stored.
 *                 null / absent / unrecognised -> trade-neutral, never pest.
 */
export function buildNarrationSystemPrompt(vertical: string | null | undefined): string {
  const copy: VerticalCopy = getVerticalCopy(vertical);
  const persona =
    'You write a monthly website report for ' + copy.ownerNoun + ' with no SEO background.\n\n';
  const trade = isKnownVertical(vertical) ? '' : NO_TRADE_RULE;
  return persona + trade + PLATFORM_RULES + TASK(copy);
}

function TASK(copy: VerticalCopy): string {
  return (
  'TASK: Rephrase each finding into friendly, encouraging plain-English guidance, following the platform rules above: (1) what is going on, (2) why it matters for getting more ' + copy.callNoun + ', and (3) the step to fix it inside PestFlow Pro. DO NOT invent findings, numbers, or pages that are not in the input. Keep each to 2–4 short sentences. Return ONLY a JSON object keyed by the finding id, where each value is the guidance string. No markdown.'
  );
}
