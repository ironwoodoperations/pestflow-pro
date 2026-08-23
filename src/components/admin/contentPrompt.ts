// S283 — extracted from ContentTab.tsx. It lives in its own module because
// eslint's react-refresh/only-export-components rule is right: a component file
// that also exports a plain function breaks fast refresh. The extraction is
// also what makes the prompt testable — the assembled string is the thing that
// can be wrong, and a prompt built inside a component body is a prompt no test
// can read.
// S283 — the AI page-copy prompt. Vertical-neutral by construction.
//
// It USED to open "You are a marketing copywriter for a professional pest
// control company based in Tyler, TX serving East Texas" and go on to demand
// "EPA-approved, family-safe" treatments, a "free inspection", a "satisfaction
// guarantee", and name-checks for Longview and Jacksonville. Every one of those
// is a fabrication under rule (b), and the fabrication survived into saved page
// content: an irrigation tenant in another state clicking Generate got pest
// copy about a city they have never worked in, offering a guarantee they never
// made.
//
// Three separate defects, fixed three ways:
//
//   TRADE — named no matter what the tenant actually does. This function now
//   names no trade at all. It does not need one: the page's own slug says what
//   the page is about ("spider control", "sprinkler repair"), and that slug is
//   a tenant fact already in the database. Nothing is inferred from it.
//
//   PLACEHOLDER FACTS — `businessName || 'a professional pest control company'`
//   and `businessCity || 'Tyler'` invented a company and a city whenever the
//   real ones were missing. An unknown fact is now OMITTED, and the model is
//   told explicitly not to fill the gap. Rendering nothing is correct.
//
//   INSTRUCTED CLAIMS — the prompt did not merely permit invented claims, it
//   REQUESTED them. Those instructions are deleted and replaced with a ban.
//
// This is a module-level pure function on purpose: the assembled prompt string
// is the thing that can be wrong, and a prompt built inside a component body is
// a prompt no test can read.
export function buildContentPrompt(args: {
  slug: string
  businessName: string
  businessCity: string
  /** True for the standard service-page slugs, which get a longer brief. */
  isServicePage: boolean
}): string {
  const name = args.businessName.trim()
  const city = args.businessCity.trim()
  const pageName = args.slug.replace(/-/g, ' ').trim()

  const who = name
    ? `You are a marketing copywriter for ${name}.`
    : 'You are a marketing copywriter for a local service business.'
  const where = city ? ` The business is based in ${city}.` : ''

  // Stated every time, not only when a fact is missing. The model has no way to
  // know which of these it was handed and which it inferred.
  const noInvent =
    'DO NOT INVENT ANYTHING. Use only the facts given above. Specifically, do not state or imply:\n' +
    '- any trade, industry or specialty beyond what the page name itself says\n' +
    (city ? '- any city, region or service area other than the one given\n' : '- any city, region or service area\n') +
    (name ? '' : '- any business name\n') +
    '- certifications, licences, registrations, approvals, or product/chemical claims (such as being approved by any agency, or safe for children or pets)\n' +
    '- guarantees, warranties, or refund promises\n' +
    '- free offers, discounts, or prices\n' +
    '- response times, availability, or scheduling promises\n' +
    '- years in business, number of staff, customer counts, awards, or ratings\n' +
    'If a fact is not given above, leave it out. Writing around a missing fact is correct; filling it in is not.'

  const json = 'Respond ONLY with a JSON object, no markdown, no explanation:\n{"title": "...", "subtitle": "...", "intro": "..."}'

  if (args.isServicePage) {
    return `${who}${where}\n\nWrite SEO-optimized copy for the "${pageName}" service page.\n\n` +
      `Requirements:\n` +
      `- Title: name the service${city ? ' and the location' : ''} (60 chars max)\n` +
      `- Subtitle: clear and specific (100 chars max)\n` +
      `- Intro: 2-3 paragraphs (300-400 words) covering:\n` +
      `  • what the problem looks like for a homeowner, and how they would notice it\n` +
      `  • how the work is carried out, in plain language\n` +
      `  • what the customer can expect during and after the visit\n` +
      `  • a call to action: invite the reader to get in touch\n\n` +
      `${noInvent}\n\n${json}`
  }

  return `${who}${where}\n\nWrite marketing copy for the "${pageName}" page.\n\n` +
    `Requirements:\n` +
    `- Title: 60 chars max\n` +
    `- Subtitle: 100 chars max\n` +
    `- Intro: 2-3 paragraphs (300-400 words). Be specific about the work itself rather than generic. End with an invitation to get in touch.\n\n` +
    `${noInvent}\n\n${json}\n\nPage: ${args.slug}`
}
