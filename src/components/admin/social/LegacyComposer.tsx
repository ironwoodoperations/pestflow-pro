import { useComposer } from './useComposer'
import { useSocialTier } from '../useSocialTier'
import { useAiCaptionQuota } from '../useAiCaptionQuota'
import { useTenant } from '../../../context/TenantBootProvider'
import { useTierGate } from '../../common/useTierGate'
import UpgradePrompt from '../../common/UpgradePrompt'
import ComposerPlatformSelector from './ComposerPlatformSelector'
import ComposerTemplates from './ComposerTemplates'
import ComposerCaptionEditor from './ComposerCaptionEditor'
import ComposerImagePicker from './ComposerImagePicker'
import ComposerScheduler from './ComposerScheduler'

// s248 — Grow tier gates post scheduling (composer smart-schedule + the
// post-to-social scheduling path). Same #134 pattern as MediaTab.
const SCHEDULE_MIN_TIER = 2

interface Props {
  onClose?: () => void
  onPosted?: () => void
  connectedKeys?: string[]
}

export default function LegacyComposer({ onClose, onPosted, connectedKeys }: Props) {
  const { isStarter } = useSocialTier()
  const { id: tenantId } = useTenant()
  const quota = useAiCaptionQuota(tenantId ?? '')
  const scheduleGate = useTierGate(SCHEDULE_MIN_TIER)
  const c = useComposer(
    onPosted,
    isStarter ? quota.increment : undefined,
    scheduleGate.openPrompt,
  )

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
          connectedKeys={connectedKeys ?? []}
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
          mediaType={c.form.mediaType}
          // Paste-URL + library picks are images; selecting either resets the slot to
          // 'image' (a video, if present, is replaced — one media slot per post).
          onImageUrlChange={v => c.setForm(prev => ({ ...prev, imageUrl: v, mediaType: 'image' }))}
          onFileUpload={c.handleFileUpload}
          uploadState={c.uploadState}
          uploadNotice={c.uploadNotice}
          previewUrl={c.previewUrl}
        />

        <ComposerScheduler
          scheduleMode={c.form.scheduleMode}
          scheduledFor={c.form.scheduledFor}
          smartSchedule={c.smartSchedule}
          smartLoading={c.smartLoading}
          publishing={c.publishing}
          saving={c.saving}
          uploadBusy={c.uploadState === 'uploading'}
          editingPostId={c.editingPostId}
          schedulingDayCap={c.schedulingDayCap}
          isStarter={isStarter}
          onScheduleModeChange={m => c.setForm(prev => ({ ...prev, scheduleMode: m }))}
          onScheduledForChange={v => c.setForm(prev => ({ ...prev, scheduledFor: v }))}
          onGetSmartSchedule={c.getSmartSchedule}
          onSaveAsDraft={c.saveAsDraft}
          onPublishNow={c.publishNow}
          onResetForm={c.resetForm}
          onUpgradeRequired={scheduleGate.openPrompt}
        />
      </div>

      <UpgradePrompt
        open={scheduleGate.open}
        requiredTier={SCHEDULE_MIN_TIER}
        featureName="Post scheduling"
        onClose={scheduleGate.closePrompt}
      />
    </div>
  )
}
