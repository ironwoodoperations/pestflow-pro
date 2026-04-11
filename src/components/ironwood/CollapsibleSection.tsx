import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  isComplete?: boolean
  isLocked?: boolean
  completedLabel?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function CollapsibleSection({
  title,
  isComplete = false,
  isLocked = false,
  completedLabel,
  defaultOpen,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen ?? !isComplete)

  const complete = isComplete

  return (
    <div className={`border rounded-lg overflow-hidden ${complete ? 'border-green-800/70' : 'border-gray-700'}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition ${
          complete
            ? 'bg-green-950/50 hover:bg-green-950/80 text-green-300'
            : 'bg-gray-800/70 hover:bg-gray-800 text-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {complete ? (
            <span className="text-green-400 shrink-0 text-sm">✓</span>
          ) : isLocked ? (
            <span className="shrink-0 text-sm">🔒</span>
          ) : null}
          <span className="font-semibold text-sm truncate">{title}</span>
          {complete && completedLabel && (
            <span className="text-xs text-green-400/60 font-normal shrink-0 ml-1">{completedLabel}</span>
          )}
        </div>
        <span className={`text-xs shrink-0 ml-2 ${complete ? 'text-green-700' : 'text-gray-500'}`}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      <div
        style={{
          maxHeight: open ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 200ms ease',
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
