import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import type { ComposerForm } from './useComposer'

interface Props {
  tenantId: string | null
  tier: number
  form: ComposerForm
  aiCaptions: string[]
  editingPostId: string | null
  onPosted?: () => void
  resetForm: () => void
}

export function usePublishPost({ tenantId, tier, form, aiCaptions, editingPostId, onPosted, resetForm }: Props) {
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function saveAsDraft() {
    if (!form.caption.trim() || !tenantId) return
    setSaving(true)
    const postData = {
      tenant_id: tenantId, platform: form.platform, caption: form.caption,
      image_url: form.imageUrl || null, status: 'draft' as const, ai_generated: aiCaptions.length > 0,
      scheduled_for: (form.scheduleMode === 'later' || form.scheduleMode === 'smart') && form.scheduledFor
        ? new Date(form.scheduledFor).toISOString() : null,
    }
    if (editingPostId) { await supabase.from('social_posts').update(postData).eq('id', editingPostId) }
    else { await supabase.from('social_posts').insert(postData) }
    resetForm(); setSaving(false); onPosted?.()
  }

  async function publishNow() {
    if (!form.caption.trim() || !tenantId) return
    setPublishing(true)

    // Starter (tier 1): save as 'sent' draft and prompt copy-paste
    if (tier < 2) {
      const postData = {
        tenant_id: tenantId, platform: form.platform, caption: form.caption,
        image_url: form.imageUrl || null, status: 'sent' as const, ai_generated: aiCaptions.length > 0,
        scheduled_for: null,
      }
      if (editingPostId) { await supabase.from('social_posts').update(postData).eq('id', editingPostId) }
      else { await supabase.from('social_posts').insert(postData) }
      toast.info('Post saved! Copy this post and paste it to your Facebook page.')
      resetForm(); setPublishing(false); onPosted?.(); return
    }

    // Grow+ (tier 2+): call bundle.social via post-to-social edge function
    const scheduledFor = (form.scheduleMode === 'later' || form.scheduleMode === 'smart') && form.scheduledFor
      ? new Date(form.scheduledFor).toISOString() : undefined

    // Insert post row first so we have a postId to pass to the edge function
    const postData = {
      tenant_id: tenantId, platform: form.platform, caption: form.caption,
      image_url: form.imageUrl || null, status: 'draft' as const, ai_generated: aiCaptions.length > 0,
      scheduled_for: scheduledFor || null,
    }
    let postId = editingPostId
    if (editingPostId) {
      await supabase.from('social_posts').update(postData).eq('id', editingPostId)
    } else {
      const { data: inserted } = await supabase.from('social_posts').insert(postData).select('id').single()
      postId = inserted?.id || null
    }
    if (!postId) { setPublishing(false); return }

    const platforms = form.platform === 'both' ? ['facebook', 'instagram'] : [form.platform]

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-to-social`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: form.caption, platforms, scheduledFor, tenantId, postId }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg: string = data?.error || 'Failed to post. Please try again.'
        await supabase.from('social_posts').update({ status: 'failed', error_msg: errMsg }).eq('id', postId)
        toast.error(errMsg)
      } else {
        toast.success(scheduledFor ? 'Post scheduled via bundle.social!' : 'Post published via bundle.social!')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error'
      await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', postId)
      toast.error('Failed to reach posting service. Please try again.')
    }

    resetForm(); setPublishing(false); onPosted?.()
  }

  return { publishNow, saveAsDraft, publishing, saving }
}
