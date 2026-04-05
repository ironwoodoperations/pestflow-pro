import { Loader2 } from 'lucide-react'
import type { RefObject } from 'react'

interface Props {
  caption: string
  onCaptionChange: (v: string) => void
  captionRef: RefObject<HTMLTextAreaElement | null>
  charLimit: number
  aiTopic: string
  onAiTopicChange: (v: string) => void
  aiCaptions: string[]
  aiLoading: boolean
  aiError: string
  aiDailyCount: number
  aiDailyLimit: number
  postsPerGeneration?: number
  onGenerate: () => void
  onSelectCaption: (c: string) => void
  onAppendEmoji: (e: string) => void
  editingPostId: string | null
}

const emojis = ['🐜', '🦟', '🪳', '🕷️', '🐭', '🐝', '🦂', '🌿', '✅', '🔥', '📞', '⭐']

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function ComposerCaptionEditor({
  caption, onCaptionChange, captionRef, charLimit,
  aiTopic, onAiTopicChange, aiCaptions, aiLoading, aiError,
  aiDailyCount, aiDailyLimit, postsPerGeneration = 3,
  onGenerate, onSelectCaption, onAppendEmoji, editingPostId,
}: Props) {
  const atLimit = aiDailyLimit !== Infinity && aiDailyCount >= aiDailyLimit
  const generateLabel = postsPerGeneration === 1 ? 'Generate Caption' : `Generate ${postsPerGeneration} Captions`
  const charsRemaining = charLimit - caption.length

  return (
    <>
      {/* AI Caption Generator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">AI Caption Generator</h3>
        <div className="flex gap-2 mb-4">
          <input value={aiTopic} onChange={e => onAiTopicChange(e.target.value)}
            placeholder="e.g. mosquito season tips" className={`flex-1 ${inputClass}`}
            onKeyDown={e => { if (e.key === 'Enter' && !atLimit) onGenerate() }} />
          <button onClick={onGenerate} disabled={aiLoading || atLimit}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
            {aiLoading ? <><Loader2 size={14} className="animate-spin" /> Asking AI...</> : generateLabel}
          </button>
        </div>
        {atLimit && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            AI generation limit reached for today ({aiDailyCount}/{aiDailyLimit}). You can still write posts manually.
          </p>
        )}
        {aiError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-sm text-red-700">{aiError}</p></div>}
        {aiCaptions.length > 0 && (
          <div className="space-y-3">
            {aiCaptions.map((c, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{c}</p>
                <button onClick={() => onSelectCaption(c)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Use This Caption →</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caption Textarea */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">{editingPostId ? 'Edit Caption' : 'Caption'}</h3>
        <textarea ref={captionRef} value={caption} onChange={e => onCaptionChange(e.target.value)}
          rows={6} placeholder="Write your caption here or pick one from AI above..." className={`${inputClass} resize-none mb-2`} />
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs ${charsRemaining < 0 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {charsRemaining.toLocaleString()} characters remaining
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {emojis.map(emoji => (
            <button key={emoji} onClick={() => onAppendEmoji(emoji)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-lg transition-colors"
              title={`Add ${emoji}`}>{emoji}</button>
          ))}
        </div>
      </div>
    </>
  )
}
