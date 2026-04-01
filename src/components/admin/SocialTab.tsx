import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Edit3, Trash2, Send, Loader2, Copy, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'

// ─── Types ─────────────────────────────────────────────────────────────────

interface SocialPost {
  id: string
  tenant_id: string
  platform: 'facebook' | 'instagram' | 'both'
  caption: string
  image_url?: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for?: string
  published_at?: string
  fb_post_id?: string
  error_msg?: string
  created_at: string
}

interface PexelsPhoto {
  id: number
  src: { medium: string; large: string }
  alt: string
}

// ─── Post Templates ────────────────────────────────────────────────────────

interface PostTemplate {
  id: string
  icon: string
  name: string
  description: string
  topicPrompt: string
}

const CURRENT_MONTH = new Date().toLocaleString('en-US', { month: 'long' })

const INDUSTRY_TEMPLATES: Record<string, PostTemplate[]> = {
  'pest control': [
    { id: 'pc1', icon: '🌿', name: 'Seasonal Tip', description: 'Pest prevention tips for the current season', topicPrompt: `seasonal pest prevention tips for ${CURRENT_MONTH} from {businessName}` },
    { id: 'pc2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star customer review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'pc3', icon: '🐜', name: 'Pest Fact', description: 'Interesting fact about a common pest', topicPrompt: 'interesting fact about a common local pest and how to prevent it' },
    { id: 'pc4', icon: '💰', name: 'Promotion', description: 'Limited time discount offer', topicPrompt: 'limited time discount offer on our pest control services' },
    { id: 'pc5', icon: '🏠', name: 'Home Protection', description: 'Why year-round pest protection matters', topicPrompt: 'why homeowners need year-round pest protection' },
    { id: 'pc6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your technicians', topicPrompt: 'introduce our pest control technicians and their expertise' },
    { id: 'pc7', icon: '📞', name: 'Free Inspection', description: 'Offer a free home inspection', topicPrompt: 'offer a free home pest inspection to new customers' },
    { id: 'pc8', icon: '🌡️', name: 'Weather Alert', description: 'Weather-related pest activity warning', topicPrompt: 'hot/wet/cold weather increases pest activity — call us' },
    { id: 'pc9', icon: '✅', name: 'Before & After', description: 'Customer success story', topicPrompt: 'customer success story — pest problem solved' },
  ],
  'hvac': [
    { id: 'hv1', icon: '🌡️', name: 'Seasonal Tune-Up', description: 'Why now is best for a tune-up', topicPrompt: `why ${CURRENT_MONTH} is the best time for an HVAC tune-up` },
    { id: 'hv2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star customer review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'hv3', icon: '🔧', name: 'Filter Reminder', description: 'Air filter change tips', topicPrompt: 'how often homeowners should change their air filter' },
    { id: 'hv4', icon: '💰', name: 'Promotion', description: 'Limited time HVAC discount', topicPrompt: 'limited time discount on HVAC maintenance or installation' },
    { id: 'hv5', icon: '🏠', name: 'Home Comfort', description: 'HVAC maintenance saves money', topicPrompt: 'why a well-maintained HVAC system saves money year-round' },
    { id: 'hv6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your HVAC techs', topicPrompt: 'introduce our HVAC technicians and their certifications' },
    { id: 'hv7', icon: '📞', name: 'Free Estimate', description: 'Offer a free HVAC estimate', topicPrompt: 'offer a free estimate on HVAC replacement or repair' },
    { id: 'hv8', icon: '❄️', name: 'Weather Alert', description: 'Extreme weather HVAC warning', topicPrompt: 'extreme heat/cold means your HVAC works harder — call us' },
    { id: 'hv9', icon: '✅', name: 'Before & After', description: 'Old unit replaced, comfort restored', topicPrompt: 'customer success story — old unit replaced, comfort restored' },
  ],
  'plumbing': [
    { id: 'pl1', icon: '🌿', name: 'Seasonal Tip', description: 'Plumbing tips for the season', topicPrompt: `plumbing tips every homeowner should know in ${CURRENT_MONTH}` },
    { id: 'pl2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star customer review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'pl3', icon: '🚿', name: 'Water Saving', description: 'Save water and lower bills', topicPrompt: 'easy ways homeowners can save water and lower their bills' },
    { id: 'pl4', icon: '💰', name: 'Promotion', description: 'Limited time plumbing discount', topicPrompt: 'limited time discount on plumbing repair or water heater service' },
    { id: 'pl5', icon: '🏠', name: 'Pipe Protection', description: 'Preventive plumbing matters', topicPrompt: 'why preventive plumbing maintenance matters' },
    { id: 'pl6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your plumbers', topicPrompt: 'introduce our licensed plumbers and their expertise' },
    { id: 'pl7', icon: '📞', name: 'Free Estimate', description: 'Offer a free plumbing estimate', topicPrompt: 'offer a free estimate on plumbing repairs' },
    { id: 'pl8', icon: '🌧️', name: 'Weather Alert', description: 'Cold weather pipe warning', topicPrompt: 'cold weather can freeze pipes — call us before it happens' },
    { id: 'pl9', icon: '✅', name: 'Before & After', description: 'Leak fixed, damage prevented', topicPrompt: 'customer success story — leak fixed, water damage prevented' },
  ],
  'roofing': [
    { id: 'rf1', icon: '🌿', name: 'Seasonal Tip', description: 'Roof maintenance tips for the season', topicPrompt: `roof maintenance tips every homeowner needs in ${CURRENT_MONTH}` },
    { id: 'rf2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star customer review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'rf3', icon: '🔍', name: 'Inspection Tip', description: 'Warning signs your roof needs help', topicPrompt: "warning signs your roof needs attention before it's too late" },
    { id: 'rf4', icon: '💰', name: 'Promotion', description: 'Limited time roof discount', topicPrompt: 'limited time discount on roof inspection or repair' },
    { id: 'rf5', icon: '🏠', name: 'Home Protection', description: 'Quality roof protects your home', topicPrompt: 'how a quality roof protects your biggest investment' },
    { id: 'rf6', icon: '👨‍💼', name: 'Meet the Team', description: 'Introduce your roofing crew', topicPrompt: 'introduce our roofing crew and their certifications' },
    { id: 'rf7', icon: '📞', name: 'Free Inspection', description: 'Offer a free roof inspection', topicPrompt: 'offer a free roof inspection after recent storms' },
    { id: 'rf8', icon: '🌩️', name: 'Storm Alert', description: 'Storm damage warning', topicPrompt: 'recent storms can cause hidden roof damage — get inspected' },
    { id: 'rf9', icon: '✅', name: 'Before & After', description: 'Storm damage repaired', topicPrompt: 'customer success story — storm damage repaired, home protected' },
  ],
  'generic': [
    { id: 'gn1', icon: '🌿', name: 'Seasonal Tip', description: 'Seasonal home maintenance tips', topicPrompt: `seasonal home maintenance tips every homeowner needs in ${CURRENT_MONTH}` },
    { id: 'gn2', icon: '⭐', name: 'Review Spotlight', description: 'Share a 5-star customer review', topicPrompt: 'share a 5-star customer review and thank them' },
    { id: 'gn3', icon: '💡', name: 'Pro Tip', description: 'Helpful home services tip', topicPrompt: 'a helpful home services tip from {businessName}' },
    { id: 'gn4', icon: '💰', name: 'Promotion', description: 'Limited time discount offer', topicPrompt: 'limited time discount on our services — call today' },
    { id: 'gn5', icon: '🏠', name: 'Home Care', description: 'Regular maintenance saves money', topicPrompt: 'why regular home maintenance saves homeowners money' },
    { id: 'gn6', icon: '👨‍💼', name: 'Meet the Team', description: 'What makes your team different', topicPrompt: 'introduce our team and what makes us different' },
    { id: 'gn7', icon: '📞', name: 'Free Estimate', description: 'Offer a free estimate', topicPrompt: 'offer a free estimate or consultation to new customers' },
    { id: 'gn8', icon: '⚠️', name: 'Seasonal Alert', description: 'Critical time for maintenance', topicPrompt: "this time of year is critical for home maintenance — here's why" },
    { id: 'gn9', icon: '✅', name: 'Before & After', description: 'Customer success story', topicPrompt: 'customer success story — problem solved, homeowner happy' },
  ],
}

function getTemplatesForIndustry(industry: string): PostTemplate[] {
  const key = industry.toLowerCase().trim()
  return INDUSTRY_TEMPLATES[key] || INDUSTRY_TEMPLATES['generic']
}

// ─── Toast system ──────────────────────────────────────────────────────────

interface ToastMsg {
  id: number
  text: string
  type: 'success' | 'error'
}

let toastId = 0

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white cursor-pointer transition-all ${
            t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function SocialTab() {
  const { tenantId } = useTenant()

  // Form state — single useState object
  const [form, setForm] = useState({
    platform: 'facebook' as 'facebook' | 'instagram' | 'both',
    caption: '',
    imageUrl: '',
    pexelsQuery: 'pest control technician',
    scheduleMode: 'now' as 'now' | 'later' | 'smart',
    scheduledFor: '',
  })

  // Other state
  const [aiTopic, setAiTopic] = useState('')
  const [aiCaptions, setAiCaptions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [pexelsResults, setPexelsResults] = useState<PexelsPhoto[]>([])
  const [pexelsLoading, setPexelsLoading] = useState(false)
  const [selectedPexelsUrl, setSelectedPexelsUrl] = useState('')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [historyFilter, setHistoryFilter] = useState<'all' | 'draft' | 'scheduled' | 'published' | 'failed'>('all')
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [businessName, setBusinessName] = useState('Your Business')
  const [industry, setIndustry] = useState('Pest Control')
  const [pexelsApiKey, setPexelsApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [smartSchedule, setSmartSchedule] = useState<{ scheduled_for: string; reasoning: string } | null>(null)
  const [smartLoading, setSmartLoading] = useState(false)

  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const captionRef = useRef<HTMLTextAreaElement>(null)

  const showToast = useCallback((text: string, type: 'success' | 'error') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ─── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
      supabase.from('social_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    ]).then(([bizRes, intgRes, postsRes]) => {
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (bizRes.data?.value?.industry) setIndustry(bizRes.data.value.industry)
      if (intgRes.data?.value?.pexels_api_key) setPexelsApiKey(intgRes.data.value.pexels_api_key)
      setPosts((postsRes.data as SocialPost[]) || [])
      setLoading(false)
    })
  }, [tenantId])

  // ─── Refresh posts ─────────────────────────────────────────────────────

  async function refreshPosts() {
    const { data } = await supabase.from('social_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setPosts((data as SocialPost[]) || [])
  }

  // ─── AI Caption Generator ──────────────────────────────────────────────

  async function generateCaptions() {
    if (!aiTopic.trim()) { showToast('Enter a topic first.', 'error'); return }
    setAiLoading(true)
    setAiError('')
    setAiCaptions([])

    const prompt = `You are a social media expert for a ${industry.toLowerCase()} company called ${businessName} in East Texas. Generate exactly 3 different Facebook/Instagram captions for a post about: "${aiTopic}".

Rules:
- Each caption must be engaging and friendly, not salesy
- Include relevant emojis
- End each with 3-5 relevant hashtags (e.g. #${industry.replace(/\s+/g, '')} #EastTexas etc.)
- Keep each under 200 words
- Separate captions with "---CAPTION---"

Return ONLY the 3 captions separated by "---CAPTION---". No JSON, no preamble.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (data.error) {
        setAiError(data.error.message || 'AI request failed.')
        setAiLoading(false)
        return
      }
      const text = data.content[0].text
      const captions = text.split('---CAPTION---').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
      setAiCaptions(captions.slice(0, 3))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate captions.'
      setAiError(msg)
    }
    setAiLoading(false)
  }

  // ─── AI Smart Scheduling ────────────────────────────────────────────────

  async function getSmartSchedule() {
    setSmartLoading(true)
    setSmartSchedule(null)
    const now = new Date()
    const todayDayName = now.toLocaleDateString('en-US', { weekday: 'long' })
    const todayDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const prompt = `You are a social media scheduling expert. A ${industry.toLowerCase()} business wants to post on ${form.platform}. Based on industry best practices and audience behavior for ${industry.toLowerCase()} businesses (typically serving homeowners), recommend the single best day and time to post this week for maximum engagement.

Today is ${todayDayName}, ${todayDate}.

Return ONLY a JSON object, no preamble, no backticks:
{
  "scheduled_for": "YYYY-MM-DDTHH:mm:00",
  "reasoning": "One sentence explaining why this day/time works best for this industry."
}

The scheduled_for must be a future datetime this week (within the next 7 days).
Use 24-hour time. Typical best windows for home services: Tue-Thu 7-9am or 6-8pm when homeowners are home. Adjust based on the specific industry.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (data.error) {
        showToast('Smart scheduling failed. Try manual scheduling.', 'error')
        setForm(p => ({ ...p, scheduleMode: 'later' }))
        setSmartLoading(false)
        return
      }
      const text = data.content[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const result = JSON.parse(clean)
      setSmartSchedule(result)
      setForm(p => ({ ...p, scheduledFor: result.scheduled_for.substring(0, 16) }))
    } catch {
      showToast('Smart scheduling failed. Try manual scheduling.', 'error')
      setForm(p => ({ ...p, scheduleMode: 'later' }))
    }
    setSmartLoading(false)
  }

  // ─── Pexels Search ─────────────────────────────────────────────────────

  async function searchPexels() {
    if (!pexelsApiKey) return
    if (!form.pexelsQuery.trim()) return
    setPexelsLoading(true)
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(form.pexelsQuery)}&per_page=9&orientation=landscape`, {
        headers: { Authorization: pexelsApiKey },
      })
      const data = await res.json()
      setPexelsResults(data.photos || [])
    } catch {
      showToast('Pexels search failed.', 'error')
    }
    setPexelsLoading(false)
  }

  // ─── Select Pexels photo ───────────────────────────────────────────────

  function selectPexelsPhoto(url: string) {
    setSelectedPexelsUrl(url)
    setForm(p => ({ ...p, imageUrl: url }))
  }

  // ─── Emoji picker ──────────────────────────────────────────────────────

  const emojis = ['🐜', '🦟', '🪳', '🕷️', '🐭', '🐝', '🦂', '🌿', '✅', '🔥', '📞', '⭐']

  function appendEmoji(emoji: string) {
    const ta = captionRef.current
    if (ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newCaption = form.caption.substring(0, start) + emoji + form.caption.substring(end)
      setForm(p => ({ ...p, caption: newCaption }))
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus() }, 0)
    } else {
      setForm(p => ({ ...p, caption: p.caption + emoji }))
    }
  }

  // ─── Character limit ──────────────────────────────────────────────────

  function getCharLimit() {
    if (form.platform === 'instagram') return 2200
    if (form.platform === 'both') return 2200 // use the lower limit
    return 63206
  }

  // ─── Save as draft ─────────────────────────────────────────────────────

  async function saveAsDraft() {
    if (!form.caption.trim()) { showToast('Write a caption first.', 'error'); return }
    setSaving(true)

    const postData = {
      tenant_id: tenantId,
      platform: form.platform,
      caption: form.caption,
      image_url: form.imageUrl || null,
      status: 'draft' as const,
      scheduled_for: (form.scheduleMode === 'later' || form.scheduleMode === 'smart') && form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
    }

    if (editingPostId) {
      const { error } = await supabase.from('social_posts').update(postData).eq('id', editingPostId)
      if (error) { showToast('Failed to update post.', 'error'); setSaving(false); return }
      showToast('Post updated!', 'success')
      setEditingPostId(null)
    } else {
      const { error } = await supabase.from('social_posts').insert(postData)
      if (error) { showToast('Failed to save draft.', 'error'); setSaving(false); return }
      showToast('Draft saved!', 'success')
    }

    resetForm()
    await refreshPosts()
    setSaving(false)
  }

  // ─── Publish Now ───────────────────────────────────────────────────────

  async function publishNow() {
    if (!form.caption.trim()) { showToast('Write a caption first.', 'error'); return }
    setPublishing(true)

    // Load integrations
    const { data: intgData } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
    const intg = intgData?.value || {}
    const fbToken = intg.facebook_access_token
    const fbPageId = intg.facebook_page_id

    // Save post first
    const postData = {
      tenant_id: tenantId,
      platform: form.platform,
      caption: form.caption,
      image_url: form.imageUrl || null,
      status: 'draft' as const,
      scheduled_for: (form.scheduleMode === 'later' || form.scheduleMode === 'smart') && form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
    }

    let postId = editingPostId

    if (editingPostId) {
      await supabase.from('social_posts').update(postData).eq('id', editingPostId)
    } else {
      const { data: inserted } = await supabase.from('social_posts').insert(postData).select('id').single()
      postId = inserted?.id || null
    }

    if (!postId) {
      showToast('Failed to save post.', 'error')
      setPublishing(false)
      return
    }

    // Instagram-only: save as draft with note
    if (form.platform === 'instagram') {
      await supabase.from('social_posts').update({ status: 'draft', error_msg: 'Instagram publishing requires a connected Business Account. Post saved as draft.' }).eq('id', postId)
      showToast('Instagram post saved as draft. Business Account required for auto-publish.', 'error')
      resetForm()
      await refreshPosts()
      setPublishing(false)
      return
    }

    // Facebook publish
    if (form.platform === 'facebook' || form.platform === 'both') {
      if (!fbToken || !fbPageId) {
        await supabase.from('social_posts').update({ status: 'draft' }).eq('id', postId)
        showToast('Add Facebook credentials in Settings → Integrations. Saved as draft.', 'error')
        resetForm()
        await refreshPosts()
        setPublishing(false)
        return
      }

      try {
        let endpoint: string
        let body: Record<string, string>

        if (form.imageUrl) {
          endpoint = `https://graph.facebook.com/v18.0/${fbPageId}/photos`
          body = { url: form.imageUrl, caption: form.caption, access_token: fbToken }
        } else {
          endpoint = `https://graph.facebook.com/v18.0/${fbPageId}/feed`
          body = { message: form.caption, access_token: fbToken }
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()

        if (data.error) {
          await supabase.from('social_posts').update({ status: 'failed', error_msg: data.error.message }).eq('id', postId)
          showToast(`Facebook error: ${data.error.message}`, 'error')
        } else {
          await supabase.from('social_posts').update({ status: 'published', published_at: new Date().toISOString(), fb_post_id: data.id }).eq('id', postId)
          showToast('Posted to Facebook! ✅', 'success')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error'
        await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', postId)
        showToast(`Facebook error: ${msg}`, 'error')
      }
    }

    resetForm()
    await refreshPosts()
    setPublishing(false)
  }

  // ─── Publish a saved post directly ─────────────────────────────────────

  async function publishPost(post: SocialPost) {
    setForm({
      platform: post.platform,
      caption: post.caption,
      imageUrl: post.image_url || '',
      pexelsQuery: 'pest control technician',
      scheduleMode: 'now',
      scheduledFor: '',
    })
    setEditingPostId(post.id)
    // Scroll to top of composer
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showToast('Post loaded into composer. Click Publish to send.', 'success')
  }

  // ─── Edit post ─────────────────────────────────────────────────────────

  function editPost(post: SocialPost) {
    setForm({
      platform: post.platform,
      caption: post.caption,
      imageUrl: post.image_url || '',
      pexelsQuery: 'pest control technician',
      scheduleMode: post.scheduled_for ? 'later' : 'now',
      scheduledFor: post.scheduled_for ? post.scheduled_for.substring(0, 16) : '',
    })
    setEditingPostId(post.id)
    setSelectedPexelsUrl(post.image_url || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Delete post ───────────────────────────────────────────────────────

  async function deletePost(id: string) {
    await supabase.from('social_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    showToast('Post deleted.', 'success')
  }

  // ─── Publish scheduled post via edge function ──────────────────────────

  async function publishScheduledNow(postId: string) {
    try {
      const { error } = await supabase.functions.invoke('publish-scheduled-posts', {
        body: { post_id: postId },
      })
      if (error) {
        showToast('Publish failed. Check FB credentials in Settings.', 'error')
      } else {
        showToast('Post sent! ✅', 'success')
        await refreshPosts()
      }
    } catch {
      showToast('Failed to reach publish function.', 'error')
    }
  }

  // ─── Reset form ────────────────────────────────────────────────────────

  function resetForm() {
    setForm({ platform: 'facebook', caption: '', imageUrl: '', pexelsQuery: 'pest control technician', scheduleMode: 'now', scheduledFor: '' })
    setEditingPostId(null)
    setSelectedPexelsUrl('')
    setAiCaptions([])
    setAiTopic('')
    setSmartSchedule(null)
  }

  // ─── Filter posts ──────────────────────────────────────────────────────

  const filteredPosts = historyFilter === 'all' ? posts : posts.filter(p => p.status === historyFilter)

  // ─── Platform badge ────────────────────────────────────────────────────

  function platformBadge(platform: string) {
    const styles: Record<string, string> = {
      facebook: 'bg-blue-100 text-blue-700',
      instagram: 'bg-pink-100 text-pink-700',
      both: 'bg-purple-100 text-purple-700',
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[platform] || 'bg-gray-100 text-gray-600'}`}>{platform}</span>
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      scheduled: 'bg-yellow-100 text-yellow-700',
      published: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
  }

  // ─── Date display (human-friendly) ──────────────────────────────────────

  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMs < 0) {
      // Future date
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function postDate(post: SocialPost) {
    if (post.status === 'published' && post.published_at) {
      return `Published ${formatRelativeDate(post.published_at)}`
    }
    if (post.status === 'scheduled' && post.scheduled_for) {
      return `Scheduled for ${formatRelativeDate(post.scheduled_for)}`
    }
    return `Created ${formatRelativeDate(post.created_at)}`
  }

  // ─── Copy caption ─────────────────────────────────────────────────────

  function copyCaption(caption: string) {
    navigator.clipboard.writeText(caption).then(() => {
      showToast('Caption copied!', 'success')
    }).catch(() => {
      showToast('Failed to copy.', 'error')
    })
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  const charLimit = getCharLimit()
  const charsRemaining = charLimit - form.caption.length

  return (
    <div>
      {/* Section A — PageHelpBanner */}
      <PageHelpBanner
        tab="social"
        title="📱 Social Media Command Center"
        body="Create posts for Facebook and Instagram right here — no need to open those apps! Type a topic, let AI write 3 caption options, pick your favorite, add a photo, choose when to post, and hit Publish. Easy as that."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── LEFT: Composer Panel (60%) ──────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Industry badge */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>🏠 {industry}</span>
            <span className="text-gray-300">•</span>
            <span className="text-emerald-600 hover:text-emerald-700 cursor-pointer" onClick={() => showToast('Open Settings tab → Business Info to change industry.', 'success')}>Change in Settings →</span>
          </div>

          {/* Templates Section (collapsible) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <button
              onClick={() => setTemplatesOpen(!templatesOpen)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
            >
              📋 Use a Template
              <span className="text-xs text-gray-400">{templatesOpen ? '▲' : '▼'}</span>
            </button>
            {templatesOpen && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {getTemplatesForIndustry(industry).map(tmpl => (
                  <div key={tmpl.id} className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{tmpl.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{tmpl.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{tmpl.description}</p>
                    <button
                      onClick={() => {
                        const topic = tmpl.topicPrompt.replace(/\{businessName\}/g, businessName)
                        setAiTopic(topic)
                        setTemplatesOpen(false)
                        // Auto-trigger caption generation
                        setTimeout(() => {
                          const genBtn = document.getElementById('generate-captions-btn')
                          if (genBtn) genBtn.click()
                        }, 100)
                      }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Use →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B — Platform Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Platform</h3>
            <div className="flex gap-2">
              {(['facebook', 'instagram', 'both'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setForm(prev => ({ ...prev, platform: p }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    form.platform === p
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p === 'both' ? 'Both' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Section C — AI Caption Generator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">AI Caption Generator</h3>
            <div className="flex gap-2 mb-4">
              <input
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder="e.g. mosquito season tips"
                className={`flex-1 ${inputClass}`}
                onKeyDown={e => { if (e.key === 'Enter') generateCaptions() }}
              />
              <button
                id="generate-captions-btn"
                onClick={generateCaptions}
                disabled={aiLoading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
              >
                {aiLoading ? <><Loader2 size={14} className="animate-spin" /> Asking AI...</> : '✨ Generate 3 Captions'}
              </button>
            </div>

            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{aiError}</p>
              </div>
            )}

            {aiCaptions.length > 0 && (
              <div className="space-y-3">
                {aiCaptions.map((caption, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{caption}</p>
                    <button
                      onClick={() => setForm(p => ({ ...p, caption }))}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Use This Caption →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section D — Caption Composer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {editingPostId ? 'Edit Caption' : 'Caption'}
            </h3>
            <textarea
              ref={captionRef}
              value={form.caption}
              onChange={e => setForm(p => ({ ...p, caption: e.target.value }))}
              rows={6}
              placeholder="Write your caption here or pick one from AI above..."
              className={`${inputClass} resize-none mb-2`}
            />
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs ${charsRemaining < 0 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {charsRemaining.toLocaleString()} characters remaining
                {form.platform === 'facebook' && ' (Facebook)'}
                {form.platform === 'instagram' && ' (Instagram)'}
                {form.platform === 'both' && ' (Instagram limit)'}
              </p>
            </div>
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => appendEmoji(emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-lg transition-colors"
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Section E — Pexels Image Picker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Photo</h3>

            {!pexelsApiKey ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  🔑 Add your free Pexels API key in Settings → Integrations to search stock photos.
                  Get one free at pexels.com/api. Or paste any image URL directly below.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <input
                    value={form.pexelsQuery}
                    onChange={e => setForm(p => ({ ...p, pexelsQuery: e.target.value }))}
                    placeholder="Search photos..."
                    className={`flex-1 ${inputClass}`}
                    onKeyDown={e => { if (e.key === 'Enter') searchPexels() }}
                  />
                  <button
                    onClick={searchPexels}
                    disabled={pexelsLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {pexelsLoading ? 'Searching...' : 'Search Photos'}
                  </button>
                </div>

                {pexelsResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {pexelsResults.map(photo => (
                      <button
                        key={photo.id}
                        onClick={() => selectPexelsPhoto(photo.src.large)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPexelsUrl === photo.src.large
                            ? 'border-emerald-500 ring-2 ring-emerald-500'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Or paste image URL</label>
              <input
                value={form.imageUrl}
                onChange={e => { setForm(p => ({ ...p, imageUrl: e.target.value })); setSelectedPexelsUrl('') }}
                placeholder="https://example.com/image.jpg"
                className={inputClass}
              />
            </div>

            {form.imageUrl && (
              <div className="mt-3">
                <img src={form.imageUrl} alt="Preview" className="w-32 h-24 object-cover rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          {/* Section F — Schedule / Publish */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Schedule & Publish</h3>

            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={form.scheduleMode === 'now'}
                  onChange={() => { setForm(p => ({ ...p, scheduleMode: 'now' })); setSmartSchedule(null) }}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Post now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={form.scheduleMode === 'later'}
                  onChange={() => { setForm(p => ({ ...p, scheduleMode: 'later' })); setSmartSchedule(null) }}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Schedule for later</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={form.scheduleMode === 'smart'}
                  onChange={() => setForm(p => ({ ...p, scheduleMode: 'smart' }))}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">✨ Smart Schedule</span>
              </label>
            </div>

            {form.scheduleMode === 'later' && (
              <div className="mb-4">
                <input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={e => setForm(p => ({ ...p, scheduledFor: e.target.value }))}
                  min={new Date().toISOString().substring(0, 16)}
                  className={inputClass}
                />
              </div>
            )}

            {form.scheduleMode === 'smart' && (
              <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  {!smartSchedule && !smartLoading && (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        AI will pick the best day and time to post based on your industry.
                        Click &quot;Get Best Time&quot; to see the recommendation.
                      </p>
                      <button
                        onClick={getSmartSchedule}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        ✨ Get Best Time
                      </button>
                    </>
                  )}

                  {smartLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={16} className="animate-spin" />
                      Thinking about the best time... ✨
                    </div>
                  )}

                  {smartSchedule && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        📅 Best time: {new Date(smartSchedule.scheduled_for).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(smartSchedule.scheduled_for).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">💡 {smartSchedule.reasoning}</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="datetime-local"
                          value={form.scheduledFor}
                          onChange={e => setForm(p => ({ ...p, scheduledFor: e.target.value }))}
                          min={new Date().toISOString().substring(0, 16)}
                          className={`flex-1 ${inputClass}`}
                        />
                        <button
                          onClick={getSmartSchedule}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(form.platform === 'instagram' || form.platform === 'both') && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-pink-700">
                  📸 Instagram posts are saved as drafts. Connect a Meta Business Account in Settings → Integrations to enable direct publishing.
                </p>
              </div>
            )}
            {(form.platform === 'facebook' || form.platform === 'both') && (
              <p className="text-xs text-gray-400 mb-4">
                Facebook: Requires Facebook Access Token in Settings → Integrations.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={saveAsDraft}
                disabled={saving}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={publishNow}
                disabled={publishing}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Send size={14} />
                {publishing ? 'Publishing...' : '🚀 Publish Now'}
              </button>
            </div>

            {editingPostId && (
              <button onClick={resetForm} className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline">
                Cancel editing — start new post
              </button>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Post History Panel (40%) ─────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Post History</h3>
              <button onClick={refreshPosts} className="text-gray-400 hover:text-gray-600 transition-colors" title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex border-b border-gray-100 px-4">
              {(['all', 'draft', 'scheduled', 'published', 'failed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors capitalize ${
                    historyFilter === f
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Post list */}
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm text-gray-500">
                    {historyFilter === 'all'
                      ? 'No posts yet. Create your first post above! ☝️'
                      : `No ${historyFilter} posts.`}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredPosts.map(post => (
                    <div key={post.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        {post.image_url && (
                          <img src={post.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-1">
                            {platformBadge(post.platform)}
                            {statusBadge(post.status)}
                          </div>

                          {/* Caption preview */}
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {post.caption.length > 100 ? post.caption.substring(0, 100) + '...' : post.caption}
                          </p>

                          {/* Error message */}
                          {post.status === 'failed' && post.error_msg && (
                            <p className="text-xs text-red-500 mt-1">{post.error_msg}</p>
                          )}

                          {/* Date */}
                          <p className="text-xs text-gray-400 mt-1">{postDate(post)}</p>

                          {/* FB link or no-credentials note */}
                          {post.status === 'published' && post.fb_post_id && post.fb_post_id !== 'no-credentials' && (
                            <a
                              href={`https://www.facebook.com/${post.fb_post_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-0.5"
                            >
                              <ExternalLink size={11} /> View on Facebook
                            </a>
                          )}
                          {post.status === 'published' && post.fb_post_id === 'no-credentials' && (
                            <p className="text-xs text-gray-400 mt-0.5">Posted (no FB connected)</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2 ml-0">
                        <button
                          onClick={() => copyCaption(post.caption)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy Caption"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => editPost(post)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        {post.status === 'scheduled' && (
                          <button
                            onClick={() => publishScheduledNow(post.id)}
                            className="text-gray-400 hover:text-emerald-500 transition-colors"
                            title="Publish Now"
                          >
                            <Send size={14} />
                          </button>
                        )}
                        {post.status === 'draft' && (
                          <button
                            onClick={() => publishPost(post)}
                            className="text-gray-400 hover:text-emerald-500 transition-colors"
                            title="Publish Now"
                          >
                            <Send size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
