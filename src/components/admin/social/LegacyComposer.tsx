import { useComposer } from './useComposer'
import { useSocialTier } from '../useSocialTier'
import { useAiCaptionQuota } from '../useAiCaptionQuota'
import { useTenant } from '../../../hooks/useTenant'
import ComposerPlatformSelector from './ComposerPlatformSelector'
import ComposerTemplates from './ComposerTemplates'
import ComposerCaptionEditor from './ComposerCaptionEditor'
import ComposerImagePicker from './ComposerImagePicker'
import ComposerScheduler from './ComposerScheduler'

interface Props {
  onClose?: () => void
  onPosted?: () => void
}

export default function LegacyComposer({ onClose, onPosted }: Props) {
  const { isStarter } = useSocialTier()
  const { tenantId } = useTenant()
  const quota = useAiCaptionQuota(tenantId ?? '')
  const c = useComposer(onPosted, isStarter ? quota.increment : undefined)

  if (c.loading) return <div className="p-6 text-center text-gray-400">Loading composer...</div>

  // Starters: use localStorage quota instead of DB-based daily count
  const displayAiDailyCount = isStarter ? quota.used : c.aiDailyCount
  const displayAiDailyLimit = isStarter ? quota.limit : c.aiDailyLimit

  return (
    <div>
      {onClose && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
      )}

      <div className="space-y-6">
        <ComposerPlatformSelector
          platform={c.form.platform}
          industry={c.industry}
          onSelect={p => c.setForm(prev => ({ ...prev, platform: p }))}
        />

        <ComposerTemplates
          industry={c.industry}
          businessName={c.businessName}
          onSelectTopic={topic => {
            c.setAiTopic(topic)
            setTimeout(() => c.generateCaptions(), 100)
          }}
        />

        <ComposerCaptionEditor
          caption={c.form.caption}
          onCaptionChange={v => c.setForm(prev => ({ ...prev, caption: v }))}
          captionRef={c.captionRef}
          charLimit={c.charLimit}
          aiTopic={c.aiTopic}
          onAiTopicChange={c.setAiTopic}
          aiCaptions={c.aiCaptions}
          aiLoading={c.aiLoading}
          aiError={c.aiError}
          aiDailyCount={displayAiDailyCount}
          aiDailyLimit={displayAiDailyLimit}
          postsPerGeneration={c.postsPerGeneration}
          onGenerate={c.generateCaptions}
          onSelectCaption={cap => c.setForm(prev => ({ ...prev, caption: cap }))}
          onAppendEmoji={c.appendEmoji}
          editingPostId={c.editingPostId}
          isStarter={isStarter}
        />

        <ComposerImagePicker
          imageUrl={c.form.imageUrl}
          onImageUrlChange={v => c.setForm(prev => ({ ...prev, imageUrl: v }))}
        />

        <ComposerScheduler
          platform={c.form.platform}
          scheduleMode={c.form.scheduleMode}
          scheduledFor={c.form.scheduledFor}
          smartSchedule={c.smartSchedule}
          smartLoading={c.smartLoading}
          publishing={c.publishing}
          saving={c.saving}
          editingPostId={c.editingPostId}
          schedulingDayCap={c.schedulingDayCap}
          isStarter={isStarter}
          onScheduleModeChange={m => c.setForm(prev => ({ ...prev, scheduleMode: m }))}
          onScheduledForChange={v => c.setForm(prev => ({ ...prev, scheduledFor: v }))}
          onGetSmartSchedule={c.getSmartSchedule}
          onSaveAsDraft={c.saveAsDraft}
          onPublishNow={c.publishNow}
          onResetForm={c.resetForm}
        />
      </div>
    </div>
  )
}
