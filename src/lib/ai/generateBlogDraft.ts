import { callAi } from './callAi'
import { buildBlogDraftSystemPrompt } from './blogDraftPrompt'

export interface BlogDraftInput {
  topic: string
  tone: 'informative' | 'conversational' | 'authoritative'
  word_count: number
  business_name: string
  business_city?: string
  /** settings.business_info.vertical. NULL/absent => the prompt names no trade. */
  vertical?: string | null
  tenant_id: string
}

export interface BlogDraftOutput {
  title: string
  slug: string
  excerpt: string
  content: string
}

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export async function generateBlogDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
  const userPrompt = [
    `Topic: ${input.topic}`,
    `Business: ${input.business_name}`,
    input.business_city ? `City: ${input.business_city}` : '',
    `Target word count: ${input.word_count}`,
  ].filter(Boolean).join('\n')

  const json = await callAi('blog_draft', {
      tenant_id: input.tenant_id,
      max_tokens: 3500,
      system: buildBlogDraftSystemPrompt({
        vertical: input.vertical,
        tone: input.tone,
        city: input.business_city,
      }),
      messages: [{ role: 'user', content: userPrompt }],
  })
  const raw = json.content?.[0]?.text || '{}'
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

  const title = String(parsed.title || '').slice(0, 70)
  const slug = parsed.slug && /^[a-z0-9-]+$/.test(String(parsed.slug))
    ? String(parsed.slug)
    : toSlug(title)

  return {
    title,
    slug,
    excerpt: String(parsed.excerpt || '').slice(0, 200),
    content: String(parsed.content || ''),
  }
}
