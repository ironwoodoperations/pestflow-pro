import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import type { EditorForm, SeoPageRow } from './seoTypes'
import { callAi } from '../../../lib/ai/callAi'
import { buildSeoMetadataPrompt } from './seoPrompts'
import { useAdminPreset } from '../../../hooks/useAdminPreset'
import { cityFromBusinessInfo } from '../../../lib/businessCity'

export function useSeoAiGenerate(
  tenantId: string,
  pages: SeoPageRow[],
  setEditorForm: (form: EditorForm) => void,
) {
  // S293 — the trade comes from the CHECK-constrained vertical, via the same
  // hook every other admin surface uses. Not from `industry` (free text: pls's
  // value is a 154-character service description) and not hardcoded.
  const { vertical } = useAdminPreset()
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
      // `p.type === 'pest'` is the SeoPageRow union's SERVICE-page member, not a
      // trade test — the union is 'pest' | 'service_area' | 'blog' | 'static'
      // and the name is legacy. Left as-is: renaming the union is a wider change.
      const activeServices = pages.filter(p => p.type === 'pest' && p.isLive).map(p => p.slug)

      // The city, parsed rather than passed whole. The old line sent
      // `City: ${biz.address}` — the entire postal address under a "City:"
      // label — falling back to the literal 'Unknown City', while the system
      // prompt REQUIRED metaTitle to include a city. That combination does not
      // permit invention, it requests it.
      const city = cityFromBusinessInfo(biz)

      const { system, user } = buildSeoMetadataPrompt({
        vertical,
        businessName: typeof biz.name === 'string' ? biz.name : '',
        city,
        slug,
        pageTitle: pc?.title || '',
        pageIntro: pc?.intro || '',
        services: activeServices,
      })

      const json = await callAi('seo_metadata', {
        tenant_id: tenantId,
        max_tokens: 512,
        system,
        messages: [{ role: 'user', content: user }],
      })
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
