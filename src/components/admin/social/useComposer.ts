import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import { usePlan } from '../../../context/PlanContext'
import { usePublishPost } from './usePublishPost'
import { AI_DAILY_LIMITS, POSTS_PER_GENERATION, SCHEDULING_DAY_CAP } from './socialLimits'
import { resizeImage } from './lib/resizeImage'

export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export interface ComposerForm {
  platform: string
  caption: string
  imageUrl: string
  scheduleMode: 'now' | 'later' | 'smart'
  scheduledFor: string
}

export function useComposer(onPosted?: () => void, onCaptionGenerated?: () => void) {
  const { id: tenantId } = useTenant()
  const { tier } = usePlan()
  const aiDailyLimit = AI_DAILY_LIMITS[tier] ?? 2
  const postsPerGeneration = POSTS_PER_GENERATION[tier] ?? 1
  const schedulingDayCap = SCHEDULING_DAY_CAP[tier] ?? 0

  const [form, setForm] = useState<ComposerForm>({
    platform: 'facebook', caption: '', imageUrl: '',
    scheduleMode: 'now', scheduledFor: '',
  })
  const [aiTopic, setAiTopic] = useState('')
  const [aiCaptions, setAiCaptions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [businessName, setBusinessName] = useState('Your Business')
  const [industry, setIndustry] = useState('Pest Control')
  const [loading, setLoading] = useState(true)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [previewUrl, setPreviewUrl] = useState('')
  const [smartSchedule, setSmartSchedule] = useState<{ scheduled_for: string; reasoning: string } | null>(null)
  const [smartLoading, setSmartLoading] = useState(false)
  const [aiDailyCount, setAiDailyCount] = useState(0)
  const captionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('social_posts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('ai_generated', true).gte('created_at', new Date().toISOString().split('T')[0]),
    ]).then(([bizRes, countRes]) => {
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (bizRes.data?.value?.industry) setIndustry(bizRes.data.value.industry)
      setAiDailyCount(countRes.count || 0)
      setLoading(false)
    })
  }, [tenantId])

  function resetForm() {
    setForm({ platform: 'facebook', caption: '', imageUrl: '', scheduleMode: 'now', scheduledFor: '' })
    setEditingPostId(null); setAiCaptions([]); setAiTopic(''); setSmartSchedule(null)
    setUploadState('idle')
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return '' })
  }

  async function handleFileUpload(file: File) {
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setUploadState('uploading')
    try {
      const resized = await resizeImage(file)
      const filename = `${crypto.randomUUID()}.jpg`
      const path = `${tenantId}/social/${filename}`
      const { error: uploadError } = await supabase.storage
        .from('social-uploads')
        .upload(path, resized, { contentType: 'image/jpeg', cacheControl: '3600' })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('social-uploads')
        .getPublicUrl(path)
      setForm(p => ({ ...p, imageUrl: publicUrl }))
      setUploadState('success')
    } catch (err) {
      console.error('[useComposer] image upload failed:', err)
      setUploadState('error')
    }
  }

  const generateCaptions = useCallback(async () => {
    if (!aiTopic.trim()) return
    if (aiDailyLimit !== Infinity && aiDailyCount >= aiDailyLimit) return
    setAiLoading(true); setAiError(''); setAiCaptions([])
    const count = postsPerGeneration
    const prompt = `You are a social media expert for a ${industry.toLowerCase()} company called ${businessName} in East Texas. Generate exactly ${count} different Facebook/Instagram captions for a post about: "${aiTopic}".\n\nRules:\n- Each caption must be engaging and friendly, not salesy\n- Include relevant emojis\n- End each with 3-5 relevant hashtags\n- Keep each under 200 words\n- Separate captions with "---CAPTION---"\n\nReturn ONLY the ${count} captions separated by "---CAPTION---". No JSON, no preamble.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (data.error) { setAiError(data.error.message || 'AI request failed.'); setAiLoading(false); return }
      const text = data.content[0].text
      const captions = text.split('---CAPTION---').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
      setAiCaptions(captions.slice(0, count))
      setAiDailyCount(c => c + 1)
      onCaptionGenerated?.()
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate captions.')
    }
    setAiLoading(false)
  }, [aiTopic, industry, businessName, aiDailyLimit, aiDailyCount, postsPerGeneration, onCaptionGenerated])

  async function getSmartSchedule() {
    setSmartLoading(true); setSmartSchedule(null)
    const now = new Date()
    const prompt = `You are a social media scheduling expert. A ${industry.toLowerCase()} business wants to post on ${form.platform}. Recommend the single best day and time to post this week. Today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.\n\nReturn ONLY a JSON object, no preamble, no backticks:\n{"scheduled_for": "YYYY-MM-DDTHH:mm:00", "reasoning": "One sentence."}\n\nMust be future datetime within 7 days. Use 24-hour time.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (data.error) { setForm(p => ({ ...p, scheduleMode: 'later' })); setSmartLoading(false); return }
      const text = data.content[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const result = JSON.parse(clean)
      setSmartSchedule(result)
      setForm(p => ({ ...p, scheduledFor: result.scheduled_for.substring(0, 16) }))
    } catch { setForm(p => ({ ...p, scheduleMode: 'later' })) }
    setSmartLoading(false)
  }

  function appendEmoji(emoji: string) {
    const ta = captionRef.current
    if (ta) {
      const start = ta.selectionStart; const end = ta.selectionEnd
      const newCaption = form.caption.substring(0, start) + emoji + form.caption.substring(end)
      setForm(p => ({ ...p, caption: newCaption }))
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus() }, 0)
    } else { setForm(p => ({ ...p, caption: p.caption + emoji })) }
  }

  const charLimit = form.platform === 'instagram' ? 2200 : 63206

  const { publishNow, saveAsDraft, publishing, saving } = usePublishPost({
    tenantId, tier, form, aiCaptions, editingPostId, onPosted, resetForm,
  })

  return {
    form, setForm, aiTopic, setAiTopic, aiCaptions, aiLoading, aiError,
    aiDailyCount, aiDailyLimit, postsPerGeneration, schedulingDayCap,
    publishing, saving,
    businessName, industry, loading, editingPostId, smartSchedule,
    smartLoading, captionRef, charLimit, tier,
    uploadState, previewUrl,
    generateCaptions, getSmartSchedule,
    saveAsDraft, publishNow, appendEmoji, resetForm, handleFileUpload,
  }
}
