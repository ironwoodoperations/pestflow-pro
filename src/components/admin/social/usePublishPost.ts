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

    const { data: intgData } = await supabase.from('settings').select('value')
      .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
    const intg = intgData?.value || {}
    const postData = {
      tenant_id: tenantId, platform: form.platform, caption: form.caption,
      image_url: form.imageUrl || null, status: 'draft' as const, ai_generated: aiCaptions.length > 0,
      scheduled_for: (form.scheduleMode === 'later' || form.scheduleMode === 'smart') && form.scheduledFor
        ? new Date(form.scheduledFor).toISOString() : null,
    }
    let postId = editingPostId
    if (editingPostId) { await supabase.from('social_posts').update(postData).eq('id', editingPostId) }
    else {
      const { data: inserted } = await supabase.from('social_posts').insert(postData).select('id').single()
      postId = inserted?.id || null
    }
    if (!postId) { setPublishing(false); return }

    if (form.platform === 'instagram') {
      await supabase.from('social_posts').update({ status: 'draft', error_msg: 'Instagram requires connected Business Account.' }).eq('id', postId)
      resetForm(); setPublishing(false); onPosted?.(); return
    }
    const fbToken = intg.facebook_access_token; const fbPageId = intg.facebook_page_id
    if (!fbToken || !fbPageId) {
      await supabase.from('social_posts').update({ status: 'draft' }).eq('id', postId)
      toast.info('Connect Facebook in Settings → Integrations to post directly.')
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

  return { publishNow, saveAsDraft, publishing, saving }
}
