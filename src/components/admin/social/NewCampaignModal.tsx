import { useState } from 'react'
import { toast } from 'sonner'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import { usePlan } from '../../../context/PlanContext'
import ImageStrategyChooser, { EMPTY_STRATEGY, type ImageStrategyValue } from './ImageStrategyChooser'

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

type WizardStep = 'setup' | 'submitting'

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
  const [strategy, setStrategy] = useState<ImageStrategyValue>(EMPTY_STRATEGY)
  const [genError, setGenError] = useState('')

  function togglePlatform(p: string) {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }))
  }

  const selectedDuration = durations[form.durationIndex]

  // S242 async flow: submit hands off to the generate-social-batch edge function,
  // which writes the campaign + a queued campaign_jobs row and returns 202. The
  // worker (process-campaign-job) generates captions, runs the image strategy,
  // and inserts the posts server-side. Progress shows in the Campaigns tab
  // (campaign_jobs realtime). No client-side caption gen / post inserts.
  async function handleSubmit() {
    if (!tenantId) return
    if (!form.title.trim()) { toast.error('Campaign title is required.'); return }
    if (!form.topic.trim()) { toast.error('Campaign topic is required.'); return }
    if (form.platforms.length === 0) { toast.error('Select at least one platform.'); return }
    if (strategy.image_strategy === 'folder' && !strategy.image_strategy_folder) {
      toast.error('Pick a folder for the folder image strategy.'); return
    }
    if (strategy.image_strategy === 'fixed' && !strategy.image_strategy_image_id) {
      toast.error('Choose an image for the fixed image strategy.'); return
    }

    setStep('submitting')
    setGenError('')

    const { error } = await supabase.functions.invoke('generate-social-batch', {
      body: {
        tenant_id: tenantId,
        title: form.title.trim(),
        goal: form.topic.trim(),
        tone: form.tone,
        duration_days: selectedDuration.days,
        platforms: form.platforms,
        start_date: form.start_date || null,
        posts_requested: selectedDuration.posts,
        image_strategy: strategy.image_strategy,
        image_strategy_folder: strategy.image_strategy_folder,
        image_strategy_image_id: strategy.image_strategy_image_id,
      },
    })

    if (error) {
      let msg = error.message || 'Failed to start campaign generation.'
      if (error instanceof FunctionsHttpError) {
        try {
          const body = await error.context.json()
          if (body?.error) msg = body.error
        } catch { /* keep generic */ }
      }
      setGenError(msg)
      setStep('setup')
      return
    }

    toast.success(`Campaign queued — generating ${selectedDuration.posts} posts. Track progress in the Campaigns tab.`)
    onCreated()
    onClose()
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'

  if (step === 'submitting') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-4 animate-pulse">✨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Starting generation…</h3>
          <p className="text-sm text-gray-500">Queuing your campaign. Posts will appear as drafts when ready.</p>
        </div>
      </div>
    )
  }

  // SETUP STEP
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">New AI Campaign</h3>
        <p className="text-sm text-gray-500 mb-5">
          {tier >= 4 ? 'Elite: up to 30 days' : 'Pro: up to 5 days'} — AI generates all posts in the background.
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

          {/* S242 — image-strategy selector (between Duration and Platforms) */}
          <ImageStrategyChooser value={strategy} onChange={setStrategy} />

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
            <button onClick={handleSubmit}
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
