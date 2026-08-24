import { getAdminPreset, isAdminVertical } from '../../../lib/adminVerticalPreset'

// S287 — the social composer's model prompts, extracted from useComposer.ts so
// the ASSEMBLED STRING can be asserted. A helper-only test passes happily while
// the string that actually reaches the model stays wrong; S283 and S285 both
// settled on this shape for exactly that reason.
//
// TWO DEFECTS lived in the caption prompt, on one line:
//
//   REGION — `... in East Texas` was asserted for EVERY tenant. Rule (b). The
//   same claim S283 removed from ContentTab ("based in {city}, TX serving East
//   Texas", city defaulted to 'Tyler'), and removed the same way: an unknown
//   fact is OMITTED, never swapped for a different guess. There is no
//   platform-wide region.
//
//   INDUSTRY — it interpolated settings.business_info.industry, which is FREE
//   TEXT from an onboarding input. pls's stored value is 146 characters, so the
//   prompt actually read:
//
//     "You are a social media expert for a irrigation and sprinkler system
//      installation and repair, yard drainage and french drains, lake and pond
//      pump systems, sod and grading — east texas company called Precision Lawn
//      Systems in East Texas."
//
//   — an ungrammatical run-on that names East Texas twice (once hardcoded, once
//   folded to lowercase out of the industry string). The trade now comes from
//   `vertical`, the CHECK-constrained field, through the SAME admin preset the
//   rest of the dashboard reads. Not a third vocabulary.

/** 'a' / 'an', so "an irrigation service business" reads correctly. */
const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')

/**
 * The subject clause both prompts share.
 *
 * An unknown vertical yields NO TRADE — not "a service business", not a guess
 * from `industry`. Silence is the correct output when the trade is unrecorded.
 */
function subject(businessName: string, vertical: string | null | undefined): string {
  const name = businessName.trim()
  if (!isAdminVertical(vertical)) {
    return name ? `for ${name}` : 'for a business'
  }
  const service = getAdminPreset(vertical).entityLabels.service
  return name
    ? `for ${name}, ${article(service)} ${service} business`
    : `for ${article(service)} ${service} business`
}

/** ` The business is based in {city}.` — or nothing. Same wording as contentPrompt. */
function where(city: string): string {
  const c = city.trim()
  return c ? ` The business is based in ${c}.` : ''
}

// Stated every time, not only when a fact is missing: the model cannot tell
// which facts it was handed and which it inferred, and the region is precisely
// what it will reinstate if left unmentioned.
const NO_INVENT =
  'Do not state or imply a location, service area, trade, offer, discount, guarantee, price or availability that is not given above.'

export function buildCaptionPrompt(args: {
  businessName: string
  vertical: string | null | undefined
  city: string
  topic: string
  count: number
}): string {
  const { count, topic } = args
  return `You are a social media expert writing ${subject(args.businessName, args.vertical)}.${where(args.city)}\n\n`
    + `Generate exactly ${count} different Facebook/Instagram captions for a post about: "${topic}".\n\n`
    + 'Rules:\n'
    + '- Each caption must be engaging and friendly, not salesy\n'
    + '- Include relevant emojis\n'
    + '- End each with 3-5 relevant hashtags\n'
    + '- Keep each under 200 words\n'
    + `- ${NO_INVENT}\n`
    + '- Separate captions with "---CAPTION---"\n\n'
    + `Return ONLY the ${count} captions separated by "---CAPTION---". No JSON, no preamble.`
}

/**
 * The smart-schedule prompt. Same free-text `industry` interpolation, one
 * function below the caption prompt in the same file — fixing one and leaving
 * the other would have left pls's 146-character string reaching a model from
 * the line underneath the one this PR came to fix.
 */
export function buildSmartSchedulePrompt(args: {
  vertical: string | null | undefined
  platform: string
  now: Date
}): string {
  const { platform, now } = args
  const trade = isAdminVertical(args.vertical)
    ? `${article(getAdminPreset(args.vertical).entityLabels.service)} ${getAdminPreset(args.vertical).entityLabels.service} business`
    // Not "a local business": even 'local' is a claim, and it is one the
    // platform does not know for a tenant whose trade is unrecorded.
    : 'a business'
  return `You are a social media scheduling expert. ${trade.charAt(0).toUpperCase()}${trade.slice(1)} wants to post on ${platform}. `
    + `Recommend the single best day and time to post this week. Today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}, `
    + `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.\n\n`
    + 'Return ONLY a JSON object, no preamble, no backticks:\n'
    + '{"scheduled_for": "YYYY-MM-DDTHH:mm:00", "reasoning": "One sentence."}\n\n'
    + 'Must be future datetime within 7 days. Use 24-hour time.'
}
