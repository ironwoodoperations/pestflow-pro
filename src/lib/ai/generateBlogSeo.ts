import { supabase } from '../supabase'
import { callAi } from './callAi'

export interface BlogSeoInput {
  title: string
  content: string
  excerpt?: string
  business_name: string
  business_city?: string
  business_phone?: string
  tenant_id: string
}

export interface BlogSeoOutput {
  meta_title: string
  meta_description: string
  og_title: string
  og_description: string
  focus_keyword: string
}

export async function generateBlogSeo(input: BlogSeoInput): Promise<BlogSeoOutput> {
  const contentSnippet = input.content.replace(/<[^>]+>/g, ' ').slice(0, 1500)
  const userPrompt = [
    `Title: ${input.title}`,
    input.excerpt ? `Excerpt: ${input.excerpt}` : '',
    `Content: ${contentSnippet}`,
    `Business: ${input.business_name}`,
    input.business_city ? `City: ${input.business_city}` : '',
    input.business_phone ? `Phone: ${input.business_phone}` : '',
  ].filter(Boolean).join('\n')

  const json = await callAi('blog_seo', {
      tenant_id: input.tenant_id,
      max_tokens: 600,
      system: 'You are an SEO expert for a local service business. Generate JSON ONLY (no markdown, no preamble) with these keys: meta_title (≤60 chars), meta_description (≤160 chars), og_title (≤60 chars), og_description (≤200 chars), focus_keyword (2-4 words). Optimize for local search when business_city is provided. Do not include the business name in meta_title unless natural.',
      messages: [{ role: 'user', content: userPrompt }],
  })
  const raw = json.content?.[0]?.text || '{}'
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  return {
    meta_title: String(parsed.meta_title || '').slice(0, 60),
    meta_description: String(parsed.meta_description || '').slice(0, 160),
    og_title: String(parsed.og_title || '').slice(0, 60),
    og_description: String(parsed.og_description || '').slice(0, 200),
    focus_keyword: String(parsed.focus_keyword || ''),
  }
}

export async function autoGenBlogSeo(slug: string, tenantId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('seo_meta')
    .select('user_edited')
    .eq('tenant_id', tenantId)
    .eq('page_slug', slug)
    .maybeSingle()

  if (existing?.user_edited === true) {
    console.log('SEO meta exists (user_edited=true), skipping AI gen')
    return
  }

  const [postRes, bizRes] = await Promise.all([
    supabase.from('blog_posts').select('title,content,excerpt').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle(),
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
  ])

  if (!postRes.data) return

  const post = postRes.data
  const biz = bizRes.data?.value || {}

  const seo = await generateBlogSeo({
    title: post.title,
    content: post.content || '',
    excerpt: post.excerpt || '',
    business_name: biz.name || '',
    business_city: biz.address || biz.city || '',
    business_phone: biz.phone || '',
    tenant_id: tenantId,
  })

  await supabase.from('seo_meta').upsert(
    { tenant_id: tenantId, page_slug: slug, ...seo, user_edited: false, updated_at: new Date().toISOString() },
    { onConflict: 'tenant_id,page_slug' }
  )
}
