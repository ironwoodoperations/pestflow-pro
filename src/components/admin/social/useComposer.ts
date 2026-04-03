import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'

export interface ComposerForm {
  platform: 'facebook' | 'instagram' | 'both'
  caption: string
  imageUrl: string
  pexelsQuery: string
  scheduleMode: 'now' | 'later' | 'smart'
  scheduledFor: string
}

export interface PexelsPhoto {
  id: number
  src: { medium: string; large: string }
  alt: string
}

export function useComposer(onPosted?: () => void) {
  const { tenantId } = useTenant()
  const [form, setForm] = useState<ComposerForm>({
    platform: 'facebook', caption: '', imageUrl: '',
    pexelsQuery: 'pest control technician', scheduleMode: 'now', scheduledFor: '',
  })
  const [aiTopic, setAiTopic] = useState('')
  const [aiCaptions, setAiCaptions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [pexelsResults, setPexelsResults] = useState<PexelsPhoto[]>([])
  const [pexelsLoading, setPexelsLoading] = useState(false)
  const [selectedPexelsUrl, setSelectedPexelsUrl] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [businessName, setBusinessName] = useState('Your Business')
  const [industry, setIndustry] = useState('Pest Control')
  const [pexelsApiKey, setPexelsApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [smartSchedule, setSmartSchedule] = useState<{ scheduled_for: string; reasoning: string } | null>(null)
  const [smartLoading, setSmartLoading] = useState(false)
  const captionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
    ]).then(([bizRes, intgRes]) => {
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (bizRes.data?.value?.industry) setIndustry(bizRes.data.value.industry)
      if (intgRes.data?.value?.pexels_api_key) setPexelsApiKey(intgRes.data.value.pexels_api_key)
      setLoading(false)
    })
  }, [tenantId])

  function resetForm() {
    setForm({ platform: 'facebook', caption: '', imageUrl: '', pexelsQuery: 'pest control technician', scheduleMode: 'now', scheduledFor: '' })
    setEditingPostId(null)
    setSelectedPexelsUrl('')
    setAiCaptions([])
    setAiTopic('')
    setSmartSchedule(null)
  }

  const generateCaptions = useCallback(async () => {
    if (!aiTopic.trim()) return
    setAiLoading(true); setAiError(''); setAiCaptions([])
    const prompt = `You are a social media expert for a ${industry.toLowerCase()} company called ${businessName} in East Texas. Generate exactly 3 different Facebook/Instagram captions for a post about: "${aiTopic}".\n\nRules:\n- Each caption must be engaging and friendly, not salesy\n- Include relevant emojis\n- End each with 3-5 relevant hashtags\n- Keep each under 200 words\n- Separate captions with "---CAPTION---"\n\nReturn ONLY the 3 captions separated by "---CAPTION---". No JSON, no preamble.`
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
      setAiCaptions(captions.slice(0, 3))
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate captions.')
    }
    setAiLoading(false)
  }, [aiTopic, industry, businessName])

  async function searchPexels() {
    if (!pexelsApiKey || !form.pexelsQuery.trim()) return
    setPexelsLoading(true)
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(form.pexelsQuery)}&per_page=9&orientation=landscape`, { headers: { Authorization: pexelsApiKey } })
      const data = await res.json()
      setPexelsResults(data.photos || [])
    } catch { /* ignore */ }
    setPexelsLoading(false)
  }

  function selectPexelsPhoto(url: string) { setSelectedPexelsUrl(url); setForm(p => ({ ...p, imageUrl: url })) }

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

  async function saveAsDraft() {
    if (!form.caption.trim() || !tenantId) return
    setSaving(true)
    const postData = {
      tenant_id: tenantId, platform: form.platform, caption: form.caption,
      image_url: form.imageUrl || null, status: 'draft' as const,
      scheduled_for: (form.scheduleMode === 'later' || form.scheduleMode === 'smart') && form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
    }
    if (editingPostId) {
      await supabase.from('social_posts').update(postData).eq('id', editingPostId)
    } else {
      await supabase.from('social_posts').insert(postData)
    }
    resetForm(); setSaving(false); onPosted?.()
  }

  async function publishNow() {
    if (!form.caption.trim() || !tenantId) return
    setPublishing(true)
    const { data: intgData } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
    const intg = intgData?.value || {}
    const postData = {
      tenant_id: tenantId, platform: form.platform, caption: form.caption,
      image_url: form.imageUrl || null, status: 'draft' as const,
      scheduled_for: (form.scheduleMode === 'later' || form.scheduleMode === 'smart') && form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
    }
    let postId = editingPostId
    if (editingPostId) { await supabase.from('social_posts').update(postData).eq('id', editingPostId) }
    else { const { data: inserted } = await supabase.from('social_posts').insert(postData).select('id').single(); postId = inserted?.id || null }
    if (!postId) { setPublishing(false); return }

    if (form.platform === 'instagram') {
      await supabase.from('social_posts').update({ status: 'draft', error_msg: 'Instagram requires connected Business Account.' }).eq('id', postId)
      resetForm(); setPublishing(false); onPosted?.(); return
    }
    const fbToken = intg.facebook_access_token; const fbPageId = intg.facebook_page_id
    if (!fbToken || !fbPageId) {
      await supabase.from('social_posts').update({ status: 'draft' }).eq('id', postId)
      resetForm(); setPublishing(false); onPosted?.(); return
    }
    try {
      const endpoint = form.imageUrl
        ? `https://graph.facebook.com/v18.0/${fbPageId}/photos`
        : `https://graph.facebook.com/v18.0/${fbPageId}/feed`
      const body = form.imageUrl
        ? { url: form.imageUrl, caption: form.caption, access_token: fbToken }
        : { message: form.caption, access_token: fbToken }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.error) { await supabase.from('social_posts').update({ status: 'failed', error_msg: data.error.message }).eq('id', postId) }
      else { await supabase.from('social_posts').update({ status: 'published', published_at: new Date().toISOString(), fb_post_id: data.id }).eq('id', postId) }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error'
      await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', postId)
    }
    resetForm(); setPublishing(false); onPosted?.()
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

  const charLimit = form.platform === 'instagram' || form.platform === 'both' ? 2200 : 63206

  return {
    form, setForm, aiTopic, setAiTopic, aiCaptions, aiLoading, aiError,
    pexelsResults, pexelsLoading, selectedPexelsUrl, publishing, saving,
    businessName, industry, pexelsApiKey, loading, editingPostId, smartSchedule,
    smartLoading, captionRef, charLimit,
    generateCaptions, searchPexels, selectPexelsPhoto, getSmartSchedule,
    saveAsDraft, publishNow, appendEmoji, resetForm,
  }
}
