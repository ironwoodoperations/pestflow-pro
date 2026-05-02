const API_URL = 'https://api.anthropic.com/v1/messages'

export interface BlogDraftInput {
  topic: string
  tone: 'informative' | 'conversational' | 'authoritative'
  word_count: number
  business_name: string
  business_city?: string
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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set')

  const userPrompt = [
    `Topic: ${input.topic}`,
    `Business: ${input.business_name}`,
    input.business_city ? `City: ${input.business_city}` : '',
    `Target word count: ${input.word_count}`,
  ].filter(Boolean).join('\n')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      system: `You are a content writer for a local pest control business. Write helpful, locally relevant, SEO-friendly blog posts. Output JSON ONLY (no markdown, no preamble) with title, slug (kebab-case), excerpt (1-2 sentences), content (clean HTML using h2/h3/p/ul/strong tags, no inline styles, no images). Target word_count ± 10%. Tone: ${input.tone}. Include the city naturally if provided.`,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`)
  const json = await res.json()
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
