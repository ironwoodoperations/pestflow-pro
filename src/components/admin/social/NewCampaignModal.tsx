import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import { usePlan } from '../../../context/PlanContext'

const ALL_PLATFORMS = [
  { key: 'facebook',        label: 'Facebook',        icon: '📘' },
  { key: 'instagram',       label: 'Instagram',       icon: '📷' },
  { key: 'linkedin',        label: 'LinkedIn',        icon: '💼' },
  { key: 'google_business', label: 'Google Business', icon: '🔍' },
  { key: 'youtube',         label: 'YouTube',         icon: '▶️' },
  { key: 'tiktok',          label: 'TikTok',          icon: '🎵' },
]

interface Props {
  onClose: () => void
  onCreated: () => void
  connectedKeys?: string[]
}

type WizardStep = 'setup' | 'generating' | 'review' | 'saving'

interface GeneratedPost {
  day: number
  platform: string
  caption: string
  hashtags: string
}

// Duration options per tier
const PRO_DURATIONS = [
  { label: '1 Day (2 posts)', days: 1, posts: 2 },
  { label: '5 Days (10 posts)', days: 5, posts: 10 },
]
const ELITE_DURATIONS = [
  { label: '1 Day (2 posts)', days: 1, posts: 2 },
  { label: '7 Days (14 posts)', days: 7, posts: 14 },
  { label: '14 Days (28 posts)', days: 14, posts: 28 },
  { label: '30 Days (30 posts)', days: 30, posts: 30 },
]

