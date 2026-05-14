import { Send, Loader2, Lock } from 'lucide-react'

interface Props {
  scheduleMode: 'now' | 'later' | 'smart'
  scheduledFor: string
  smartSchedule: { scheduled_for: string; reasoning: string } | null
  smartLoading: boolean
  publishing: boolean
  saving: boolean
  editingPostId: string | null
  schedulingDayCap?: number   // Pro: 5, Elite: unlimited (undefined)
  isStarter?: boolean         // Starter tier: copy-paste flow only
  uploadBusy?: boolean        // true while a file upload is in flight
  onScheduleModeChange: (m: 'now' | 'later' | 'smart') => void
  onScheduledForChange: (v: string) => void
  onGetSmartSchedule: () => void
  onSaveAsDraft: () => void
  onPublishNow: () => void
  onResetForm: () => void
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function ComposerScheduler({
  scheduleMode, scheduledFor, smartSchedule, smartLoading,
  publishing, saving, editingPostId, schedulingDayCap, isStarter, uploadBusy,
  onScheduleModeChange, onScheduledForChange, onGetSmartSchedule,
  onSaveAsDraft, onPublishNow, onResetForm,
}: Props) {
  const maxDate = schedulingDayCap
    ? new Date(Date.now() + schedulingDayCap * 86400000).toISOString().substring(0, 16)
    : undefined
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Schedule & Publish</h3>
      {isStarter ? (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-500">Scheduling available on Growth plan and above</p>
        </div>
      ) : (
        <>
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
                <p className="text-xs text-gray-400 mt-1">Scheduling limited to {schedulingDayCap} days ahead on your current plan.</p>
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

        </>
      )}

      <div className="flex gap-3">
        <button onClick={onSaveAsDraft} disabled={saving || uploadBusy}
          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : uploadBusy ? 'Uploading...' : 'Save as Draft'}
        </button>
        <button onClick={onPublishNow} disabled={publishing || uploadBusy}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <Send size={14} /> {publishing ? 'Saving...' : uploadBusy ? 'Uploading...' : isStarter ? 'Copy & Post Manually' : 'Publish Now'}
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
