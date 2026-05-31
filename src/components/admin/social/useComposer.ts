import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import { usePlan } from '../../../context/PlanContext'
import { usePublishPost } from './usePublishPost'
import { AI_DAILY_LIMITS, POSTS_PER_GENERATION, SCHEDULING_DAY_CAP } from './socialLimits'
import { resizeImage } from './lib/resizeImage'
import { callAi } from '../../../lib/ai/callAi'

export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export type MediaType = 'image' | 'video'

// Post-selection feedback surfaced by the picker. 'error' blocks the upload;
// 'warn' is non-blocking (the file still uploads).
export interface UploadNotice { type: 'error' | 'warn'; text: string }

export interface ComposerForm {
  platform: string
  caption: string
  imageUrl: string         // S250: URL column for BOTH kinds (image or video)
  mediaType: MediaType     // S250: drives Zernio mediaItems[].type + which preview to render
  scheduleMode: 'now' | 'later' | 'smart'
  scheduledFor: string
}

// Accepted media for the social composer. The file picker uses a broad
// accept="image/*,video/*" so Photos/Gallery/Drive/Files never grey out a valid
// file (Drive/Files enforce `accept` as a hard filter). These lists are the REAL
// gatekeeper, enforced after selection in handleFileUpload. Phones record .mov (iOS)
// / .mp4 (Android); Zernio also accepts webm and avi.
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-msvideo']
const ACCEPTED_VIDEO_EXT = ['mp4', 'mov', 'webm', 'avi']
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ACCEPTED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const VIDEO_WARN_BYTES = 200 * 1024 * 1024        // 200 MB — warn, don't block
const VIDEO_MAX_BYTES = 5 * 1024 * 1024 * 1024    // 5 GB — Zernio platform max, reject

export function useComposer(
  onPosted?: () => void,
  onCaptionGenerated?: () => void,
  // s248 — opened when a sub-tier user reaches a Grow+ action (smart-schedule).
  onUpgradeRequired?: () => void,
) {
  const { id: tenantId } = useTenant()
  const { tier } = usePlan()
  const aiDailyLimit = AI_DAILY_LIMITS[tier] ?? 2
  const postsPerGeneration = POSTS_PER_GENERATION[tier] ?? 1
  const schedulingDayCap = SCHEDULING_DAY_CAP[tier] ?? 0

  const [form, setForm] = useState<ComposerForm>({
    platform: 'facebook', caption: '', imageUrl: '', mediaType: 'image',
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
  const [uploadNotice, setUploadNotice] = useState<UploadNotice | null>(null)
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
    setForm({ platform: 'facebook', caption: '', imageUrl: '', mediaType: 'image', scheduleMode: 'now', scheduledFor: '' })
    setEditingPostId(null); setAiCaptions([]); setAiTopic(''); setSmartSchedule(null)
    setUploadState('idle'); setUploadNotice(null)
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return '' })
  }

  // The picker now uses a broad accept="image/*,video/*" (so Drive/Files don't grey
  // out valid files) — so THIS function is the real gatekeeper. It classifies the
  // selected file by MIME (with an extension fallback, since Drive/Files can hand us
  // an empty MIME), rejects unsupported formats / oversized video with plain-English
  // copy, and only then uploads.
  async function handleFileUpload(file: File) {
    setUploadNotice(null)

    const mime = file.type.toLowerCase()
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''

    const isVideo = mime.startsWith('video/') || ACCEPTED_VIDEO_EXT.includes(ext)
    const isImage = mime.startsWith('image/') || ACCEPTED_IMAGE_EXT.includes(ext)

    // Format gatekeeper (replaces the old `accept` codec whitelist).
    if (isVideo) {
      const ok = ACCEPTED_VIDEO_TYPES.includes(mime) || ACCEPTED_VIDEO_EXT.includes(ext)
      if (!ok) {
        setUploadNotice({ type: 'error', text: "That video format isn't supported. Please use an MP4 or MOV — that's what your phone records by default." })
        return
      }
    } else if (isImage) {
      const ok = ACCEPTED_IMAGE_TYPES.includes(mime) || ACCEPTED_IMAGE_EXT.includes(ext)
      if (!ok) {
        setUploadNotice({ type: 'error', text: "That image format isn't supported. Please use a JPG, PNG, GIF, or WEBP." })
        return
      }
    } else {
      setUploadNotice({ type: 'error', text: "That file isn't a photo or video. Please choose an image or video from your phone, gallery, or drive." })
      return
    }

    // Size guard (video): reject over the 5GB platform max; warn (non-blocking) over 200MB.
    if (isVideo && file.size > VIDEO_MAX_BYTES) {
      setUploadNotice({ type: 'error', text: 'That video is too large to post (5 GB max). Please trim it or export at a lower resolution.' })
      return
    }
    const oversizedWarn = isVideo && file.size > VIDEO_WARN_BYTES

    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setUploadState('uploading')
    try {
      let blob: Blob
      let contentType: string
      let uploadExt: string
      if (isVideo) {
        // Video: upload the RAW file untouched. resizeImage() is a canvas→JPEG
        // path that would destroy a video. The edge fn presigns to Zernio with
        // the stored object's content-type, so the native container flows through.
        blob = file
        contentType = mime || 'video/mp4'
        uploadExt = ext || 'mp4'
      } else {
        blob = await resizeImage(file)
        contentType = 'image/jpeg'
        uploadExt = 'jpg'
      }
      const filename = `${crypto.randomUUID()}.${uploadExt}`
      const path = `${tenantId}/social/${filename}`
      const { error: uploadError } = await supabase.storage
        .from('social-uploads')
        .upload(path, blob, { contentType, cacheControl: '3600' })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('social-uploads')
        .getPublicUrl(path)
      // S250: single media slot — uploading a video replaces any selected image and vice versa.
      setForm(p => ({ ...p, imageUrl: publicUrl, mediaType: isVideo ? 'video' : 'image' }))
      setUploadState('success')
      if (oversizedWarn) {
        setUploadNotice({ type: 'warn', text: 'Heads up: that’s a large video — it still posted, but large videos upload slowly and some platforms may compress them.' })
      }
    } catch (err) {
      console.error('[useComposer] media upload failed:', err)
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
      const data = await callAi('composer_captions', {
        tenant_id: tenantId,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = data.content?.[0]?.text ?? ''
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
    // s248 — pre-emptive tier gate (Grow/2): open the upgrade prompt and fire
    // NO request. Defense in depth — UI hides the 'smart' radio for Starter,
    // but if this is ever reached sub-tier, we never silently no-op.
    if (tier < 2) { onUpgradeRequired?.(); return }
    setSmartLoading(true); setSmartSchedule(null)
    const now = new Date()
    const prompt = `You are a social media scheduling expert. A ${industry.toLowerCase()} business wants to post on ${form.platform}. Recommend the single best day and time to post this week. Today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.\n\nReturn ONLY a JSON object, no preamble, no backticks:\n{"scheduled_for": "YYYY-MM-DDTHH:mm:00", "reasoning": "One sentence."}\n\nMust be future datetime within 7 days. Use 24-hour time.`
    try {
      const data = await callAi('composer_schedule', {
        tenant_id: tenantId,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = data.content?.[0]?.text ?? ''
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
    uploadState, uploadNotice, previewUrl,
    generateCaptions, getSmartSchedule,
    saveAsDraft, publishNow, appendEmoji, resetForm, handleFileUpload,
  }
}