export default function NewCampaignModal({ onClose, onCreated, connectedKeys }: Props) {
  const { id: tenantId } = useTenant()
  const { tier } = usePlan()

  const durations = tier >= 4 ? ELITE_DURATIONS : PRO_DURATIONS

  const [step, setStep] = useState<WizardStep>('setup')
  const [form, setForm] = useState({
    title: '',
    topic: '',
    tone: 'casual',
    durationIndex: 0,
    platforms: ['facebook'] as string[],
    start_date: '',
  })
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [editedCaptions, setEditedCaptions] = useState<string[]>([])
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [bizLoaded, setBizLoaded] = useState(false)
  const [genError, setGenError] = useState('')

  // Lazy-load business info on first render
  if (!bizLoaded && tenantId) {
    setBizLoaded(true)
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle().then(res => {
      if (res.data?.value?.name) setBusinessName(res.data.value.name)
      if (res.data?.value?.phone) setBusinessPhone(res.data.value.phone)
    })
  }

  function togglePlatform(p: string) {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }))
  }

  const selectedDuration = durations[form.durationIndex]

  async function handleGenerate() {
    if (!form.title.trim()) { toast.error('Campaign title is required.'); return }
    if (!form.topic.trim()) { toast.error('Campaign topic is required.'); return }
    if (form.platforms.length === 0) { toast.error('Select at least one platform.'); return }

    setStep('generating')
    setGenError('')

    const postCount = selectedDuration.posts
    const rotation = form.platforms

    const prompt = `You are a social media content expert for ${businessName || 'our business'}.
Generate exactly ${postCount} social media posts for a campaign.
Campaign title: "${form.title}"
Campaign topic: "${form.topic}"
Tone: ${form.tone}
Duration: ${selectedDuration.days} day(s)
Platforms in rotation: ${rotation.join(', ')}
Business phone: ${businessPhone || 'call us for details'}

Return ONLY a valid JSON array. No markdown, no code fences.
Each object must have: day (number), platform (string), caption (string), hashtags (string)
Make captions specific to the services described. Avoid repetition. Include emojis. Keep captions under 200 words. Hashtags are 2-4 per post.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (data.error) { setGenError(data.error.message || 'AI request failed.'); setStep('setup'); return }
      const text = data.content?.[0]?.text || '[]'
      const cleaned = text.replace(/```json|```/g, '').trim()
      const parsed: GeneratedPost[] = JSON.parse(cleaned)
      setGeneratedPosts(parsed)
      setEditedCaptions(parsed.map(p => `${p.caption}\n\n${p.hashtags}`))
      setStep('review')
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate posts.')
      setStep('setup')
    }
  }

  async function handleSave() {
    if (!tenantId) return
    setStep('saving')

    // Create the campaign record
    const { data: campaign, error: campErr } = await supabase.from('social_campaigns').insert({
      tenant_id: tenantId,
      title: form.title,
      goal: form.topic,
      tone: form.tone,
      duration_days: selectedDuration.days,
      platforms: form.platforms,
      start_date: form.start_date || null,
      status: 'active',
    }).select('id').single()

    if (campErr || !campaign) {
      toast.error('Failed to create campaign.')
      setStep('review')
      return
    }

    // Insert all generated posts
    const startDate = form.start_date ? new Date(form.start_date) : new Date()
    const postsToInsert = generatedPosts.map((p, i) => {
      const scheduledDate = new Date(startDate)
      scheduledDate.setDate(scheduledDate.getDate() + (p.day - 1))
      scheduledDate.setHours(9, 0, 0, 0) // 9am default
      return {
        tenant_id: tenantId,
        campaign_id: campaign.id,
        campaign_title: form.title,
        platform: form.platforms.includes(p.platform) ? p.platform : form.platforms[0],
        caption: editedCaptions[i] || `${p.caption}\n\n${p.hashtags}`,
        status: 'draft' as const,
        ai_generated: true,
        scheduled_for: scheduledDate.toISOString(),
      }
    })

    const { error: postsErr } = await supabase.from('social_posts').insert(postsToInsert)
    if (postsErr) {
      toast.error('Campaign created but some posts failed to save.')
    } else {
      toast.success(`Campaign created with ${postsToInsert.length} AI-generated posts!`)
    }
    onCreated()
    onClose()
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'

  // SETUP STEP
  if (step === 'setup') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">New AI Campaign</h3>
          <p className="text-sm text-gray-500 mb-5">
            {tier >= 4 ? 'Elite: up to 30 days' : 'Pro: up to 5 days'} — AI will generate all posts.
          </p>

          {genError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{genError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Campaign Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Spring Termite Season" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Campaign Topic *</label>
              <textarea value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                rows={2} placeholder="e.g. Promote spring termite inspections and treatment deals" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Tone</label>
              <select value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))}
                className={`${inputCls} bg-white`}>
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
                <option value="urgent">Urgent</option>
                <option value="friendly">Friendly</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Duration</label>
              <select value={form.durationIndex} onChange={e => setForm(p => ({ ...p, durationIndex: parseInt(e.target.value) }))}
                className={`${inputCls} bg-white`}>
                {durations.map((d, i) => (
                  <option key={i} value={i}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Platforms *</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ALL_PLATFORMS.map(({ key, label, icon }) => {
                  const enabled = !connectedKeys || connectedKeys.length === 0 || connectedKeys.includes(key)
                  return (
                    <label
                      key={key}
                      title={enabled ? label : `Connect ${label} in the Connections tab`}
                      className={`flex items-center gap-1.5 text-sm cursor-pointer ${enabled ? 'text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                      <input type="checkbox"
                        checked={form.platforms.includes(key)}
                        disabled={!enabled}
                        onChange={() => enabled && togglePlatform(key)}
                        className="accent-emerald-600 disabled:opacity-40"
                      />
                      <span>{icon}</span>
                      <span>{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Start Date (optional)</label>
              <input type="date" value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                className={inputCls} />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleGenerate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
                ✨ Generate {selectedDuration.posts} Posts with AI
              </button>
              <button onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // GENERATING STEP
  if (step === 'generating') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-4 animate-pulse">✨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Posts…</h3>
          <p className="text-sm text-gray-500">AI is writing {selectedDuration.posts} posts for your campaign. This may take a moment.</p>
        </div>
      </div>
    )
  }

  // SAVING STEP
  if (step === 'saving') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-4 animate-pulse">💾</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Saving Campaign…</h3>
          <p className="text-sm text-gray-500">Creating campaign and saving all posts as drafts.</p>
        </div>
      </div>
    )
  }

  // REVIEW STEP
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Review Campaign Posts</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {generatedPosts.length} posts generated for <b>{form.title}</b>. Edit any caption before saving.
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {generatedPosts.map((post, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Day {post.day}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{post.platform}</span>
              </div>
              <textarea
                value={editedCaptions[i] || ''}
                onChange={e => {
                  const updated = [...editedCaptions]
                  updated[i] = e.target.value
                  setEditedCaptions(updated)
                }}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-2">
          <button onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            Save {generatedPosts.length} Posts as Drafts
          </button>
          <button onClick={() => setStep('setup')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            ← Back
          </button>
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 ml-auto">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
