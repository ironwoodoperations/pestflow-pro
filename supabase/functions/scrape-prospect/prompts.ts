// S346 — the two scrape prompts, made vertical-aware and extracted here so they
// can be unit-tested. index.ts imports createClient from esm.sh and so cannot be
// loaded by vitest; this module imports nothing but _shared, and _shared/
// verticalCopy.ts is esm-free too.
//
// Both prompts used to hardcode "pest control" — the extraction prompt opened
// "Extract business information from this pest control website content" and the
// analysis prompt "You are a web design analyst for a pest control SaaS
// platform". Pointed at a lawn company, they told the model the wrong trade.
//
// The trade noun comes from VERTICAL_COPY, which already carries the reviewed
// wording ('pest control', 'irrigation', 'lawn care') — read, never invented.
// getVerticalCopy never throws and falls back to NEUTRAL_COPY ('home services'),
// which names no trade rather than asserting the wrong one.

import { getVerticalCopy } from '../_shared/verticalCopy.ts'

/** 'pest' -> 'pest control'; unknown/absent -> 'home services'. */
export function tradeNounForPrompt(vertical?: string | null): string {
  return getVerticalCopy(vertical).tradeNoun
}

/**
 * The prospect-extraction prompt.
 *
 * NOTE THE STANDING RULE, restated because this prompt writes to page_content
 * on a public website: every field is "not found -> null". The model must not
 * infer a plausible service description from the trade noun. Inventing content
 * a client never published is the fabrication class the S283-S300 arc removed,
 * and a generalised prompt is exactly where it would come back.
 */
export function extractionPromptFor(vertical?: string | null): string {
  const trade = tradeNounForPrompt(vertical)
  return `Extract business information from this ${trade} website content. Return ONLY a JSON object with no markdown, no backticks, no explanation. Use null for any field not found. Do not infer, guess or generalise: if the website does not state it, the value is null.

Fields:
- business_name (string)
- owner_name (string)
- phone (string)
- email (string)
- address (string)
- city (string)
- state (string — 2-letter abbreviation)
- zip (string)
- hours (string)
- tagline (string)
- founded_year (string)
- tech_count (string)
- license_number (string)
- about_intro (string — 2-3 sentences)
- services (array of strings)
- service_areas (array of strings)
- facebook_url (string)
- instagram_handle (string)
- google_business_url (string)

Website content:
`
}

/**
 * The site-recreation analysis prompt.
 *
 * The body below is the pre-S346 prompt VERBATIM — shell rules, colour
 * fallbacks and all. The only edit is the trade noun in the first two lines.
 * Rewriting a working prompt while generalising it would have silently changed
 * what the model returns for the vertical that already worked.
 */
export function siteAnalysisPromptFor(vertical?: string | null): string {
  const trade = tradeNounForPrompt(vertical)
  return `You are a web design analyst for a ${trade} SaaS platform. Analyze the provided
homepage content from a ${trade} company's existing website and return a JSON
object with exactly these keys:

{
  "shell": "modern-pro" | "clean-friendly" | "bold-local" | "rustic-rugged",
  "shellReason": "one sentence explaining why this shell matches their site style",
  "primaryColor": "#hexcode — the dominant brand color from their site (buttons, nav, headings)",
  "accentColor": "#hexcode — the secondary/highlight color from their site (CTAs, accents)",
  "heroHeadline": "rewritten version of their hero headline, max 8 words, punchy",
  "ctaText": "short CTA button text, max 4 words, action-oriented"
}

Shell selection rules:
- modern-pro: dark navbar, strong contrast, professional/corporate tone, navy/dark blues
- clean-friendly: light or white backgrounds, soft tones, family-safe language, approachable
- bold-local: high energy, bold saturated colors, local pride language, impact-focused
- rustic-rugged: earthy/warm tones (browns, oranges, greens), established trust language, heritage

For colors: if you cannot determine exact hex values from the content, use the most
likely color based on the brand name, tone, and any color descriptions in the markdown.
Always return valid hex codes. Default primary to #1e3a5f and accent to #f59e0b if
truly unable to determine.

Return ONLY the JSON object. No explanation, no markdown, no backticks.`
}
