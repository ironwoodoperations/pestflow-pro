import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import type { EditorForm, SeoPageRow } from './seoTypes'

export function useSeoAiGenerate(
  tenantId: string,
  pages: SeoPageRow[],
  setEditorForm: (form: EditorForm) => void,
) {
  const [aiGenerating, setAiGenerating] = useState<string | null>(null)
  const [aiGeneratedSlug, setAiGeneratedSlug] = useState<string | null>(null)

  const handleAiGenerate = async (slug: string) => {
    if (!tenantId) return
    setAiGenerating(slug)
    setAiGeneratedSlug(null)
    try {
      const [bizRes, pageRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('page_content').select('title,intro').eq('tenant_id', tenantId).eq('page_slug', slug).maybeSingle(),
      ])
      const biz = bizRes.data?.value || {}
      const pc = pageRes.data
      const activeServices = pages.filter(p => p.type === 'pest' && p.isLive).map(p => p.slug).join(', ')

      const userMsg = `Business: ${biz.name || 'Unknown'}
City: ${biz.address || biz.city || 'Unknown City'}
Page: ${slug}
Page title: ${pc?.title || 'not set'}
Page intro: ${pc?.intro ? pc.intro.slice(0, 200) : 'not set'}
Services offered: ${activeServices || 'pest control'}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          system: 'You are an SEO specialist for pest control websites. Generate SEO metadata for the given page. Return ONLY a JSON object with these exact keys: metaTitle, metaDescription, focusKeyword, ogTitle, ogDescription. Rules: metaTitle 50-60 chars, includes city and primary keyword. metaDescription 150-160 chars, compelling, includes CTA. focusKeyword: 2-4 word phrase. ogTitle: same as metaTitle or slight variation. ogDescription: same as metaDescription or slight variation. No markdown, no backticks, JSON only.',
          messages: [{ role: 'user', content: userMsg }],
        }),
      })
      const json = await res.json()
      const raw = json.content?.[0]?.text || '{}'
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setEditorForm({
        meta_title: parsed.metaTitle || '',
        meta_description: parsed.metaDescription || '',
        focus_keyword: parsed.focusKeyword || '',
        og_title: parsed.ogTitle || '',
        og_description: parsed.ogDescription || '',
      })
      setAiGeneratedSlug(slug)
    } catch {
      toast.error('AI generation failed. Please try again.')
    } finally {
      setAiGenerating(null)
    }
  }

  return { aiGenerating, aiGeneratedSlug, handleAiGenerate }
}
