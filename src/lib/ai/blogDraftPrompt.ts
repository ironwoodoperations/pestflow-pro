// S293 PR B — the blog-draft system prompt, extracted so the ASSEMBLED STRING
// can be asserted. A helper-only test passes while the string reaching the
// model still says "a local pest control business".
//
// WAS: "You are a content writer for a local pest control business." — for
// every tenant, whatever their trade. Its output is offered to the operator as
// a draft, so it is one Save away from blog_posts.
import { tradeNounFor } from '../../../supabase/functions/_shared/provisioningSeed';

export interface BlogDraftPromptArgs {
  vertical: string | null | undefined;
  tone: string;
  /** '' when the tenant's city is unknown — the clause is then omitted. */
  city?: string;
}

/**
 * An unrecorded vertical names NO trade — not "a local service business", not
 * "home services". The topic the operator typed is what the post is about, and
 * that is a tenant fact already.
 */
export function buildBlogDraftSystemPrompt(args: BlogDraftPromptArgs): string {
  const noun = tradeNounFor(args.vertical);
  const city = (args.city || '').trim();

  return [
    `You are a content writer for a local business${noun ? ` in the ${noun} trade` : ''}.`,
    'Write helpful, locally relevant, SEO-friendly blog posts.',
    'Output JSON ONLY (no markdown, no preamble) with title, slug (kebab-case),',
    'excerpt (1-2 sentences), content (clean HTML using h2/h3/p/ul/strong tags, no inline styles, no images).',
    `Target word_count ± 10%. Tone: ${args.tone}.`,
    city ? `Mention ${city} naturally where it fits.` : 'Do not name any city, region or service area.',
    '',
    // BAN-LIST START — negations. Excised by seoPrompts.test.ts's whole-file
    // claim scan; see the note on NO_INVENT in seoPrompts.ts.
    'DO NOT INVENT ANYTHING. Specifically, do not state or imply:',
    '- any trade, industry or specialty beyond what is stated above',
    '- certifications, licences, registrations, approvals, or product/chemical claims',
    '- guarantees, warranties, or refund promises',
    '- free offers, discounts, or prices',
    '- response times, availability, or scheduling promises',
    '- years in business, number of staff, customer counts, awards, or ratings',
    '- recent weather, storms, or seasonal events the business has responded to',
    // BAN-LIST END
    'Writing around a missing fact is correct; filling it in is not.',
  ].join('\n');
}
