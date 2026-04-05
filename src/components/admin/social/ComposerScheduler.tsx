import { Send, Loader2 } from 'lucide-react'

interface Props {
  platform: 'facebook' | 'instagram' | 'both'
  scheduleMode: 'now' | 'later' | 'smart'
  scheduledFor: string
  smartSchedule: { scheduled_for: string; reasoning: string } | null
  smartLoading: boolean
  publishing: boolean
  saving: boolean
  editingPostId: string | null
  schedulingDayCap?: number   // Pro: 5, Elite: unlimited (undefined)
  isStarter?: boolean         // Starter tier: copy-paste flow only
  onScheduleModeChange: (m: 'now' | 'later' | 'smart') => void
  onScheduledForChange: (v: string) => void
  onGetSmartSchedule: () => void
  onSaveAsDraft: () => void
  onPublishNow: () => void
  onResetForm: () => void
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function ComposerScheduler({
  platform, scheduleMode, scheduledFor, smartSchedule, smartLoading,
  publishing, saving, editingPostId, schedulingDayCap, isStarter,
  onScheduleModeChange, onScheduledForChange, onGetSmartSchedule,
  onSaveAsDraft, onPublishNow, onResetForm,
}: Props) {
  const maxDate = schedulingDayCap
    ? new Date(Date.now() + schedulingDayCap * 86400000).toISOString().substring(0, 16)
    : undefined
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Schedule & Publish</h3>
      <div className="flex flex-wrap gap-4 mb-4">
        {([['now', 'Post now'], ['later', 'Schedule for later'], ['smart', '✨ Smart Schedule']] as const).map(([m, label]) => (
          <label key={m} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="scheduleMode" checked={scheduleMode === m}
              onChange={() => onScheduleModeChange(m as 'now' | 'later' | 'smart')}
              className="text-emerald-500 focus:ring-emerald-500" />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {scheduleMode === 'later' && (
        <div className="mb-4">
          <input type="datetime-local" value={scheduledFor}
            onChange={e => onScheduledForChange(e.target.value)}
            min={new Date().toISOString().substring(0, 16)} max={maxDate} className={inputClass} />
          {schedulingDayCap && (
            <p className="text-xs text-gray-400 mt-1">Pro plan scheduling limited to {schedulingDayCap} days. Upgrade to Elite for unlimited scheduling.</p>
          )}
        </div>
      )}

      {scheduleMode === 'smart' && (
        <div className="mb-4 bg-gray-50 rounded-lg p-4">
          {!smartSchedule && !smartLoading && (
            <>
              <p className="text-sm text-gray-600 mb-3">AI will pick the best day and time based on your industry.</p>
              <button onClick={onGetSmartSchedule}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                Get Best Time
              </button>
            </>
          )}
          {smartLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Thinking about the best time...
            </div>
          )}
          {smartSchedule && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                📅 Best time: {new Date(smartSchedule.scheduled_for).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(smartSchedule.scheduled_for).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-500 mb-3">{smartSchedule.reasoning}</p>
              <div className="flex items-center gap-3">
                <input type="datetime-local" value={scheduledFor} onChange={e => onScheduledForChange(e.target.value)}
                  min={new Date().toISOString().substring(0, 16)} max={maxDate} className={`flex-1 ${inputClass}`} />
                <button onClick={onGetSmartSchedule} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap">Try Again</button>
              </div>
            </div>
          )}
        </div>
      )}

      {(platform === 'instagram' || platform === 'both') && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-pink-700">Instagram posts are saved as drafts. Connect a Meta Business Account to enable direct publishing.</p>
        </div>
      )}

      {isStarter && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-800">Starter plan: posts are saved for you to copy and paste manually to your Facebook page. Upgrade to Grow to enable direct posting.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onSaveAsDraft} disabled={saving}
          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button onClick={onPublishNow} disabled={publishing}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <Send size={14} /> {publishing ? 'Saving...' : isStarter ? 'Copy & Post Manually' : 'Publish Now'}
        </button>
      </div>

      {editingPostId && (
        <button onClick={onResetForm} className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline">
          Cancel editing — start new post
        </button>
      )}
    </div>
  )
}
